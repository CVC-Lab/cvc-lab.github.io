# Technical Specification

This page documents the implemented local-control specification in `radio-sim`.

For the broader theory page covering:

- the reason for the full 3D training pipeline
- the target distributed PIN/MARL formulation
- the three-tier observation model (runtime telemetry slice vs upstream pipeline vs red-text expansion)
- the full notation glossary

see [PIN MARL Formulation](pin_marl_formulation.md).

This page stays intentionally implementation-scoped. The Stackelberg game casting, the leader and follower objective functions, and the training algorithm live in the theory pages rather than here. In other words, this file documents the runtime control surface, while the broader Env-Agent-versus-PIN-Agent training program is described in [PIN MARL Formulation](pin_marl_formulation.md) and [PIN Learning Algorithm](pin_learning_algorithm.md).

## 1. Problem Framing

`radio-sim` is designed for local PIN-control research over a fixed MAC/PHY emulator.

Per node `i` at control interval `t`:

- Observation: `o_t^(i)` from local counters and queue/state measurements.
- Action: `a_t^(i)` affecting only local MAC behavior.

Local policy objective (behavior-level):

```text
maximize    E[sum_t gamma^t * r_t]
subject to  deployable local action constraints
```

with reward terms typically tied to:

- sender-confirmed delivery (`pdr_sender_confirmed`)
- latency tail (`p95_latency_ns`)
- class-priority protection

The overlay boundary remains API-level: no direct mutation of core DES/PHY internals.

## 2. State/Action Interfaces

State is represented by `LocalObservation` fields:

- per-AC (`VO / VI / BE / BK`) queue length, head-of-line age, retry count, backoff stage, current backoff slots, and CW exponent
- per-AC tx attempts/successes, retries, ack timeouts, drops, deliveries, internal collisions, TXOP grants, and TXOP uses
- per-AC interval p95 latency
- channel contention indicators (`collisions`, `cca_busy_fraction`, `mean_backoff_slots`)

Action is `LocalAction` with four per-AC delta dictionaries:

- `aifsn_delta`
- `cw_min_exp_delta`
- `cw_max_exp_delta`
- `txop_limit_us_delta`

Access-category order is named rather than positional: `vo`, `vi`, `be`, `bk`.

The broader PIN sensing model adds:

- <span class="status-planned">node positions and motion history</span>
- <span class="status-planned">packet SNR or RSSI summaries</span>
- <span class="status-planned">3D scene features</span>
- <span class="status-planned">RF/pathloss-derived link-state summaries</span>

Those channels are documented in [PIN MARL Formulation](pin_marl_formulation.md).

### Software Anchors

| Interface element | Meaning | Code anchor |
| --- | --- | --- |
| `LocalObservation` | implemented local observation struct | `crates/radio-sim-core/src/control.rs` |
| `take_local_observations()` | interval aggregation of queue, MAC, and latency telemetry | `crates/radio-sim-core/src/sim/runner.rs` |
| Python observation surface | dictionary export of the observation API | `crates/radio-sim-py/src/sim.rs` |
| `LocalAction` | implemented local action struct | `crates/radio-sim-core/src/control.rs` |
| `apply_local_actions()` | runtime application of local actions | `crates/radio-sim-core/src/sim/runner.rs` and `crates/radio-sim-py/src/sim.rs` |
| CSMA EDCA control semantics | per-AC queueing, AIFS/CW control, internal collisions, TXOP continuation | `crates/radio-sim-core/src/mac/csma/csma_mac.rs` |
| demo policy and reward | implemented reference controller | `crates/radio-sim-core/examples/pin_csma_demo.rs` |

This specification is intentionally reactive and local. <span class="status-planned">The richer scene-conditioned observation model sits around this same runtime boundary.</span>

## 3. Conformance Gates

Conformance harness (`experiments/conformance/run_conformance.py`) evaluates critical metrics:

- `pdr_sender_confirmed`
- `p95_latency_ns`

Relative error checks against baseline rows:

- Row-level limit:
  - tiered: `0.35`
  - hard: `0.20`
- Median-level limit:
  - tiered: `0.20`
  - hard: `0.10`

Gate interpretation:

- `advisory`: never hard-fails; reports drift.
- `tiered` / `hard`: fail on invariant or drift violations.

## 4. Profile Constraints

Validation enforces profile/mac compatibility:

- `silvus_v1` <-> CSMA
- `tsm_v1` <-> TDMA

Tiered/hard strictness requires baseline path.

## 5. Metrics Semantics

Primary summary semantics (from `metrics/collector.rs`):

- `pdr` is alias to sender-confirmed PDR.
- `pdr_sender_confirmed`: unique packets with at least one delivery / unique sent packets.
- `pdr_receiver_unique`: unique delivered packet IDs / unique sent packets.
- `pdr_receiver_pairwise`: total delivery events / unique sent packets.

This distinction is important for broadcast/fanout and retry-heavy runs.

## 6. Fidelity Boundary

This simulator targets behavior-level alignment and reproducible comparisons.
It does not claim vendor firmware identity.
