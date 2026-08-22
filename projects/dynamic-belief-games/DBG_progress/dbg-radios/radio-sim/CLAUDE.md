# radio-sim Agent Instructions

## Project

Rust + PyO3 tactical radio MANET MAC layer simulator. Companion to `tsm-barrage-sim/` (Python predecessor).

## Runtime

- Rust: `cargo` (system install, `$HOME/.cargo/bin`)
- Python: venv at `radio-sim/.venv`
- Activate: `source .venv/bin/activate`
- Build bindings: `PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release`

## Build & Test

```bash
# Rust unit tests (fast, no Python needed)
cargo test -p radio-sim-core

# Python integration (needs venv active + maturin develop)
python3 -c "import radio_sim; print(radio_sim.Simulation(radio_sim.SimConfig()).run())"
```

## Coding Style

- Rust: follow existing patterns in the crate. No unnecessary abstractions.
- Prefer `hashbrown::HashMap` over `std::collections::HashMap` for hot paths.
- When using hashbrown `.get()` with iterator references, dereference the key (`*pid` not `pid`).
- `SimTime(u64)` is nanoseconds. Use `SimTime::from_us()`, `from_ms()`, `from_s()` constructors.
- MAC handlers return `MacActions` (SmallVec). Never mutate simulation state from inside a MAC handler.
- RNG substreams via `rng.stream("name")`. Include node ID in stream names for per-node determinism.

## Architecture Rules

- `radio-sim-core` must have zero PyO3 dependency. All Python-facing code goes in `radio-sim-py`.
- DES engine is the single source of time advancement. No tick-based loops.
- Event ordering: `(time ASC, priority ASC, seq ASC)`. Lower priority number = higher importance.
- Each simulation run is self-contained. No shared mutable state between runs (enables rayon parallelism).

## Key Files

- `crates/radio-sim-core/src/sim/runner.rs` -- main simulation loop
- `crates/radio-sim-core/src/mac/traits.rs` -- Mac trait definition
- `crates/radio-sim-core/src/mac/tdma/tdma_mac.rs` -- TDMA barrage relay
- `crates/radio-sim-core/src/mac/csma/csma_mac.rs` -- CSMA/CA state machine
- `crates/radio-sim-core/src/des/engine.rs` -- DES event scheduler
- `crates/radio-sim-core/src/config.rs` -- all configuration structs
