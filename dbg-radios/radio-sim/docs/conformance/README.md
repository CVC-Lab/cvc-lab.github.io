# Conformance Harness (Silvus/TSM)

This repository implements behavior-level conformance checks, not firmware-identical validation.

## Profiles

- `silvus_v1`: requires `mac = csma`
- `tsm_v1`: requires `mac = tdma`

Profile/mac compatibility is enforced in config validation.

## Strictness Modes

- `advisory`
  - Never hard-fails the run.
  - Reports invariant and drift diagnostics.

- `tiered`
  - Requires baseline.
  - Fails on invariant violations and moderate drift.

- `hard`
  - Requires baseline.
  - Fails on invariant violations and tighter drift limits.

## Critical Metrics Compared

The harness compares:

- `pdr_sender_confirmed`
- `p95_latency_ns`

Drift limits in current implementation:

- Row-level relative error: `tiered <= 0.35`, `hard <= 0.20`
- Median relative error: `tiered <= 0.20`, `hard <= 0.10`

## Basic Run

From `radio-sim/`:

```bash
python3 experiments/conformance/run_conformance.py \
  --strictness advisory \
  --scenario-set core_v1 \
  --out experiments/conformance/latest.json
```

## Tiered/Hard Run (With Baseline)

```bash
python3 experiments/conformance/run_conformance.py \
  --strictness tiered \
  --baseline experiments/conformance/baseline_core_v1.json \
  --scenario-set core_v1 \
  --seeds 42 43 44 45 46 \
  --out experiments/conformance/latest_core_v1.json
```

`tiered` and `hard` require `--baseline` (or explicit `--require-baseline`).

## Baseline Lifecycle

Recommended workflow:

1. Generate baseline from a known-good commit + fixed seeds.
2. Store baseline JSON under `experiments/conformance/` with scenario-set-specific filename.
3. Compare candidate runs against that same scenario set + seed set.
4. Replace baseline only with explicit review and recorded rationale.

## Output Schema (High Level)

Output file contains:

- `scenario_set`
- `strictness`
- `rows[]` (scenario, seed, critical metrics, packet counts)
- `gates` (status, medians, violations)

Exit code:

- `0` for pass/advisory
- `2` for fail

## Tips

- Keep scenario set and seeds fixed when comparing branches.
- Start with `advisory` while developing, then gate with `tiered`/`hard` in CI.
- Review violations for invariant failures separately from baseline drift.
