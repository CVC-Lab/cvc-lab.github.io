# Architecture Overview

## Executive Summary

`radio-sim` is a discrete-event simulator with a Rust core and Python bindings.

- Core simulator/time engine: `crates/radio-sim-core`.
- Python API/runtime control: `crates/radio-sim-py`.
- Conformance and analysis tooling: `experiments/`.

The architecture keeps radio behavior in core Rust while exposing configuration and control hooks through PyO3.

## Layered Architecture

```text
Application/Experiments
  - experiments/conformance/run_conformance.py
  - experiments/pin_csma_demo.py
  - notebooks

Python API Layer (PyO3)
  - crates/radio-sim-py/src/config.rs (SimConfig methods)
  - crates/radio-sim-py/src/sim.rs (Simulation methods)

Simulation Core (Rust)
  - sim/runner.rs (event loop, dispatch, delivery)
  - mac/csma/* and mac/tdma/*
  - phy/channel.rs
  - traffic/* + media/scenario.rs + voice/scenario.rs
  - metrics/collector.rs

Config + Validation
  - config.rs (all config structs + strict validation)
```

## Core Data Flow

1. `Simulation::new` validates `SimConfig` and instantiates nodes, MACs, channel, traffic generators, and metrics.
2. Events are scheduled in `DesEngine` (`SlotStart/SlotEnd`, `TrafficGenerate`, timers, `SimEnd`).
3. `runner.rs` dispatches events and coordinates MAC decisions + PHY delivery.
4. MAC modules emit `MacAction` entries (transmit, schedule event, metric emission).
5. Metrics collector aggregates event-level telemetry into summary KPIs and media/voice outputs.

## Key Runtime Components

- `config.rs`
  - Single source of truth for config schema and validation constraints.
  - Enforces profile/mac compatibility (`silvus_v1 -> csma`, `tsm_v1 -> tdma`).

- `sim/runner.rs`
  - Owns absolute simulation time and event dispatch.
  - CSMA sender completion happens at `TxEnd`; receive completion and carrier sense follow receiver-local propagated arrival timing.
  - CSMA also separates carrier-sense energy from packet detect/decode gates (`cca_threshold_dbm` vs `rx_sensitivity_dbm` + SINR thresholds).
  - TDMA delivery is staged `SlotStart` -> delivered at `SlotEnd`.

- `mac/csma/csma_mac.rs`
  - EDCA-style AIFS/backoff/TXOP/ACK timeout state machine.
  - Local actions modify per-AC AIFS, CWmin/CWmax, and TXOP budgets.
  - Enqueue-time contender updates let new ACs join an in-progress contention round without waiting for a fresh busy->idle edge.

- `mac/tdma/tdma_mac.rs`
  - Barrage-style DLC origination + relay pipeline.
  - Guard-time filtering + combining/capture in `on_rx_batch`.

- `phy/channel.rs`
  - Path loss + shadowing + optional fading.
  - CCA modes: `strongest_signal` and `aggregate_energy`.

- `metrics/collector.rs`
  - Computes sender-confirmed PDR, receiver unique/pairwise PDR, latency, collisions, drops.

## Control Overlay Boundary

Overlay remains API-driven and optional:

- Enable with `control_overlay.enabled = true`.
- Caller steps time (`run_until_ms`) and polls observations (`get_local_observations`).
- Caller applies actions (`apply_local_actions`).

This keeps control logic out of MAC/PHY internals and preserves baseline behavior when overlay is disabled.

## Role in the Broader TSM Pipeline

`radio-sim` is the current radio-side control substrate inside a larger training and evaluation story.

- `geometry-scene-gen` provides scene structure and spatial masks.
- `scenario-traffic-gen` provides platoon layout, positions, and traffic programs.
- `rf-pathloss` provides LOS/pathloss/rx-power style RF enrichments.
- `radio-sim` currently exposes only local queue and MAC telemetry to the controller.

That last boundary is deliberate and important: the broader pipeline exists so future PIN agents can train across scene diversity, but the current implemented controller API is still a local reactive observation surface. See [PIN MARL Formulation](pin_marl_formulation.md) for the staged observation model and the exact implemented-vs-planned split.

## Determinism + Reproducibility

- Global seed in `general.seed`.
- Substream RNG usage by component.
- Deterministic event ordering in DES.
- Stable scripted experiments in `experiments/` for repeatable outputs.
