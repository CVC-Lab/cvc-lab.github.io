#!/usr/bin/env python3
"""End-to-end voice-over-radio CLI.

Pipeline: WAV -> mono+resample -> Opus encode -> set_media_frames -> sim.run() ->
voice_results -> Opus decode (with PLC) -> resample back -> WAV.

Both CSMA/CA (Silvus model) and TDMA (TSM barrage model) MAC layers are
supported through the same script; pick with --mac.

KPIs (PDR, latency p50/p95) are written to --kpis as JSON.

Required deps:
    pip install soundfile numpy
Optional deps:
    pip install opuslib   # real codec; falls back to PCM passthrough if missing
    pip install samplerate # high-quality resampling; falls back to linear if missing
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np

try:
    import soundfile as sf
    HAVE_SOUNDFILE = True
except ImportError:
    sf = None
    HAVE_SOUNDFILE = False

try:
    import opuslib
    HAVE_OPUS = True
    OPUS_IMPORT_ERROR: Optional[Exception] = None
except Exception as exc:  # opuslib raises a plain Exception when libopus is missing
    opuslib = None  # type: ignore[assignment]
    HAVE_OPUS = False
    OPUS_IMPORT_ERROR = exc

try:
    import samplerate as sr_lib
    HAVE_SAMPLERATE = True
except ImportError:
    sr_lib = None
    HAVE_SAMPLERATE = False


import radio_sim


OPUS_RATE = 48000
OPUS_FRAME_MS = 20
OPUS_FRAME_SAMPLES = OPUS_RATE * OPUS_FRAME_MS // 1000  # 960


# ---------------------- WAV / resampling helpers ----------------------


def read_wav_mono(path: Path) -> Tuple[np.ndarray, int]:
    """Read a WAV file, downmix to mono, return (float32 in [-1,1], sample_rate)."""
    if HAVE_SOUNDFILE:
        data, sample_rate = sf.read(str(path), dtype="float32", always_2d=True)
        mono = data.mean(axis=1)
        return mono.astype(np.float32, copy=False), int(sample_rate)
    # Fallback: stdlib wave (PCM only).
    with wave.open(str(path), "rb") as wf:
        sample_rate = wf.getframerate()
        nchannels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        nframes = wf.getnframes()
        raw = wf.readframes(nframes)
    if sampwidth == 2:
        pcm = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sampwidth == 1:
        pcm = (np.frombuffer(raw, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
    else:
        raise RuntimeError(f"Unsupported wav sample width {sampwidth}; install soundfile")
    if nchannels > 1:
        pcm = pcm.reshape(-1, nchannels).mean(axis=1)
    return pcm.astype(np.float32, copy=False), sample_rate


def write_wav_mono(path: Path, pcm: np.ndarray, sample_rate: int) -> None:
    """Write mono float32 PCM as 16-bit PCM WAV."""
    pcm_clipped = np.clip(pcm, -1.0, 1.0)
    pcm_i16 = (pcm_clipped * 32767.0).astype(np.int16)
    if HAVE_SOUNDFILE:
        sf.write(str(path), pcm_i16, sample_rate, subtype="PCM_16")
        return
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_i16.tobytes())


def resample(pcm: np.ndarray, from_rate: int, to_rate: int) -> np.ndarray:
    """Resample mono float32 PCM. Uses samplerate (sinc) if available, else linear."""
    if from_rate == to_rate:
        return pcm
    if HAVE_SAMPLERATE:
        return sr_lib.resample(pcm, to_rate / from_rate, "sinc_best").astype(
            np.float32, copy=False
        )
    # Linear fallback. Acceptable for narrowband voice.
    n_in = pcm.shape[0]
    n_out = int(round(n_in * to_rate / from_rate))
    if n_out <= 0:
        return np.zeros(0, dtype=np.float32)
    x_old = np.linspace(0.0, 1.0, n_in, endpoint=False)
    x_new = np.linspace(0.0, 1.0, n_out, endpoint=False)
    return np.interp(x_new, x_old, pcm).astype(np.float32)


# ---------------------- codec abstraction ----------------------


@dataclass
class EncodedAudio:
    """Encoded audio frames + metadata needed for later decode."""

    frames: List[bytes]
    sample_rate_hz: int
    samples_per_frame: int
    codec: str  # "opus" | "pcm"


def encode_opus(pcm_48k: np.ndarray, bitrate_bps: int) -> EncodedAudio:
    if not HAVE_OPUS:
        raise RuntimeError(
            "Opus codec requested but `opuslib` not installed. "
            "Run `pip install opuslib`, or pick --codec pcm."
        )
    enc = opuslib.Encoder(OPUS_RATE, 1, opuslib.APPLICATION_VOIP)
    enc.bitrate = bitrate_bps
    out: List[bytes] = []
    n_frames = pcm_48k.shape[0] // OPUS_FRAME_SAMPLES
    pcm_i16 = (np.clip(pcm_48k, -1.0, 1.0) * 32767.0).astype(np.int16)
    for i in range(n_frames):
        frame = pcm_i16[i * OPUS_FRAME_SAMPLES : (i + 1) * OPUS_FRAME_SAMPLES]
        out.append(enc.encode(frame.tobytes(), OPUS_FRAME_SAMPLES))
    return EncodedAudio(
        frames=out,
        sample_rate_hz=OPUS_RATE,
        samples_per_frame=OPUS_FRAME_SAMPLES,
        codec="opus",
    )


def decode_opus(
    encoded: EncodedAudio, frame_payloads: List[Optional[bytes]]
) -> np.ndarray:
    if not HAVE_OPUS:
        raise RuntimeError("Opus decode requested but `opuslib` not installed")
    dec = opuslib.Decoder(OPUS_RATE, 1)
    out_blocks: List[np.ndarray] = []
    for i, payload in enumerate(frame_payloads):
        if payload is not None and len(payload) > 0:
            try:
                pcm_bytes = dec.decode(payload, OPUS_FRAME_SAMPLES, decode_fec=False)
            except Exception:
                pcm_bytes = dec.decode(b"", OPUS_FRAME_SAMPLES, decode_fec=False)
        else:
            # Lost frame: invoke Opus packet-loss concealment.
            pcm_bytes = dec.decode(b"", OPUS_FRAME_SAMPLES, decode_fec=False)
        block = (
            np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        )
        out_blocks.append(block)
    if not out_blocks:
        return np.zeros(0, dtype=np.float32)
    return np.concatenate(out_blocks)


def encode_pcm(pcm: np.ndarray, sample_rate_hz: int) -> EncodedAudio:
    """PCM passthrough: chunk into 20 ms i16 frames at the given rate."""
    samples_per_frame = sample_rate_hz * OPUS_FRAME_MS // 1000
    pcm_i16 = (np.clip(pcm, -1.0, 1.0) * 32767.0).astype(np.int16)
    n_frames = pcm_i16.shape[0] // samples_per_frame
    frames = [
        bytes(pcm_i16[i * samples_per_frame : (i + 1) * samples_per_frame])
        for i in range(n_frames)
    ]
    return EncodedAudio(
        frames=frames,
        sample_rate_hz=sample_rate_hz,
        samples_per_frame=samples_per_frame,
        codec="pcm",
    )


def decode_pcm(
    encoded: EncodedAudio, frame_payloads: List[Optional[bytes]]
) -> np.ndarray:
    blocks: List[np.ndarray] = []
    for payload in frame_payloads:
        if payload is None:
            blocks.append(np.zeros(encoded.samples_per_frame, dtype=np.float32))
        else:
            blocks.append(
                np.frombuffer(payload, dtype=np.int16).astype(np.float32) / 32768.0
            )
    if not blocks:
        return np.zeros(0, dtype=np.float32)
    return np.concatenate(blocks)


# ---------------------- sim glue ----------------------


def build_config(
    *,
    mac: str,
    num_nodes: int,
    area_m: float,
    sim_duration_s: float,
    seed: int,
    mtu_bytes: int,
    playout_slack_ms: float,
) -> radio_sim.SimConfig:
    cfg = radio_sim.SimConfig()
    cfg.set_num_nodes(num_nodes)
    cfg.set_area_size_m(area_m)
    cfg.set_sim_duration_s(sim_duration_s)
    cfg.set_seed(seed)
    cfg.set_free_space_path_loss()
    cfg.set_media_mtu_bytes(mtu_bytes)
    cfg.set_media_playout_slack_ms(playout_slack_ms)
    if mac == "csma":
        cfg.set_csma_mac()
    elif mac == "tdma":
        cfg.set_tdma_mac()
    else:
        raise ValueError(f"unknown mac: {mac}")
    return cfg


def build_frame_dicts(
    encoded: EncodedAudio,
    *,
    sender_id: int,
    receiver_id: int,
    stream_id: int,
    message_id: int,
    start_s: float,
) -> List[dict]:
    period_s = encoded.samples_per_frame / encoded.sample_rate_hz
    return [
        {
            "time_s": start_s + i * period_s,
            "sender_id": sender_id,
            "dest_id": receiver_id,
            "stream_id": stream_id,
            "message_id": message_id,
            "frame_index": i,
            "payload": payload,
            "media_kind": "audio",
        }
        for i, payload in enumerate(encoded.frames)
    ]


def select_voice_payloads(
    summary: dict, *, sender_id: int, receiver_id: int, message_id: int
) -> List[Optional[bytes]]:
    """Pull the (sender, receiver, message) frame payload list out of the run summary.

    Tries `voice_results` first, falls back to `media_results` since the same
    payloads also appear there for media_kind == "audio".
    """
    for entry in summary.get("voice_results", []):
        if (
            entry["sender_id"] == sender_id
            and entry["receiver_id"] == receiver_id
            and entry["message_id"] == message_id
        ):
            return list(entry["frame_payloads"])
    for entry in summary.get("media_results", []):
        if (
            entry["sender_id"] == sender_id
            and entry["receiver_id"] == receiver_id
            and entry["stream_id"] == message_id
            and entry.get("media_kind") == "audio"
        ):
            return list(entry["frame_payloads"])
    raise RuntimeError(
        f"no voice/media result for sender={sender_id} receiver={receiver_id} "
        f"message_id={message_id}; available voice keys = "
        f"{[(e['sender_id'], e['receiver_id'], e['message_id']) for e in summary.get('voice_results', [])]}"
    )


# ---------------------- main ----------------------


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--in", dest="in_wav", required=True, type=Path,
                        help="input WAV path")
    parser.add_argument("--out", dest="out_wav", required=True, type=Path,
                        help="output WAV path")
    parser.add_argument("--mac", choices=["csma", "tdma"], default="csma",
                        help="MAC layer to transmit through")
    parser.add_argument("--kpis", default="kpis.json", type=Path,
                        help="output KPI JSON path")
    parser.add_argument("--codec", choices=["opus", "pcm"], default="opus",
                        help="voice codec")
    parser.add_argument("--bitrate-bps", type=int, default=16000,
                        help="Opus bitrate in bits per second (ignored for pcm)")
    parser.add_argument("--sender", type=int, default=0)
    parser.add_argument("--receiver", type=int, default=1)
    parser.add_argument("--stream-id", type=int, default=1)
    parser.add_argument("--message-id", type=int, default=1)
    parser.add_argument("--num-nodes", type=int, default=4)
    parser.add_argument("--area-m", type=float, default=100.0)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--start-s", type=float, default=0.5)
    parser.add_argument("--sim-duration-s", type=float, default=None,
                        help="defaults to clip_duration + start_s + 2.0")
    parser.add_argument("--mtu-bytes", type=int, default=1200)
    parser.add_argument("--playout-slack-ms", type=float, default=400.0)
    args = parser.parse_args(argv)

    if not args.in_wav.exists():
        parser.error(f"--in path does not exist: {args.in_wav}")

    if args.codec == "opus" and not HAVE_OPUS:
        reason = OPUS_IMPORT_ERROR if OPUS_IMPORT_ERROR is not None else "opuslib not installed"
        print(
            f"warning: --codec opus unavailable ({reason}); "
            "falling back to --codec pcm. "
            "On macOS try: `brew install opus` and "
            "`DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib` before re-running.",
            file=sys.stderr,
        )
        args.codec = "pcm"

    pcm_in, in_rate = read_wav_mono(args.in_wav)
    clip_duration_s = pcm_in.shape[0] / in_rate

    if args.codec == "opus":
        pcm_codec = resample(pcm_in, in_rate, OPUS_RATE)
        encoded = encode_opus(pcm_codec, args.bitrate_bps)
    else:
        # PCM passthrough at the input sample rate.
        encoded = encode_pcm(pcm_in, in_rate)

    if not encoded.frames:
        parser.error(
            f"input audio is too short to produce any {OPUS_FRAME_MS} ms frames"
        )

    sim_duration_s = args.sim_duration_s
    if sim_duration_s is None:
        sim_duration_s = clip_duration_s + args.start_s + 2.0

    cfg = build_config(
        mac=args.mac,
        num_nodes=args.num_nodes,
        area_m=args.area_m,
        sim_duration_s=sim_duration_s,
        seed=args.seed,
        mtu_bytes=args.mtu_bytes,
        playout_slack_ms=args.playout_slack_ms,
    )
    frame_dicts = build_frame_dicts(
        encoded,
        sender_id=args.sender,
        receiver_id=args.receiver,
        stream_id=args.stream_id,
        message_id=args.message_id,
        start_s=args.start_s,
    )
    cfg.set_media_frames(frame_dicts)

    sim = radio_sim.Simulation(cfg)
    summary = sim.run()

    payloads = select_voice_payloads(
        summary,
        sender_id=args.sender,
        receiver_id=args.receiver,
        message_id=args.message_id,
    )

    if args.codec == "opus":
        pcm_decoded = decode_opus(encoded, payloads)
        pcm_out = resample(pcm_decoded, OPUS_RATE, in_rate)
    else:
        pcm_out = decode_pcm(encoded, payloads)

    args.out_wav.parent.mkdir(parents=True, exist_ok=True)
    write_wav_mono(args.out_wav, pcm_out, in_rate)

    frames_total = len(payloads)
    frames_received = sum(1 for p in payloads if p is not None)
    pdr = frames_received / frames_total if frames_total else 0.0

    summary_pdr = None
    summary_p95_ns = None
    for entry in summary.get("voice_results", []) + summary.get("media_results", []):
        if (
            entry["sender_id"] == args.sender
            and entry["receiver_id"] == args.receiver
            and entry.get("message_id", entry.get("stream_id")) == args.message_id
        ):
            summary_pdr = entry.get("pdr")
            break
    summary_p95_ns = summary.get("p95_latency_ns")

    kpis = {
        "mac": args.mac,
        "codec": args.codec,
        "bitrate_bps": args.bitrate_bps if args.codec == "opus" else None,
        "sender_id": args.sender,
        "receiver_id": args.receiver,
        "message_id": args.message_id,
        "num_nodes": args.num_nodes,
        "area_m": args.area_m,
        "seed": args.seed,
        "frames_total": frames_total,
        "frames_received": frames_received,
        "frames_lost": frames_total - frames_received,
        "pdr": pdr,
        "pdr_from_summary": summary_pdr,
        "p95_latency_ns_global": summary_p95_ns,
        "input_wav": str(args.in_wav),
        "output_wav": str(args.out_wav),
        "input_sample_rate_hz": in_rate,
        "input_duration_s": clip_duration_s,
        "sim_duration_s": sim_duration_s,
        "mtu_bytes": args.mtu_bytes,
        "playout_slack_ms": args.playout_slack_ms,
    }
    args.kpis.parent.mkdir(parents=True, exist_ok=True)
    with args.kpis.open("w") as f:
        json.dump(kpis, f, indent=2)

    print(
        f"[voice_run] mac={args.mac} codec={args.codec} "
        f"frames {frames_received}/{frames_total} pdr={pdr:.3f} "
        f"-> {args.out_wav}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
