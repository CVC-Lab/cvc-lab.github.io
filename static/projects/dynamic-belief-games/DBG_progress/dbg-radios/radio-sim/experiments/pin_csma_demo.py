#!/usr/bin/env python3
"""Run the CSMA PIN local-overlay A/B demonstration and write JSON metrics.

This wrapper executes the Rust example that contains the tabular RL loop and
seeded baseline-vs-controlled evaluation.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    radio_sim_root = repo_root / "radio-sim"
    out_path = repo_root / "docs" / "pin_demo_metrics.json"

    proc = subprocess.run(
        ["cargo", "run", "-p", "radio-sim-core", "--example", "pin_csma_demo"],
        cwd=radio_sim_root,
        check=True,
        capture_output=True,
        text=True,
    )

    payload = proc.stdout.strip()
    data = json.loads(payload)
    out_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    delta = data["delta"]
    print("Wrote", out_path)
    print("high_pdr_delta:", delta["high_pdr_mean"])
    print("high_p95_latency_ms_delta:", delta["high_p95_latency_ms_mean"])
    print("overall_pdr_delta:", delta["overall_pdr_mean"])
    print("overall_p95_latency_ms_delta:", delta["overall_p95_latency_ms_mean"])


if __name__ == "__main__":
    main()
