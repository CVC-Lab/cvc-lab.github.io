# Protocol Stack

## Overview

`radio-sim` supports two MAC modes selected through `mac` config:

- `csma` for Silvus-like behavior.
- `tdma` for TSM-style barrage relay behavior.

Conformance profile constraints:

- `silvus_v1` requires `mac = csma`.
- `tsm_v1` requires `mac = tdma`.

## Deep-Dive Pages

- CSMA/CA implementation: [`mac_csma_implementation.md`](mac_csma_implementation.md)
- TDMA/TSM implementation: [`mac_tdma_implementation.md`](mac_tdma_implementation.md)
- Controller runtime contract: [`pin_controller_api.md`](pin_controller_api.md)

## CSMA Mode (Summary)

Implementation roots:

- `mac/csma/csma_mac.rs`
- `mac/csma/backoff.rs`
- `sim/runner.rs` (deferred TX-end delivery)

Implemented behavior:

- DIFS/SIFS timers, binary exponential backoff, ACK timeout/retry.
- EIFS post-collision defer handling.
- Capture margin and strongest-signal decode path.
- Local-action-driven queue/admission/CW shaping.

## TDMA Mode (Summary)

Implementation roots:

- `mac/tdma/tdma_mac.rs`
- `mac/tdma/bac.rs`
- `mac/tdma/combining.rs`

Implemented behavior:

- Slot-role schedule (`DLC/RLC/CLC`) with active data path in `DLC`.
- BAC scheduling for origination ownership.
- Relay pipeline (`m_pipeline`) with TTL in DLC-index space.
- Guard-time filtering plus `strict` / `strongest_fallback` handling.
- Combining modes (`MRC`, `EGC`, `SC`) with role-specific capture thresholds.

## Traffic Model Interactions

`traffic.model` options:

- `Bernoulli`
- `Poisson { rate_per_slot }`
- `Scenario { comms_log_path, audio_dir }`
- `MediaScenario { manifest_path }`

Notes:

- Scenario/media modes schedule explicit frame events.
- In scenario/media runs, TDMA random self-origination is disabled.

## Common Pitfalls

- Overlay disabled -> observations empty and action apply errors in Python API.
- `run_until_ms` is absolute time, not delta time.
- `drop_events` can be nonzero even with high sender-confirmed PDR.
- `pdr_receiver_pairwise` may exceed `1.0` under fanout.

## Unsupported or Rejected Config Knobs

Validation currently rejects:

- `mac.csma.enable_rts_cts = true`
- `mac.tdma.enable_sic = true`
- non-default `phy.los_k_factor`, `phy.los_threshold_m`, `phy.snr_threshold_db`

These are intentionally blocked to prevent silent no-op experiments.
