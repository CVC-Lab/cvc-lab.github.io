# dbg-radios

Local PIN-control research workspace for tactical radio emulation and reporting.

## Repository Layout

- `radio-sim/`: Rust + PyO3 radio emulator (CSMA/CA, TDMA/TSM-style barrage, conformance harness, notebooks).
- `docs/`: program-level optimization/demo artifacts (figures, metrics JSON, deck, one-slide).
- `output/`: local scenario/media assets (comms logs, audio clips, reconstructed audio).

## Runtime

Default runtime for this repository is conda env `dev` (unless changed per session):

```bash
conda activate dev
```

## Quick Validation

```bash
cd radio-sim
cargo test -p radio-sim-core
cargo check -p radio-sim-py
python3 -m py_compile experiments/conformance/run_conformance.py
```

Notebook smoke check:

```bash
cd radio-sim
python3 experiments/notebooks/smoke_execute_notebooks.py --execute
```

If notebook imports fail (`import radio_sim`), rebuild bindings in the active runtime:

```bash
cd radio-sim
PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release
```

## Full Docs Site

From repo root (recommended):

```bash
python3 -m mkdocs serve -f radio-sim/mkdocs.yml
```

Then open <http://127.0.0.1:8000>.

This serves the full simulator docs, including:

- PIN controller API: [`radio-sim/docs/pin_controller_api.md`](radio-sim/docs/pin_controller_api.md)
- CSMA MAC deep dive: [`radio-sim/docs/mac_csma_implementation.md`](radio-sim/docs/mac_csma_implementation.md)
- TDMA MAC deep dive: [`radio-sim/docs/mac_tdma_implementation.md`](radio-sim/docs/mac_tdma_implementation.md)
- PIN optimal-control experiment runbook: [`radio-sim/docs/pin_optimal_control_experiment.md`](radio-sim/docs/pin_optimal_control_experiment.md)

## Program Artifact Docs

- Program artifact index: [`docs/README.md`](docs/README.md)
- Program-level experiment runbook: [`docs/pin_optimal_control_experiment.md`](docs/pin_optimal_control_experiment.md)

## PIN Demo Artifact Workflow

From repository root:

```bash
python3 radio-sim/experiments/pin_csma_demo.py
MPLCONFIGDIR=/tmp/mpl python3 radio-sim/experiments/generate_pin_demo_visuals.py
python3 radio-sim/experiments/build_pin_demo_deck.py
```

Outputs:

- `docs/pin_demo_metrics.json`
- `docs/figures/pin_demo/*.png`
- `docs/pin_local_control_results_deck.pptx`
- `docs/pin_demo_results.md`

## Data/Asset Policy

`output/` is intended for local working assets. Keep large binary payloads local unless you intentionally publish them via release artifacts or LFS.
