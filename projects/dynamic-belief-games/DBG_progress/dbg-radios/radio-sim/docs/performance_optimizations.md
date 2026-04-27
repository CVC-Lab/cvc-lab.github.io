# Performance Optimizations

## Current Strategy

`radio-sim` performance comes primarily from:

- Event-driven simulation (no fixed tick over idle periods).
- Rust core for MAC/PHY/event execution.
- Lightweight metric/event structures with summary aggregation.
- Cached channel components (shadowing/fader state per link).

## Hot Paths

- `sim/runner.rs`: dispatch loop, delivery fanout, timer scheduling.
- `phy/channel.rs`: received-power and SINR calculations.
- `mac/csma/csma_mac.rs`: contention/backoff/ACK state transitions.
- `mac/tdma/combining.rs`: cooperative combining per receiver batch.

## Practical Tuning Knobs

- Reduce `general.num_nodes` and simulation duration for fast iteration.
- Use smaller scenario sets/seeds when debugging conformance failures.
- Use `traffic.model = Bernoulli` for low-overhead sanity checks before scenario/media runs.
- Disable fading (`phy.enable_fading = false`) to reduce channel compute cost.

## Python Loop Performance Notes

When driving overlay in Python:

- Step in moderate intervals (for example 100-250 ms) instead of extremely fine `run_until_ms` increments.
- Batch action application per interval (`apply_local_actions` once per observation cycle).
- Keep post-processing outside the real-time control loop when possible.

## Near-Term Performance Work

Planned objective in `OBJECTIVES.md`:

- Add batch run support with parallel sweeps (`run_batch` style capability).

Until then, parallel parameter sweeps should be orchestrated externally.
