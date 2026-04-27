# PIN Optimal-Control Experiment Runbook

This page is the program-level runbook for the PIN optimal-control demo experiment.

Technical implementation docs:

- [`radio-sim/docs/pin_controller_api.md`](../radio-sim/docs/pin_controller_api.md)
- [`radio-sim/docs/pin_optimal_control_experiment.md`](../radio-sim/docs/pin_optimal_control_experiment.md)

## Reproduction Commands

From repository root:

```bash
python3 radio-sim/experiments/pin_csma_demo.py
MPLCONFIGDIR=/tmp/mpl python3 radio-sim/experiments/generate_pin_demo_visuals.py
python3 radio-sim/experiments/build_pin_demo_deck.py
```

## Artifacts Produced

- `docs/pin_demo_metrics.json`
- `docs/figures/pin_demo/*.png`
- `docs/pin_local_control_results_deck.pptx`
- `docs/pin_demo_results.md`

## Experiment Summary

- Train seeds: `10000`, `10001`
- Eval seeds (A/B): `201`, `202`
- Control interval: `250 ms`
- Baseline policy: neutral local action template
- Controlled policy: tabular policy learned from local observations

## Current Caveats

- Small eval sample size.
- Demonstration is CSMA-focused (TDMA local action path is not yet active).
