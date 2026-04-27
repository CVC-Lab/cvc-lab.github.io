# Voice Pipeline

End-to-end machinery to drop a `.wav` file into the simulator, transmit through
either the Silvus-style CSMA/CA or the TSM-style TDMA barrage MAC, and recover
a reconstructed `.wav` plus PDR/latency KPIs.

## Architecture

```mermaid
flowchart LR
  W1[input.wav] --> R[resample to 48 kHz mono]
  R --> E[Opus encoder<br/>20 ms frames @ 16 kbps]
  E --> P[Python list of frame dicts]
  P --> CFG[SimConfig.set_media_frames]
  CFG --> SIM[Simulation.run<br/>--mac csma|tdma]
  SIM --> VR[voice_results /<br/>media_results]
  VR --> D[Opus decoder<br/>+ PLC for None frames]
  D --> R2[resample to source rate]
  R2 --> W2[output.wav]
  SIM --> K[kpis.json:<br/>pdr, latency, ...]
```

Codec, WAV I/O, and resampling live in **Python**; the Rust crate stays
codec-agnostic. The simulator just shuttles opaque `Arc<Vec<u8>>` payloads
through the MAC and reassembles fragments by `(rx, sender, stream, frame_idx)`.

## Why Option B (in-memory injection)

Earlier the only way to feed real audio into the simulator was
`TrafficModel::Scenario`, which:
- requires a 24 kHz / 16-bit / mono WAV on disk,
- produces no real codec output (PCM passthrough only),
- forces a comms-log JSON beside the audio dir.

`TrafficModel::MediaInMemory` (introduced in this change) accepts a
`Vec<RawMediaEntry>` directly, with each entry carrying a real `Arc<Vec<u8>>`
payload. From Python you call `SimConfig.set_media_frames(list[dict])` and pass
the encoded Opus bytes inline as `bytes`. No tmp files, no manifest schema,
no payload-size restrictions. The fragmentation + scheduling logic is shared
with `MediaScenario::load` via the `build_scheduled_frames` helper.

## Data path

| Stage         | Component                                                              | Where                                      |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| WAV ingest    | `soundfile.read` (or stdlib `wave` fallback)                           | `experiments/voice_run.py`                 |
| Resample      | `samplerate` (sinc) or linear interpolation                            | `experiments/voice_run.py`                 |
| Encode        | `opuslib.Encoder(48 kHz, mono, VOIP)`                                  | `experiments/voice_run.py`                 |
| Inject        | `SimConfig.set_media_frames(list[dict{payload: bytes, ...}])`          | `crates/radio-sim-py/src/config.rs`        |
| Schedule      | `TrafficModel::MediaInMemory` → `MediaScenario::from_in_memory`        | `crates/radio-sim-core/src/media/scenario.rs` |
| Fragment      | `build_scheduled_frames` (auto MTU split)                              | `crates/radio-sim-core/src/media/scenario.rs` |
| TX (CSMA)     | `MacAction::TrackMediaFrame` from `csma_mac.rs:749-756`                | `crates/radio-sim-core/src/mac/csma/`      |
| TX (TDMA)     | `MacAction::TrackMediaFrame` from `tdma_mac.rs:268-275`                | `crates/radio-sim-core/src/mac/tdma/`      |
| Reassemble    | `MediaTracker::FrameAssembly`                                          | `crates/radio-sim-core/src/metrics/media.rs` |
| Pull payloads | `Simulation.run() -> {voice_results, media_results}`                   | `crates/radio-sim-py/src/sim.rs:278-301`   |
| Decode        | `opuslib.Decoder.decode(payload\|None, 960, decode_fec=False)` (PLC for None) | `experiments/voice_run.py`           |
| Resample back | `samplerate` (or linear)                                               | `experiments/voice_run.py`                 |
| Write WAV     | `soundfile.write` (or stdlib `wave`)                                   | `experiments/voice_run.py`                 |

## KPI definitions

| Field                    | Meaning                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| `frames_total`           | Number of 20 ms voice frames the encoder emitted (= `floor(audio_dur_s / 0.020)`). |
| `frames_received`        | Number whose every fragment reached the receiver and reassembled successfully.   |
| `frames_lost`            | `frames_total - frames_received`. Decoded as Opus PLC concealment in the output WAV. |
| `pdr`                    | `frames_received / frames_total` (also reported by the simulator's media tracker). |
| `pdr_from_summary`       | Cross-check: same value pulled from `voice_results`/`media_results` in the run summary. |
| `p95_latency_ns_global`  | 95th-percentile delivery latency across the whole sim (not just this stream).    |

Per-stream latency percentiles aren't exposed through the Python summary today;
it's tracked as a follow-up. For now, the global p95 + the PDR per stream are
sufficient to compare CSMA vs TDMA at the overall delivery level.

## Loss concealment

Opus's decoder has built-in PLC. When a frame is lost, we pass `None` (an
empty `bytes` in the `decode(...)` call) and Opus inserts an interpolated
block based on its internal state. This is strictly better than the
silence-fill `voice/codec.rs::reconstruct_audio` does for the PCM-passthrough
path, and is why the output WAV under packet loss sounds like brief glitches
instead of hard zero-segments.

## Determinism

Same `--seed` produces the same sim trajectory. Opus encode is deterministic
given identical input and bitrate. Therefore same `--in` + same `--seed` +
same MAC + same params → byte-identical KPIs JSON and (within Opus's
deterministic encode) byte-identical output WAV.

## Out of scope

- **PESQ / POLQA / STOI** intelligibility metrics: need reference-clip
  alignment; tracked separately.
- **Multi-talker / talkgroup**: the MAC supports it (sender-id is per-frame
  and `set_media_frames` accepts arbitrary `sender_id` values), but the CLI
  is single-stream first. Multi-stream CLI is a follow-up.
- **TDMA queue/slot tuning for high voice frame-rates**: default
  `TdmaConfig::node_queue_size = 10` and the default 12-slot 2.5 ms frame
  yield only ~33 origination opportunities per second per node, which can't
  keep up with a 50 fps voice stream. Adjusting that is part of the
  separately-tracked TDMA fidelity work.
- **Real-radio parameter calibration** (TSM, Silvus): proprietary; current
  defaults are 802.11-derived (CSMA) and academic-BRN-derived (TDMA).
