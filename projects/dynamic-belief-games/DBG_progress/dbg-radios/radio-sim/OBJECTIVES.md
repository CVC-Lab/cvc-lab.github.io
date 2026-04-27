# radio-sim Objectives

## Goal

Build an accurate, high-performance MAC layer emulator for tactical radio MANETs, supporting:
1. **TSM barrage relay** (TrellisWare-style TDMA with cooperative combining)
2. **Silvus StreamCaster** (CSMA/CA with QoS priority contention windows)

The simulator should enable rapid parameter sweeps for optimal control research, with a full "gameplay" loop simulating a platoon of soldiers moving through an environment.

## Design Objective: Layered Radio + Overlay Architecture

The project is organized around three separable layers:

1. **MAC Layer Emulation (TDMA and CSMA/CA)**
   - Maintain high-quality protocol implementations.
   - Major design decisions must be justified with documentation and primary references.

2. **Codec/Packetization Modules (Voice/Video -> Packets)**
   - Maintain high-quality media framing, packetization, and reconstruction paths.
   - Major design decisions must be justified with documentation and primary references.

3. **Control Overlay (Optional, API-Driven)**
   - Keep control logic separate from MAC/PHY emulation logic.
   - Overlay collects streamed telemetry/observations and outputs control actions over an API boundary.
   - Overlay can be disabled, in which case the base radio emulator behavior remains unchanged.

## Completed

- [x] Rust workspace with DES engine (nanosecond precision)
- [x] TDMA MAC: M-slot pipeline, BAC scheduler, MRC/EGC/SC combining, guard-time filtering
- [x] TDMA: role-specific capture thresholds, duplicate delivery prevention, positive latency tracking
- [x] CSMA/CA MAC: 7-state machine, binary exponential backoff, DIFS/SIFS/ACK timers
- [x] CSMA: deferred delivery (TX-end delivery), collision batching, carrier sense freeze/resume
- [x] CSMA: QoS priority contention windows, EIFS with ACK airtime, backoff liveness fixes
- [x] CSMA: sender-confirmed PDR (ACK-timeout drops reduce PDR), duplicate delivery guard
- [x] PHY: log-distance + multi-slope path loss, Jakes fading, SINR, shadowing cache
- [x] PHY: per-signal other_plus_noise_w for correct cooperative combining denominators
- [x] Traffic generators (Bernoulli, Poisson)
- [x] Metrics: PDR, latency percentiles, collision counting, event logging
- [x] Python bindings via PyO3/maturin
- [x] Determinism verified (same seed = identical results)
- [x] Conformance config scaffolding (`none`/`silvus_v1`/`tsm_v1`) with profile validation
- [x] Media-aware packet metadata + tracking (`audio` and `video` stream results)
- [x] `TrafficModel::MediaScenario` (manifest-driven mixed-media traffic)
- [x] Conformance harness scaffold (`experiments/conformance/run_conformance.py`)
- [x] 90 tests passing (67 unit + 23 integration), zero failures

## Next Milestones

- [ ] Add `run_batch()` with rayon parallelism + GIL release for parameter sweeps
- [ ] Cross-validate TDMA PDR/latency against Python `tsm-barrage-sim` for matching configs
- [ ] Expand codec-driven sources behind current media-scenario interfaces (voice/video plugin path)
- [ ] Node mobility models (still, random, troop formation)
- [ ] Multi-hop unicast routing for CSMA mode (OLSR or static shortest-path)
- [ ] Gameplay loop: platoon movement, radio connectivity, mission scenarios
- [ ] Promote conformance harness to CI gate with stored baseline artifacts
