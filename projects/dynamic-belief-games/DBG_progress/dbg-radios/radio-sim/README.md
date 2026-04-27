# radio-sim

Rust + PyO3 tactical radio emulator for local-control research.

Implemented modes:
- CSMA/CA emulation aligned to Silvus-like behavior.
- TDMA/TSM-style barrage relay emulation.
- Optional local PIN control overlay (per-radio actions from local observations).

This simulator is behavior-level emulation, not firmware-identical reproduction.

## Documentation Map

- Docs hub: [`docs/README.md`](docs/README.md)
- Getting started: [`docs/getting_started.md`](docs/getting_started.md)
- Architecture: [`docs/architecture_overview.md`](docs/architecture_overview.md)
- API surface: [`docs/API_interface.md`](docs/API_interface.md)
- PIN controller API: [`docs/pin_controller_api.md`](docs/pin_controller_api.md)
- PIN learning algorithm: [`docs/pin_learning_algorithm.md`](docs/pin_learning_algorithm.md)
- Protocol overview: [`docs/protocols.md`](docs/protocols.md)
- CSMA deep dive: [`docs/mac_csma_implementation.md`](docs/mac_csma_implementation.md)
- TDMA deep dive: [`docs/mac_tdma_implementation.md`](docs/mac_tdma_implementation.md)
- PIN optimal-control experiment: [`docs/pin_optimal_control_experiment.md`](docs/pin_optimal_control_experiment.md)
- Conformance harness: [`docs/conformance/README.md`](docs/conformance/README.md)

## Serve Docs

From `radio-sim/`:

```bash
python3 -m mkdocs serve
```

From repo root:

```bash
python3 -m mkdocs serve -f radio-sim/mkdocs.yml
```

## Build + Validation

From `radio-sim/`:

```bash
# Rust tests
cargo test -p radio-sim-core

# Build Python bindings into active runtime
PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release

# Conformance harness syntax check
python3 -m py_compile experiments/conformance/run_conformance.py
```

If you prefer a venv:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip maturin
PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release
```

## Minimal Python Example

```python
import radio_sim

cfg = radio_sim.SimConfig()
cfg.set_csma_mac()
cfg.set_num_nodes(12)
cfg.set_sim_duration_s(1.5)

sim = radio_sim.Simulation(cfg)
out = sim.run()

print("pdr_sender_confirmed:", out["pdr_sender_confirmed"])
print("p95_latency_ns:", out["p95_latency_ns"])
print("collisions:", out["collisions"])
```

## Overlay Loop Example

```python
import radio_sim

cfg = radio_sim.SimConfig()
cfg.set_csma_mac()
cfg.set_control_overlay_enabled(True)
cfg.set_control_observation_interval_ms(250.0)

sim = radio_sim.Simulation(cfg)

while not sim.is_finished():
    next_t = sim.current_time_ms() + 250.0
    sim.run_until_ms(next_t)

    obs = sim.get_local_observations()
    if not obs:
        continue

    # One action dict per node with named EDCA deltas for VO / VI / BE / BK.
    actions = [{
        "aifsn_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
        "cw_min_exp_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
        "cw_max_exp_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
        "txop_limit_us_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
    } for _ in obs]
    sim.apply_local_actions(actions)

summary = sim.run()
```

## Experiments

- PIN demo metrics: `python3 experiments/pin_csma_demo.py`
- PIN visuals: `python3 experiments/generate_pin_demo_visuals.py`
- PIN deck: `python3 experiments/build_pin_demo_deck.py`
- Conformance sweeps: `python3 experiments/conformance/run_conformance.py --strictness advisory`

## Notes

- `run_until_ms` uses absolute simulation time, not delta time.
- `control_overlay.observation_interval_ms` is configuration metadata; callers still drive step timing.
- Local actions currently affect CSMA behavior; TDMA `apply_local_action` is a no-op.
