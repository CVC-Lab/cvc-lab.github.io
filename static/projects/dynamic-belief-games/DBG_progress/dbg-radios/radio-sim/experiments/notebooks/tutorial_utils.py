"""Shared helpers for CSMA/TDMA media tutorial notebooks."""

from __future__ import annotations

import json
import math
import importlib.util
import io
import wave
from pathlib import Path
from typing import Any

CODEC_SAMPLE_RATE_HZ = 24_000


def _rebuild_hint() -> str:
    return (
        "Rebuild Python bindings in this repo:\n"
        "  PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 .venv/bin/maturin develop --release"
    )


def media_support_hint() -> str:
    return (
        "This notebook section needs media-scenario Python bindings.\n"
        f"{_rebuild_hint()}\n"
        "Then restart the notebook kernel."
    )


def _optional_call(target: Any, method: str, *args: Any) -> bool:
    fn = getattr(target, method, None)
    if callable(fn):
        fn(*args)
        return True
    return False


def _require_call(target: Any, method: str, *args: Any) -> None:
    fn = getattr(target, method, None)
    if not callable(fn):
        raise RuntimeError(
            f"radio_sim.SimConfig missing required method '{method}'.\n{_rebuild_hint()}"
        )
    fn(*args)


def visual_deps_available() -> bool:
    return all(
        importlib.util.find_spec(mod) is not None
        for mod in ("numpy", "matplotlib")
    )


def _require_numpy():
    try:
        import numpy as np
    except Exception as exc:  # pragma: no cover - environment dependent
        raise RuntimeError(
            "numpy is required for video frame visualization.\n"
            "Install notebook dependencies:\n"
            "  .venv/bin/python -m pip install -r experiments/notebooks/requirements.txt"
        ) from exc
    return np


def _require_matplotlib_pyplot():
    try:
        from matplotlib import pyplot as plt
    except Exception as exc:  # pragma: no cover - environment dependent
        raise RuntimeError(
            "matplotlib is required for plotting/animation.\n"
            "Install notebook dependencies:\n"
            "  .venv/bin/python -m pip install -r experiments/notebooks/requirements.txt"
        ) from exc
    return plt


def _require_matplotlib_animation():
    try:
        from matplotlib import animation
    except Exception as exc:  # pragma: no cover - environment dependent
        raise RuntimeError(
            "matplotlib is required for plotting/animation.\n"
            "Install notebook dependencies:\n"
            "  .venv/bin/python -m pip install -r experiments/notebooks/requirements.txt"
        ) from exc
    return animation


def import_radio_sim():
    """Import the PyO3 bindings with a clear setup error if unavailable."""
    try:
        import radio_sim  # type: ignore
    except Exception as exc:  # pragma: no cover - notebook guard
        raise RuntimeError(
            "Unable to import radio_sim. Build/install bindings first:\n"
            "  python3 -m pip install maturin\n"
            "  PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release"
        ) from exc
    cfg = radio_sim.SimConfig()
    required = [
        "set_num_nodes",
        "set_seed",
        "set_sim_duration_s",
        "set_scenario_traffic",
        "set_csma_mac",
        "set_tdma_mac",
    ]
    missing = [name for name in required if not callable(getattr(cfg, name, None))]
    if missing:
        raise RuntimeError(
            "radio_sim binding is too old for these notebooks. "
            f"Missing methods: {missing}\n{_rebuild_hint()}"
        )
    return radio_sim


def media_scenario_supported(radio_sim: Any) -> bool:
    try:
        cfg = radio_sim.SimConfig()
    except Exception:
        return False
    return callable(getattr(cfg, "set_media_scenario", None))


def _find_radio_sim_root(start: Path | None = None) -> Path:
    start = (start or Path.cwd()).resolve()
    for path in [start] + list(start.parents):
        if (path / "Cargo.toml").exists() and (path / "crates" / "radio-sim-py").exists():
            return path
    raise FileNotFoundError("Could not find radio-sim repo root from current working directory")


def _find_output_dir(radio_sim_root: Path) -> Path:
    candidates = [
        radio_sim_root / "output",
        radio_sim_root.parent / "output",
    ]
    for candidate in candidates:
        if (candidate / "comms_log.json").exists() and (candidate / "audio").is_dir():
            return candidate.resolve()
    raise FileNotFoundError(
        "Could not locate output/ with comms_log.json and audio/. "
        "Expected at radio-sim/output or ../output"
    )


def resolve_demo_paths(start: Path | None = None) -> dict[str, Path]:
    """Resolve repository and demo asset paths used by notebooks."""
    radio_sim_root = _find_radio_sim_root(start)
    output_dir = _find_output_dir(radio_sim_root)
    notebook_dir = Path(__file__).resolve().parent
    generated_dir = notebook_dir / "generated"
    generated_dir.mkdir(parents=True, exist_ok=True)
    return {
        "radio_sim_root": radio_sim_root,
        "workspace_root": output_dir.parent,
        "output_dir": output_dir,
        "comms_log": output_dir / "comms_log.json",
        "audio_dir": output_dir / "audio",
        "notebook_dir": notebook_dir,
        "generated_dir": generated_dir,
    }


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def summarize_comms_log(comms_log: dict[str, Any]) -> dict[str, Any]:
    messages = comms_log.get("messages", [])
    times = [m.get("time_s", 0.0) for m in messages]
    senders = {m.get("sender_id") for m in messages}
    return {
        "messages": len(messages),
        "channels": len(comms_log.get("channels", [])),
        "soldiers": len(comms_log.get("soldiers", [])),
        "min_time_s": min(times) if times else 0.0,
        "max_time_s": max(times) if times else 0.0,
        "unique_senders": len(senders),
    }


def build_compact_comms_log(
    source_path: Path,
    output_path: Path,
    max_messages: int = 12,
    time_scale: float = 0.14,
    start_offset_s: float = 0.25,
) -> Path:
    """Create a short scenario clip from the large comms log for notebook runtime."""
    source = load_json(source_path)
    all_messages = sorted(source.get("messages", []), key=lambda m: float(m.get("time_s", 0.0)))
    if not all_messages:
        raise ValueError("Source comms log has no messages")

    selected = all_messages[:max_messages]
    t0 = float(selected[0]["time_s"])
    remapped_messages = []
    for msg in selected:
        shifted = dict(msg)
        shifted["time_s"] = round(start_offset_s + (float(msg["time_s"]) - t0) * time_scale, 3)
        remapped_messages.append(shifted)

    compact = dict(source)
    compact["messages"] = remapped_messages
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(compact, indent=2) + "\n", encoding="utf-8")
    return output_path


def build_synthetic_media_manifest(
    output_path: Path,
    duration_s: float = 10.0,
    audio_sender: int = 0,
    audio_receiver: int = 1,
    video_sender: int = 2,
    video_receiver: int = 3,
    audio_stream_id: int = 9001,
    video_stream_id: int = 9002,
    audio_frame_ms: float = 20.0,
    video_fps: float = 8.0,
    audio_payload_bytes: int = 960,
    video_payload_bytes: int = 4096,
) -> Path:
    """Build an audio+video manifest for MediaScenario tutorial runs."""
    frames: list[dict[str, Any]] = []

    audio_count = max(1, int(math.floor(duration_s / (audio_frame_ms / 1000.0))))
    for frame_idx in range(audio_count):
        frames.append(
            {
                "time_s": round(0.25 + frame_idx * (audio_frame_ms / 1000.0), 3),
                "sender_id": audio_sender,
                "dest_id": audio_receiver,
                "stream_id": audio_stream_id,
                "message_id": audio_stream_id,
                "frame_index": frame_idx,
                "payload_bytes": max(1, audio_payload_bytes),
                "media_kind": "audio",
            }
        )

    video_count = max(1, int(math.floor(duration_s * video_fps)))
    for frame_idx in range(video_count):
        frames.append(
            {
                "time_s": round(0.5 + frame_idx / video_fps, 3),
                "sender_id": video_sender,
                "dest_id": video_receiver,
                "stream_id": video_stream_id,
                "message_id": video_stream_id,
                "frame_index": frame_idx,
                "payload_bytes": max(1, video_payload_bytes),
                "media_kind": "video",
            }
        )

    manifest = {"frames": sorted(frames, key=lambda entry: (entry["time_s"], entry["stream_id"]))}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return output_path


def make_sim_config(
    radio_sim: Any,
    mac_kind: str,
    num_nodes: int,
    sim_duration_s: float,
    seed: int,
) -> Any:
    cfg = radio_sim.SimConfig()
    _require_call(cfg, "set_num_nodes", int(num_nodes))
    _require_call(cfg, "set_seed", int(seed))
    _require_call(cfg, "set_sim_duration_s", float(sim_duration_s))
    _optional_call(cfg, "set_control_overlay_enabled", False)
    _optional_call(cfg, "set_free_space_path_loss")

    mode = mac_kind.lower()
    if mode == "csma":
        _require_call(cfg, "set_csma_mac")
        _optional_call(cfg, "set_csma_queue_size", 64)
        _optional_call(cfg, "set_csma_capture_margin_db", 6.0)
    elif mode == "tdma":
        _require_call(cfg, "set_tdma_mac")
        _optional_call(cfg, "set_tdma_guard_fallback_mode", "strict")
    else:
        raise ValueError(f"Unsupported mac_kind: {mac_kind!r}")
    return cfg


def run_voice_scenario(
    radio_sim: Any,
    comms_log_path: Path,
    audio_dir: Path,
    mac_kind: str,
    num_nodes: int = 28,
    sim_duration_s: float = 24.0,
    seed: int = 7,
) -> tuple[Any, dict[str, Any]]:
    cfg = make_sim_config(radio_sim, mac_kind, num_nodes, sim_duration_s, seed)
    _require_call(cfg, "set_scenario_traffic", str(comms_log_path), str(audio_dir))
    sim = radio_sim.Simulation(cfg)
    summary = sim.run()
    return sim, summary


def run_media_scenario(
    radio_sim: Any,
    manifest_path: Path,
    mac_kind: str,
    num_nodes: int = 8,
    sim_duration_s: float = 12.0,
    seed: int = 9,
    mtu_bytes: int = 1200,
    playout_slack_ms: float = 50.0,
) -> tuple[Any, dict[str, Any]]:
    if not media_scenario_supported(radio_sim):
        raise RuntimeError(media_support_hint())
    cfg = make_sim_config(radio_sim, mac_kind, num_nodes, sim_duration_s, seed)
    _optional_call(cfg, "set_media_mtu_bytes", int(mtu_bytes))
    _optional_call(cfg, "set_media_playout_slack_ms", float(playout_slack_ms))
    _require_call(cfg, "set_media_scenario", str(manifest_path))
    sim = radio_sim.Simulation(cfg)
    summary = sim.run()
    return sim, summary


def core_summary_fields(summary: dict[str, Any]) -> dict[str, Any]:
    keys = [
        "packets_sent",
        "packets_delivered",
        "packets_failed",
        "drop_events",
        "collisions",
        "pdr_sender_confirmed",
        "pdr_receiver_unique",
        "p95_latency_ns",
    ]
    return {k: summary.get(k) for k in keys}


def _received_count(value: Any) -> int:
    if isinstance(value, (list, tuple)):
        return sum(1 for item in value if bool(item))
    if value is None:
        return 0
    return int(value)


def received_count(value: Any) -> int:
    return _received_count(value)


def voice_rows(summary: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for item in summary.get("voice_results", []):
        frames_received = _received_count(item.get("frames_received"))
        rows.append(
            {
                "message_id": item.get("message_id"),
                "sender_id": item.get("sender_id"),
                "receiver_id": item.get("receiver_id"),
                "total_frames": item.get("total_frames"),
                "frames_received": frames_received,
                "frames_queue_dropped": item.get("frames_queue_dropped"),
                "frames_late_dropped": item.get("frames_late_dropped"),
                "pdr": item.get("pdr"),
            }
        )
    rows.sort(key=lambda row: (row["message_id"], row["receiver_id"]))
    return rows


def media_rows(summary: dict[str, Any], media_kind: str | None = None) -> list[dict[str, Any]]:
    rows = []
    for item in summary.get("media_results", []):
        if media_kind and item.get("media_kind") != media_kind:
            continue
        frames_received = _received_count(item.get("frames_received"))
        rows.append(
            {
                "stream_id": item.get("stream_id"),
                "media_kind": item.get("media_kind"),
                "sender_id": item.get("sender_id"),
                "receiver_id": item.get("receiver_id"),
                "total_frames": item.get("total_frames"),
                "frames_received": frames_received,
                "frames_queue_dropped": item.get("frames_queue_dropped"),
                "frames_late_dropped": item.get("frames_late_dropped"),
                "pdr": item.get("pdr"),
                "frame_indices": item.get("frame_indices"),
            }
        )
    rows.sort(key=lambda row: (row["stream_id"], row["receiver_id"]))
    return rows


def select_best_voice_result(summary: dict[str, Any], min_frames: int = 4) -> dict[str, Any] | None:
    candidates = [
        result
        for result in summary.get("voice_results", [])
        if _received_count(result.get("frames_received", 0)) >= min_frames
    ]
    if not candidates:
        return None
    return max(
        candidates,
        key=lambda item: (
            float(item.get("pdr", 0.0)),
            _received_count(item.get("frames_received", 0)),
        ),
    )


def reconstruct_voice_audio(sim: Any, voice_result: dict[str, Any]) -> bytes:
    frames = [frame for frame in voice_result.get("frame_payloads", [])]
    return bytes(sim.reconstruct_audio(frames))


def pcm_to_wav_bytes(
    pcm_bytes: bytes,
    sample_rate_hz: int = CODEC_SAMPLE_RATE_HZ,
    channels: int = 1,
    bits_per_sample: int = 16,
) -> bytes:
    """Wrap raw PCM bytes as a WAV byte stream for notebook playback widgets."""
    sample_width = max(1, bits_per_sample // 8)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_out:
        wav_out.setnchannels(channels)
        wav_out.setsampwidth(sample_width)
        wav_out.setframerate(sample_rate_hz)
        wav_out.writeframes(pcm_bytes)
    return buffer.getvalue()


def select_media_stream(
    summary: dict[str, Any],
    media_kind: str,
) -> dict[str, Any] | None:
    candidates = [
        result for result in summary.get("media_results", []) if result.get("media_kind") == media_kind
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda item: _received_count(item.get("frames_received", 0)))


def decode_payload_frame(payload: bytes | None, width: int = 64, height: int = 64) -> np.ndarray:
    np = _require_numpy()
    pixels = width * height
    if payload is None or len(payload) == 0:
        return np.zeros((height, width), dtype=np.uint8)
    data = np.frombuffer(payload, dtype=np.uint8)
    repeats = int(math.ceil(pixels / max(1, data.size)))
    tiled = np.tile(data, repeats)[:pixels]
    return tiled.reshape(height, width)


def media_video_arrays(
    media_result: dict[str, Any],
    width: int = 64,
    height: int = 64,
    max_frames: int = 64,
) -> list[np.ndarray]:
    arrays = []
    for payload in media_result.get("frame_payloads", [])[:max_frames]:
        arrays.append(decode_payload_frame(payload, width=width, height=height))
    return arrays


def plot_video_grid(
    arrays: list[np.ndarray],
    title: str = "Received video frames",
    cols: int = 4,
) -> tuple[Any, Any]:
    plt = _require_matplotlib_pyplot()
    count = max(1, len(arrays))
    cols = max(1, cols)
    rows = int(math.ceil(count / cols))
    fig, axes = plt.subplots(rows, cols, figsize=(3 * cols, 2.5 * rows), constrained_layout=True)
    if rows == 1 and cols == 1:
        axes_list = [axes]
    elif rows == 1:
        axes_list = list(axes)
    elif cols == 1:
        axes_list = list(axes)
    else:
        axes_list = [ax for row in axes for ax in row]

    for i, ax in enumerate(axes_list):
        if i < len(arrays):
            ax.imshow(arrays[i], cmap="viridis", vmin=0, vmax=255)
            ax.set_title(f"Frame {i}")
        ax.axis("off")
    fig.suptitle(title)
    return fig, axes


def animate_video(
    arrays: list[np.ndarray],
    interval_ms: int = 120,
    title: str = "Video stream reconstruction",
) -> animation.FuncAnimation:
    np = _require_numpy()
    plt = _require_matplotlib_pyplot()
    animation = _require_matplotlib_animation()
    if not arrays:
        arrays = [np.zeros((64, 64), dtype=np.uint8)]
    fig, ax = plt.subplots(figsize=(5, 4), constrained_layout=True)
    image = ax.imshow(arrays[0], cmap="viridis", vmin=0, vmax=255)
    ax.set_title(title)
    ax.axis("off")

    def _update(frame_idx: int):
        image.set_data(arrays[frame_idx % len(arrays)])
        return (image,)

    return animation.FuncAnimation(
        fig,
        _update,
        frames=len(arrays),
        interval=interval_ms,
        blit=True,
        repeat=True,
    )
