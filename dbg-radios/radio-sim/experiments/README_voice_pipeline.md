# Voice-over-Radio CLI

`experiments/voice_run.py` runs a `.wav` file through the simulator's CSMA/CA
or TDMA MAC layer end-to-end and writes a reconstructed `.wav` plus a KPI JSON.

## Install

```bash
# Build & install the radio_sim Python bindings (run from repo root):
PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 \
  maturin develop --release --manifest-path crates/radio-sim-py/Cargo.toml

# Python deps:
pip install numpy soundfile      # required
pip install opuslib samplerate   # recommended (real codec, sinc resampling)

# Opus C library (macOS):
brew install opus
# After install, set this in the shell so opuslib can find libopus.dylib:
export DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib
```

If `opuslib` or its native library is missing the script falls back to PCM
passthrough (each 20 ms frame ≈ 640 bytes at 16 kHz instead of ~40 bytes for
Opus 16 kbps). The MAC pipeline still works; just much higher airtime per frame.

## Run

```bash
# CSMA (Silvus model). Close range, no contenders -> PDR ~ 1.0.
python experiments/voice_run.py \
  --in samples/voice.wav \
  --out /tmp/csma_out.wav \
  --kpis /tmp/csma_kpis.json \
  --mac csma \
  --num-nodes 2 --area-m 10 --seed 42

# TDMA (TSM barrage model). Default frame schedule = ~33 origination opps/sec
# per node, so a 50 fps voice stream needs a wider playout window.
python experiments/voice_run.py \
  --in samples/voice.wav \
  --out /tmp/tdma_out.wav \
  --kpis /tmp/tdma_kpis.json \
  --mac tdma --playout-slack-ms 1500 \
  --num-nodes 2 --area-m 10 --seed 42

# Stress: lots of contenders, big area -> PDR drops, audible glitches.
python experiments/voice_run.py \
  --in samples/voice.wav --out /tmp/stress.wav --kpis /tmp/stress.json \
  --mac csma --num-nodes 12 --area-m 5000 --seed 42
```

## CLI flags

| flag                  | default            | meaning                                 |
| --------------------- | ------------------ | --------------------------------------- |
| `--in`                | required           | input WAV (any rate; mono-mixed inside) |
| `--out`               | required           | output WAV                              |
| `--kpis`              | `kpis.json`        | output KPI JSON                         |
| `--mac`               | `csma`             | `csma` or `tdma`                        |
| `--codec`             | `opus`             | `opus` or `pcm`                         |
| `--bitrate-bps`       | 16000              | Opus target bitrate                     |
| `--sender`            | 0                  | sender node id                          |
| `--receiver`          | 1                  | receiver node id                        |
| `--num-nodes`         | 4                  | total nodes in sim                      |
| `--area-m`            | 100.0              | square-area side length, meters         |
| `--seed`              | 42                 | RNG seed (deterministic)                |
| `--start-s`           | 0.5                | first frame emit time                   |
| `--sim-duration-s`    | clip + start + 2.0 | absolute sim duration                   |
| `--mtu-bytes`         | 1200               | MAC MTU (auto-fragments larger frames)  |
| `--playout-slack-ms`  | 400                | per-frame deadline relative to emit     |

## KPIs JSON

```json
{
  "mac": "csma",
  "codec": "opus",
  "bitrate_bps": 16000,
  "frames_total": 50,
  "frames_received": 50,
  "frames_lost": 0,
  "pdr": 1.0,
  "p95_latency_ns_global": 1936062,
  ...
}
```

`frames_received / frames_total = pdr`. `p95_latency_ns_global` is the global
sim summary value; per-frame latencies are not yet exposed (filed as a
follow-up).

## Pipeline

```
WAV → mono+resample(48 kHz) → Opus encode (20 ms frames @ bitrate_bps)
   → SimConfig.set_media_frames(...)
   → Simulation.run() with --mac csma|tdma
   → frame_payloads list (None for lost frames)
   → Opus decode with built-in PLC for None entries
   → resample back to input rate
   → WAV
```

Architecture details: see `docs/voice_pipeline.md`.

## Tests

```bash
DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib pytest experiments/tests
```

## Troubleshooting

- **`Could not find Opus library`**: `brew install opus`, then export
  `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib` (or the equivalent for your
  platform). Without Opus, the CLI auto-falls-back to PCM passthrough — the
  pipeline still runs; just much heavier per-frame airtime.
- **TDMA PDR much lower than CSMA**: expected at default TDMA slot config (one
  origination opportunity every ~30 ms per node), which can't keep up with a
  50 fps voice stream. Increase `--playout-slack-ms`, lower the source frame
  rate, or use a larger queue (TDMA queue size is currently a Rust-side
  default — see `TdmaConfig::node_queue_size`).
- **Output WAV is silent**: check `frames_received` in the KPIs JSON. If it's
  0, no frames reached the receiver — verify positions/area, sender/receiver
  IDs, and that `--start-s + clip_duration_s` is well within `--sim-duration-s`.
