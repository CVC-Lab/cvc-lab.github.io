#!/usr/bin/env python3
"""Run behavior-level conformance sweeps for Silvus/TSM profiles."""

from __future__ import annotations

import argparse
import json
import statistics
from pathlib import Path
from typing import Dict, List

import radio_sim


SCENARIO_SETS = {
    "core_v1": [
        {
            "name": "silvus_dense_csma",
            "profile": "silvus_v1",
            "mac": "csma",
            "num_nodes": 12,
            "area_size_m": 120.0,
            "sim_duration_s": 1.5,
        },
        {
            "name": "silvus_sparse_csma",
            "profile": "silvus_v1",
            "mac": "csma",
            "num_nodes": 20,
            "area_size_m": 450.0,
            "sim_duration_s": 2.0,
        },
        {
            "name": "tsm_barrage_relay",
            "profile": "tsm_v1",
            "mac": "tdma",
            "num_nodes": 20,
            "area_size_m": 500.0,
            "sim_duration_s": 2.0,
        },
    ],
    "stress_v1": [
        {
            "name": "silvus_dense_csma_stress",
            "profile": "silvus_v1",
            "mac": "csma",
            "num_nodes": 28,
            "area_size_m": 160.0,
            "sim_duration_s": 2.5,
        },
        {
            "name": "tsm_barrage_stress",
            "profile": "tsm_v1",
            "mac": "tdma",
            "num_nodes": 36,
            "area_size_m": 700.0,
            "sim_duration_s": 2.5,
        },
    ],
}

CRITICAL_METRICS = ("pdr_sender_confirmed", "p95_latency_ns")
ROW_REL_ERR_LIMIT = {"tiered": 0.35, "hard": 0.20}
MEDIAN_REL_ERR_LIMIT = {"tiered": 0.20, "hard": 0.10}


def make_config(
    scenario: Dict,
    seed: int,
    strictness: str,
    baseline_path: str | None,
    scenario_set: str,
    require_baseline: bool,
) -> radio_sim.SimConfig:
    cfg = radio_sim.SimConfig()
    if scenario["mac"] == "csma":
        cfg.set_csma_mac()
    else:
        cfg.set_tdma_mac()
    cfg.set_num_nodes(scenario["num_nodes"])
    cfg.set_area_size_m(scenario["area_size_m"])
    cfg.set_sim_duration_s(scenario["sim_duration_s"])
    cfg.set_seed(seed)
    cfg.set_conformance_profile(scenario["profile"])
    cfg.set_conformance_strictness(strictness)
    cfg.set_conformance_baseline_path(baseline_path)
    cfg.set_conformance_scenario_set(scenario_set)
    cfg.set_conformance_require_baseline(require_baseline)
    return cfg


def run_scenario(
    scenario: Dict,
    seed: int,
    strictness: str,
    baseline_path: str | None,
    scenario_set: str,
    require_baseline: bool,
) -> Dict:
    cfg = make_config(
        scenario,
        seed,
        strictness,
        baseline_path,
        scenario_set,
        require_baseline,
    )
    sim = radio_sim.Simulation(cfg)
    out = sim.run()
    return {
        "scenario": scenario["name"],
        "profile": scenario["profile"],
        "seed": seed,
        "metrics": {k: out[k] for k in CRITICAL_METRICS},
        "packets_sent": out["packets_sent"],
        "packets_delivered": out["packets_delivered"],
        "drop_events": out["drop_events"],
    }


def relative_error(a: float, b: float) -> float:
    if b == 0:
        return 0.0 if a == 0 else 1.0
    return abs(a - b) / abs(b)


def evaluate_gates(
    strictness: str,
    candidate_rows: List[Dict],
    baseline_rows: List[Dict],
    require_baseline: bool,
) -> Dict:
    if not baseline_rows:
        if strictness == "advisory" and not require_baseline:
            return {"status": "advisory", "reason": "no baseline provided", "violations": []}
        return {
            "status": "fail",
            "reason": "baseline required but not provided",
            "violations": ["missing baseline rows"],
        }

    baseline_index = {(r["scenario"], r["seed"]): r for r in baseline_rows}
    violations = []
    rel_errors: Dict[str, List[float]] = {m: [] for m in CRITICAL_METRICS}

    for row in candidate_rows:
        if row["packets_sent"] == 0:
            violations.append(f"{(row['scenario'], row['seed'])} packets_sent == 0")
        if row["packets_delivered"] > row["packets_sent"]:
            violations.append(
                f"{(row['scenario'], row['seed'])} packets_delivered > packets_sent"
            )
        for metric in CRITICAL_METRICS:
            value = row["metrics"][metric]
            if metric.startswith("pdr") and not (0.0 <= value <= 1.0):
                violations.append(f"{(row['scenario'], row['seed'])} {metric} out of [0,1]")
            if not isinstance(value, (int, float)):
                violations.append(f"{(row['scenario'], row['seed'])} {metric} is non-numeric")

    for row in candidate_rows:
        key = (row["scenario"], row["seed"])
        base = baseline_index.get(key)
        if not base:
            violations.append(f"missing baseline row for {key}")
            continue
        for metric in CRITICAL_METRICS:
            err = relative_error(row["metrics"][metric], base["metrics"][metric])
            rel_errors[metric].append(err)
            if strictness in ROW_REL_ERR_LIMIT and err > ROW_REL_ERR_LIMIT[strictness]:
                violations.append(
                    f"{key} {metric} relative error {err:.3f} > {ROW_REL_ERR_LIMIT[strictness]:.2f}"
                )

    medians = {
        metric: statistics.median(values) if values else 0.0
        for metric, values in rel_errors.items()
    }
    if strictness in MEDIAN_REL_ERR_LIMIT:
        for metric, med in medians.items():
            if med > MEDIAN_REL_ERR_LIMIT[strictness]:
                violations.append(
                    f"{metric} median relative error {med:.3f} > {MEDIAN_REL_ERR_LIMIT[strictness]:.2f}"
                )

    if strictness == "advisory":
        status = "advisory"
    else:
        status = "fail" if violations else "pass"
    return {"status": status, "medians": medians, "violations": violations}


def load_baseline(path: Path | None) -> List[Dict]:
    if not path or not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    return payload.get("rows", [])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("experiments/conformance/latest.json"))
    parser.add_argument("--strictness", choices=["advisory", "tiered", "hard"], default="advisory")
    parser.add_argument("--baseline", type=Path, default=None)
    parser.add_argument("--scenario-set", choices=sorted(SCENARIO_SETS.keys()), default="core_v1")
    parser.add_argument("--require-baseline", action="store_true")
    parser.add_argument("--seeds", type=int, nargs="+", default=[42, 43, 44, 45, 46])
    args = parser.parse_args()
    require_baseline = args.require_baseline or args.strictness in {"tiered", "hard"}
    if require_baseline and not args.baseline:
        parser.error("--strictness tiered/hard (or --require-baseline) requires --baseline")

    scenarios = SCENARIO_SETS[args.scenario_set]
    rows = []
    for scenario in scenarios:
        for seed in args.seeds:
            rows.append(
                run_scenario(
                    scenario,
                    seed,
                    args.strictness,
                    str(args.baseline) if args.baseline else None,
                    args.scenario_set,
                    require_baseline,
                )
            )

    baseline_rows = load_baseline(args.baseline)
    gates = evaluate_gates(
        args.strictness,
        rows,
        baseline_rows,
        require_baseline=require_baseline,
    )

    out_payload = {
        "scenario_set": args.scenario_set,
        "strictness": args.strictness,
        "rows": rows,
        "gates": gates,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        json.dump(out_payload, f, indent=2, sort_keys=True)

    print(f"wrote {args.out}")
    print(f"gate status: {gates['status']}")
    if gates.get("violations"):
        for v in gates["violations"]:
            print(f"- {v}")
    if gates["status"] == "fail":
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
