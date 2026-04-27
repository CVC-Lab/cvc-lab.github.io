# Getting Started

This guide covers the minimum steps to build the simulator, run a first simulation, and run the conformance harness.

## Prerequisites

- Rust toolchain (`cargo`) installed.
- Python 3.9+.
- `maturin` available in your active Python runtime.

Preferred runtime for this repository is conda env `dev`.

## Environment Setup

From repository root:

```bash
conda activate dev
cd radio-sim
python3 -m pip install --upgrade pip maturin
PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release
```

If you are not using conda:

```bash
cd radio-sim
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip maturin
PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release
```

## First Validation Run

```bash
cd radio-sim
cargo test -p radio-sim-core
python3 -c "import radio_sim; print(radio_sim.Simulation(radio_sim.SimConfig()).run())"
```

## First Conformance Run

```bash
cd radio-sim
python3 experiments/conformance/run_conformance.py \
  --strictness advisory \
  --scenario-set core_v1 \
  --out experiments/conformance/latest.json
```

Expected behavior:

- Writes `experiments/conformance/latest.json`.
- Prints `gate status: advisory` (or `pass` if baseline checks are active).

## PIN Demo Artifacts (Optional)

From repository root:

```bash
python3 radio-sim/experiments/pin_csma_demo.py
MPLCONFIGDIR=/tmp/mpl python3 radio-sim/experiments/generate_pin_demo_visuals.py
python3 radio-sim/experiments/build_pin_demo_deck.py
```

Outputs are written under `../docs/`.

## Next Reading

1. [`architecture_overview.md`](architecture_overview.md)
2. [`API_interface.md`](API_interface.md)
3. [`protocols.md`](protocols.md)
4. [`conformance/README.md`](conformance/README.md)
