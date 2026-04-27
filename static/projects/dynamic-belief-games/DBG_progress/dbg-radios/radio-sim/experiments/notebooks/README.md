# Notebook Tutorials

This folder contains two Jupyter tutorials:

- `tutorial_csma_voice_video.ipynb`
- `tutorial_tdma_voice_video.ipynb`

Each tutorial covers:

1. Scenario voice traffic with assets from repo-level `output/`.
2. Synthetic mixed-media traffic with generated manifests.
3. Metric interpretation and audio/video reconstruction inspection.

## Asset Paths

When running from `radio-sim/`, notebooks reference assets in `../output/`:

- `../output/comms_log.json`
- `../output/audio/`

If those assets are missing, scenario sections will fail. Synthetic sections can still run.

## Environment Setup

From `radio-sim/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r experiments/notebooks/requirements.txt
python3 -m pip install maturin
PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release
```

Launch Jupyter:

```bash
jupyter lab experiments/notebooks
```

## Smoke Validation

```bash
python3 experiments/notebooks/smoke_execute_notebooks.py
python3 experiments/notebooks/smoke_execute_notebooks.py --execute
```

`--execute` requires `import radio_sim` to succeed and any referenced scenario assets to exist.
