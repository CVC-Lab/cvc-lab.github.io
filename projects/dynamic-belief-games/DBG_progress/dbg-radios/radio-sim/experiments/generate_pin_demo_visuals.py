#!/usr/bin/env python3
"""Generate visual comparisons for PIN demo baseline vs controlled runs."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def trim_trace(trace: list[dict]) -> list[dict]:
    trimmed = list(trace)
    while trimmed:
        row = trimmed[-1]
        if (
            row["high_pdr"] == 0.0
            and row["overall_pdr"] == 0.0
            and row["high_p95_latency_ms"] == 0.0
            and row["overall_p95_latency_ms"] == 0.0
        ):
            trimmed.pop()
        else:
            break
    return trimmed


def plot_aggregate(data: dict, out_dir: Path) -> None:
    base = data["baseline_mean"]
    ctrl = data["controlled_mean"]

    labels = [
        "High PDR",
        "High p95 Latency (ms)",
        "Overall PDR",
        "Overall p95 Latency (ms)",
    ]
    bvals = [
        base["high_pdr_mean"],
        base["high_p95_latency_ms_mean"],
        base["overall_pdr_mean"],
        base["overall_p95_latency_ms_mean"],
    ]
    cvals = [
        ctrl["high_pdr_mean"],
        ctrl["high_p95_latency_ms_mean"],
        ctrl["overall_pdr_mean"],
        ctrl["overall_p95_latency_ms_mean"],
    ]

    x = np.arange(len(labels))
    width = 0.35
    fig, ax = plt.subplots(figsize=(9, 4.8))
    ax.bar(x - width / 2, bvals, width, label="Baseline", color="#5b7db1")
    ax.bar(x + width / 2, cvals, width, label="Controlled", color="#d98c3f")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=12, ha="right")
    ax.set_title("Aggregate KPI Comparison")
    ax.legend()
    ax.grid(alpha=0.25, axis="y")
    fig.tight_layout()
    fig.savefig(out_dir / "aggregate_kpi_comparison.png", dpi=180)
    plt.close(fig)


def plot_seed_pairs(data: dict, out_dir: Path) -> None:
    baseline = {row["seed"]: row for row in data["baseline"]}
    controlled = {row["seed"]: row for row in data["controlled"]}
    seeds = sorted(baseline.keys())

    fig, axs = plt.subplots(1, 2, figsize=(10, 4.2), sharex=False)

    for seed in seeds:
        axs[0].plot(
            ["Baseline", "Controlled"],
            [baseline[seed]["high_pdr"], controlled[seed]["high_pdr"]],
            marker="o",
            linewidth=1.8,
            label=f"Seed {seed}",
        )
        axs[1].plot(
            ["Baseline", "Controlled"],
            [
                baseline[seed]["overall_p95_latency_ms"],
                controlled[seed]["overall_p95_latency_ms"],
            ],
            marker="o",
            linewidth=1.8,
            label=f"Seed {seed}",
        )

    axs[0].set_title("Per-Seed High-Priority PDR")
    axs[1].set_title("Per-Seed Overall p95 Latency")
    axs[0].set_ylabel("PDR")
    axs[1].set_ylabel("Latency (ms)")
    for ax in axs:
        ax.grid(alpha=0.25)
    axs[1].legend(loc="best")
    fig.tight_layout()
    fig.savefig(out_dir / "seed_level_pairwise.png", dpi=180)
    plt.close(fig)


def plot_highlight_trace(data: dict, out_dir: Path) -> None:
    seed = data["highlight_seed"]
    scenarios = {row["seed"]: row for row in data["seed_scenarios"]}
    scenario = scenarios[seed]

    b = trim_trace(scenario["baseline_trace"])
    c = trim_trace(scenario["controlled_trace"])
    t = [row["time_ms"] for row in b]

    fig, axs = plt.subplots(2, 2, figsize=(10, 6.5), sharex=True)

    axs[0, 0].plot(t, [row["high_pdr"] for row in b], label="Baseline", marker="o")
    axs[0, 0].plot(t, [row["high_pdr"] for row in c], label="Controlled", marker="o")
    axs[0, 0].set_title(f"Seed {seed}: High-Priority PDR")
    axs[0, 0].set_ylabel("PDR")

    axs[0, 1].plot(t, [row["overall_pdr"] for row in b], label="Baseline", marker="o")
    axs[0, 1].plot(t, [row["overall_pdr"] for row in c], label="Controlled", marker="o")
    axs[0, 1].set_title(f"Seed {seed}: Overall PDR")

    axs[1, 0].plot(
        t, [row["high_p95_latency_ms"] for row in b], label="Baseline", marker="o"
    )
    axs[1, 0].plot(
        t, [row["high_p95_latency_ms"] for row in c], label="Controlled", marker="o"
    )
    axs[1, 0].set_title(f"Seed {seed}: High-Priority p95 Latency")
    axs[1, 0].set_ylabel("Latency (ms)")
    axs[1, 0].set_xlabel("Time (ms)")

    axs[1, 1].plot(
        t, [row["overall_p95_latency_ms"] for row in b], label="Baseline", marker="o"
    )
    axs[1, 1].plot(
        t, [row["overall_p95_latency_ms"] for row in c], label="Controlled", marker="o"
    )
    axs[1, 1].set_title(f"Seed {seed}: Overall p95 Latency")
    axs[1, 1].set_xlabel("Time (ms)")

    for ax in axs.flat:
        ax.grid(alpha=0.25)
    axs[0, 0].legend(loc="best")
    fig.tight_layout()
    fig.savefig(out_dir / "highlight_seed_trace_kpis.png", dpi=180)
    plt.close(fig)


def plot_highlight_mechanism(data: dict, out_dir: Path) -> None:
    seed = data["highlight_seed"]
    scenarios = {row["seed"]: row for row in data["seed_scenarios"]}
    scenario = scenarios[seed]
    b = trim_trace(scenario["baseline_trace"])
    c = trim_trace(scenario["controlled_trace"])
    t = [row["time_ms"] for row in b]

    fig, axs = plt.subplots(1, 2, figsize=(10, 4.2), sharex=True)

    axs[0].plot(
        t, [row["best_effort_queue_mean"] for row in b], label="Baseline", marker="o"
    )
    axs[0].plot(
        t, [row["best_effort_queue_mean"] for row in c], label="Controlled", marker="o"
    )
    axs[0].plot(t, [row["high_queue_mean"] for row in b], label="Baseline HighQ", linestyle="--")
    axs[0].plot(
        t, [row["high_queue_mean"] for row in c], label="Controlled HighQ", linestyle="--"
    )
    axs[0].set_title(f"Seed {seed}: Queue Pressure")
    axs[0].set_ylabel("Mean queue size")
    axs[0].set_xlabel("Time (ms)")

    axs[1].plot(t, [row["cca_busy_mean"] for row in b], label="Baseline CCA busy", marker="o")
    axs[1].plot(
        t, [row["cca_busy_mean"] for row in c], label="Controlled CCA busy", marker="o"
    )
    axs[1].plot(t, [row["backoff_mean"] for row in b], label="Baseline backoff", linestyle="--")
    axs[1].plot(
        t, [row["backoff_mean"] for row in c], label="Controlled backoff", linestyle="--"
    )
    axs[1].set_title(f"Seed {seed}: Channel Contention Signals")
    axs[1].set_xlabel("Time (ms)")

    for ax in axs:
        ax.grid(alpha=0.25)
        ax.legend(loc="best")
    fig.tight_layout()
    fig.savefig(out_dir / "highlight_seed_mechanism.png", dpi=180)
    plt.close(fig)

    actions = scenario["controlled_action_counts"]
    fig, ax = plt.subplots(figsize=(5.5, 3.5))
    labels = ["A0 neutral", "A1 aggressive-prio", "A2 balanced", "A3 conservative"]
    ax.bar(labels, actions, color=["#6c8ebf", "#d98c3f", "#7fb069", "#b56576"])
    ax.set_title(f"Seed {seed}: Controlled Action Usage")
    ax.set_ylabel("Selections")
    ax.grid(alpha=0.25, axis="y")
    ax.tick_params(axis="x", rotation=18)
    fig.tight_layout()
    fig.savefig(out_dir / "highlight_seed_action_usage.png", dpi=180)
    plt.close(fig)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    json_path = repo_root / "docs" / "pin_demo_metrics.json"
    out_dir = repo_root / "docs" / "figures" / "pin_demo"
    out_dir.mkdir(parents=True, exist_ok=True)

    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    plot_aggregate(data, out_dir)
    plot_seed_pairs(data, out_dir)
    plot_highlight_trace(data, out_dir)
    plot_highlight_mechanism(data, out_dir)

    print("Wrote visuals to", out_dir)


if __name__ == "__main__":
    main()
