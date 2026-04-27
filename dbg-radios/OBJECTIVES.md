# OBJECTIVES.md

## North Star
Build a realistic local PIN-control overlay for radio simulation that can measurably improve PDR and latency across scenario lifetime while preserving deployability constraints.

## Current Program Objectives

1. Define a minimal but effective local control problem mathematically.
2. Implement local control I/O in `radio-sim` so each radio can be controlled independently.
3. Validate with reproducible baseline-vs-controlled experiments and clear reporting.
4. Improve simulator fidelity toward Army-relevant network behavior (Silvus CSMA/CA and TSM barrage-sim assumptions).

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

## Current Status Snapshot

- Mathematical formulation documented:
  - `docs/pin_local_control_optimization.md`
- Demo metrics and analysis documented:
  - `docs/pin_demo_metrics.json`
  - `docs/pin_demo_results.md`
- Visuals generated:
  - `docs/figures/pin_demo/*`
- Presentation artifacts generated:
  - `docs/pin_local_control_results_deck.pptx`
  - `docs/pin_one_slide.pdf`

## Next Objectives

1. Expand validation beyond 2 eval seeds and report confidence intervals.
2. Strengthen high-priority latency behavior in controller reward/action design.
3. Add realism enhancements:
   - contested/interference conditions,
   - richer telemetry signals,
   - tighter mapping to TSM relay and Silvus CSMA behaviors.
4. Maintain behavior-level conformance profiles (`silvus_v1`, `tsm_v1`) with reproducible baseline comparisons and tiered gates.
5. Expand media scenario support for mixed audio/video traffic with packetization/reassembly metrics and compatibility reporting.
6. Define acceptance gates for promotion (e.g., high-priority PDR floor + latency target under stress scenarios).

## Runtime Preference
Default runtime (unless changed per session): conda env `dev` + Cargo toolchain.
