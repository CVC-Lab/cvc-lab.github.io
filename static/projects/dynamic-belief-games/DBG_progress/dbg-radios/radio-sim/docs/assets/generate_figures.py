"""Generate publication-quality figures for radio-sim documentation."""

from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

OUT = Path(__file__).parent
DPI = 200
FONT = "sans-serif"

# Colors
LEADER_COLOR = "#c62828"
LEADER_LIGHT = "#ffcdd2"
FOLLOWER_COLOR = "#1565c0"
FOLLOWER_LIGHT = "#bbdefb"
PIPELINE_COLOR = "#2e7d32"
PIPELINE_LIGHT = "#c8e6c9"
NEUTRAL_COLOR = "#424242"
NEUTRAL_LIGHT = "#e0e0e0"
TIER1_COLOR = "#1565c0"
TIER2_COLOR = "#f57f17"
TIER3_COLOR = "#6a1b9a"
WARN_COLOR = "#e65100"
BG_COLOR = "#fafafa"


def _rounded_box(ax, x, y, w, h, label, color, text_color="white", fontsize=11, alpha=1.0):
    box = FancyBboxPatch(
        (x - w / 2, y - h / 2), w, h,
        boxstyle="round,pad=0.12", facecolor=color, edgecolor="none", alpha=alpha,
        zorder=2, transform=ax.transData,
    )
    ax.add_patch(box)
    ax.text(x, y, label, ha="center", va="center", fontsize=fontsize,
            color=text_color, fontweight="bold", zorder=3, family=FONT)
    return box


def _arrow(ax, x1, y1, x2, y2, color=NEUTRAL_COLOR, lw=2, style="->"):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw, shrinkA=4, shrinkB=4),
                zorder=1)


def _label(ax, x, y, text, fontsize=9, color=NEUTRAL_COLOR, ha="center", style="italic"):
    ax.text(x, y, text, ha=ha, va="center", fontsize=fontsize, color=color,
            style=style, family=FONT, zorder=4)


# ── Figure A: Stackelberg Game Structure ──

def fig_stackelberg_structure():
    fig, (ax_left, ax_right) = plt.subplots(1, 2, figsize=(12, 5.5))
    fig.patch.set_facecolor("white")

    # Left: Simultaneous-move MARL (what this is NOT)
    ax = ax_left
    ax.set_xlim(-2.5, 2.5)
    ax.set_ylim(-2.5, 2.5)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title("Simultaneous-Move MARL", fontsize=14, fontweight="bold",
                 color=NEUTRAL_COLOR, pad=12, family=FONT)

    n_agents = 5
    radius = 1.5
    for i in range(n_agents):
        angle = 2 * np.pi * i / n_agents - np.pi / 2
        x = radius * np.cos(angle)
        y = radius * np.sin(angle)
        _rounded_box(ax, x, y, 1.1, 0.55, f"Agent {i+1}", NEUTRAL_COLOR, fontsize=9)
        # draw arrows to neighbors
        for j in range(i + 1, n_agents):
            a2 = 2 * np.pi * j / n_agents - np.pi / 2
            x2 = radius * np.cos(a2)
            y2 = radius * np.sin(a2)
            _arrow(ax, x, y, x2, y2, color="#bdbdbd", lw=1, style="<->")

    _label(ax, 0, -2.3, "All agents act simultaneously\nNo commitment order", fontsize=10,
           color="#757575", style="normal")

    # Right: Stackelberg hierarchy (what this IS)
    ax = ax_right
    ax.set_xlim(-3.5, 3.5)
    ax.set_ylim(-3.5, 3.0)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title("Stackelberg Game (PIN Training)", fontsize=14, fontweight="bold",
                 color=LEADER_COLOR, pad=12, family=FONT)

    # Leader
    _rounded_box(ax, 0, 2.2, 3.2, 0.8, "Leader: Env Agent", LEADER_COLOR, fontsize=12)
    _label(ax, 0, 1.55, r"commits to scenario $\theta$ first", fontsize=10,
           color=LEADER_COLOR, style="normal")

    # Arrow down
    _arrow(ax, 0, 1.3, 0, 0.5, color=LEADER_COLOR, lw=2.5)
    _label(ax, 1.2, 0.9, "realize scenario", fontsize=9, color=LEADER_COLOR)

    # Realized world
    _rounded_box(ax, 0, 0.0, 3.5, 0.7, "Realized World: geometry, RF, traffic",
                 NEUTRAL_LIGHT, text_color=NEUTRAL_COLOR, fontsize=10)

    # Arrows to followers
    for i, x_pos in enumerate([-2.2, -0.7, 0.7, 2.2]):
        _arrow(ax, x_pos * 0.6, -0.4, x_pos, -1.2, color=FOLLOWER_COLOR, lw=1.5)

    # Followers
    for i, x_pos in enumerate([-2.2, -0.7, 0.7, 2.2]):
        _rounded_box(ax, x_pos, -1.7, 1.2, 0.7, f"PIN {i+1}", FOLLOWER_COLOR, fontsize=10)

    _label(ax, 0, -2.5, "Followers: observe locally, best-respond with overlay actions",
           fontsize=10, color=FOLLOWER_COLOR, style="normal")

    # Mission utility arrow
    _arrow(ax, 0, -2.8, 0, -3.2, color=PIPELINE_COLOR, lw=2)
    _label(ax, 0, -3.4, r"Mission utility $\rightarrow$ leader reward",
           fontsize=10, color=PIPELINE_COLOR, style="normal")

    fig.tight_layout(w_pad=3)
    fig.savefig(OUT / "stackelberg_structure.png", dpi=DPI, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close(fig)
    print(f"  stackelberg_structure.png")


# ── Figure B: Training Loop Timeline ──

def fig_training_loop():
    fig, ax = plt.subplots(figsize=(13, 4))
    fig.patch.set_facecolor("white")
    ax.set_xlim(-0.5, 12.5)
    ax.set_ylim(-1.5, 3.0)
    ax.axis("off")
    ax.set_title("Two-Level Stackelberg Training Epoch", fontsize=15, fontweight="bold",
                 color=NEUTRAL_COLOR, pad=15, family=FONT)

    steps = [
        (0.5, "Sample\n" + r"$\theta \sim q_\phi$", LEADER_COLOR, "Leader"),
        (2.8, "Realize\nscenario", NEUTRAL_COLOR, None),
        (5.2, "Follower\nrollout", FOLLOWER_COLOR, "Followers"),
        (7.5, "Collect\ntrajectories", NEUTRAL_COLOR, None),
        (9.3, r"Update $\psi$" + "\n(MAPPO)", FOLLOWER_COLOR, "Followers"),
        (11.3, r"Update $\phi$" + "\n(curriculum)", LEADER_COLOR, "Leader"),
    ]

    for i, (x, label, color, role) in enumerate(steps):
        _rounded_box(ax, x, 0.8, 1.8, 1.2, label, color, fontsize=9)
        if i < len(steps) - 1:
            next_x = steps[i + 1][0]
            _arrow(ax, x + 0.95, 0.8, next_x - 0.95, 0.8, color="#9e9e9e", lw=2)
        if role:
            role_color = LEADER_LIGHT if "Leader" in role else FOLLOWER_LIGHT
            text_color = LEADER_COLOR if "Leader" in role else FOLLOWER_COLOR
            ax.text(x, -0.15, role, ha="center", va="center", fontsize=8,
                    color=text_color, fontweight="bold", family=FONT,
                    bbox=dict(boxstyle="round,pad=0.2", facecolor=role_color, edgecolor="none"))

    # Repeat arrow
    ax.annotate("", xy=(0.5, 2.2), xytext=(11.3, 2.2),
                arrowprops=dict(arrowstyle="->", color="#9e9e9e", lw=1.5,
                                connectionstyle="arc3,rad=-0.3", linestyle="--"))
    ax.text(6, 2.7, "repeat until converged", ha="center", va="center",
            fontsize=10, color="#757575", style="italic", family=FONT)

    fig.savefig(OUT / "training_loop.png", dpi=DPI, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close(fig)
    print(f"  training_loop.png")


# ── Figure C: Observation Tiers ──

def fig_observation_tiers():
    fig, ax = plt.subplots(figsize=(12, 6))
    fig.patch.set_facecolor("white")
    ax.set_xlim(-0.5, 12)
    ax.set_ylim(-1, 7.5)
    ax.axis("off")
    ax.set_title("PIN Observation Tiers", fontsize=15, fontweight="bold",
                 color=NEUTRAL_COLOR, pad=15, family=FONT)

    tier_configs = [
        (1.8, TIER1_COLOR, "#e3f2fd", "Tier 1: Radio Telemetry",
         "Implemented in radio-sim",
         ["queue_len, HOL age, retry_count", "tx_attempts, tx_success", "retries, ack_timeouts",
          "backoff stage, slots, CW exp", "drops, deliveries, p95_latency_ns",
          "internal_collisions, txop", "collisions", "cca_busy_fraction",
          "mean_backoff_slots"]),
        (5.8, TIER2_COLOR, "#fff8e1", "Tier 2: Upstream Pipeline",
         "Available but not yet exposed",
         ["traffic history", "node positions/motion", "squad/role context",
          "LOS/NLOS, pathloss", "rx power, link margin", "terrain/blockage",
          "mission phase"]),
        (9.8, TIER3_COLOR, "#f3e5f5", "Tier 3: Predictive",
         "Planned derived features",
         ["queue-growth forecast", "congestion hotspot score", "link degradation forecast",
          "neighbor stability", "NLOS pocket score"]),
    ]

    for x, color, bg, title, subtitle, fields in tier_configs:
        # Column header
        box = FancyBboxPatch((x - 1.5, 5.5), 3.0, 1.2, boxstyle="round,pad=0.1",
                             facecolor=color, edgecolor="none", zorder=2)
        ax.add_patch(box)
        ax.text(x, 6.3, title, ha="center", va="center", fontsize=11,
                color="white", fontweight="bold", family=FONT, zorder=3)
        ax.text(x, 5.8, subtitle, ha="center", va="center", fontsize=8,
                color="white", style="italic", family=FONT, zorder=3)

        # Field list
        field_box = FancyBboxPatch((x - 1.5, -0.3), 3.0, 5.5, boxstyle="round,pad=0.1",
                                   facecolor=bg, edgecolor=color, linewidth=1.5, zorder=1)
        ax.add_patch(field_box)
        for j, field in enumerate(fields):
            y = 4.7 - j * 0.65
            ax.text(x, y, field, ha="center", va="center", fontsize=9,
                    color=NEUTRAL_COLOR, family=FONT, zorder=3)

    # Arrows between tiers
    _arrow(ax, 3.5, 3, 4.3, 3, color="#bdbdbd", lw=2, style="->")
    _arrow(ax, 7.5, 3, 8.3, 3, color="#bdbdbd", lw=2, style="->")
    _label(ax, 3.9, 3.5, "enrich", fontsize=8, color="#9e9e9e")
    _label(ax, 7.9, 3.5, "derive", fontsize=8, color="#9e9e9e")

    fig.savefig(OUT / "observation_tiers.png", dpi=DPI, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close(fig)
    print(f"  observation_tiers.png")


# ── Figure D: Full Pipeline Integration ──

def fig_pipeline_integration():
    fig, ax = plt.subplots(figsize=(14, 7))
    fig.patch.set_facecolor("white")
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title("Training Pipeline: Leader Controls and Follower Runtime",
                 fontsize=16, fontweight="bold", color=NEUTRAL_COLOR, pad=18, family=FONT)

    leader_x = 7.0
    leader_y = 6.7
    _rounded_box(ax, leader_x, leader_y, 5.0, 0.95,
                 r"Leader: Env Agent ($q_\phi$)", LEADER_COLOR, fontsize=13)

    module_y = 4.05
    modules = [
        (1.7, "geometry\nscene-gen", PIPELINE_COLOR),
        (4.8, "scenario\ntraffic-gen", PIPELINE_COLOR),
        (7.9, "rf\npathloss", PIPELINE_COLOR),
        (11.0, "radio-sim", FOLLOWER_COLOR),
    ]
    for x, label, color in modules:
        _rounded_box(ax, x, module_y, 2.25, 0.95, label, color, fontsize=10)

    for left, right in zip(modules, modules[1:]):
        _arrow(ax, left[0] + 1.2, module_y, right[0] - 1.2, module_y, color="#9e9e9e", lw=2.2)

    # Leader control arrows and labels
    controls = [
        (5.5, 1.7, r"$g$: geometry"),
        (6.4, 4.8, r"$u$: platoon"),
        (7.4, 7.9, r"$\tau$: traffic"),
        (8.5, 11.0, r"$\varrho$: RF profile"),
    ]
    label_positions = [
        (2.0, 5.25),
        (4.9, 5.25),
        (8.0, 5.25),
        (11.1, 5.25),
    ]
    for (start_x, end_x, label), (lx, ly) in zip(controls, label_positions):
        _arrow(ax, start_x, leader_y - 0.55, end_x, module_y + 0.7, color=LEADER_COLOR, lw=1.8)
        _label(ax, lx, ly, label, fontsize=9, color=LEADER_COLOR, style="normal")

    # Episode specification
    ax.text(6.7, 2.2, r"Training episode: $\xi = (g, u, \tau, \varrho, n)$",
            ha="center", va="center", fontsize=12, color=NEUTRAL_COLOR,
            fontweight="bold", family=FONT,
            bbox=dict(boxstyle="round,pad=0.4", facecolor=NEUTRAL_LIGHT, edgecolor="none"))

    # Follower group below radio-sim
    follower_box = FancyBboxPatch(
        (9.05, 1.25), 3.9, 1.25,
        boxstyle="round,pad=0.1", facecolor=FOLLOWER_LIGHT, edgecolor="none", zorder=1
    )
    ax.add_patch(follower_box)

    for i, x_pos in enumerate([9.75, 10.65, 11.55, 12.45]):
        _rounded_box(ax, x_pos, 1.92, 0.74, 0.54, f"P{i+1}", FOLLOWER_COLOR, fontsize=8)

    _arrow(ax, 11.0, module_y - 0.55, 11.0, 2.62, color=FOLLOWER_COLOR, lw=1.8)

    _label(ax, 11.0, 0.95, "Distributed PIN agents\n(followers)", fontsize=10,
           color=FOLLOWER_COLOR, style="normal")

    ax.text(11.0, 2.9, "local control loop", ha="center", va="center",
            fontsize=9, color=FOLLOWER_COLOR, style="italic", family=FONT)

    # Return arrow back to leader
    return_arrow = FancyArrowPatch(
        (12.55, 2.2), (9.35, 6.3),
        connectionstyle="arc3,rad=0.42",
        arrowstyle="->",
        mutation_scale=14,
        linestyle="--",
        linewidth=1.8,
        color=WARN_COLOR,
        zorder=2,
    )
    ax.add_patch(return_arrow)
    ax.text(12.85, 4.15, "fleet return /\nconstraint metrics", ha="center", va="center",
            fontsize=9, color=WARN_COLOR, style="italic", family=FONT)

    ax.text(7.0, 7.5, "leader commits scenario first", ha="center", va="center",
            fontsize=10, color=LEADER_COLOR, style="italic", family=FONT)

    fig.tight_layout()

    fig.savefig(OUT / "pipeline_integration.png", dpi=DPI, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close(fig)
    print(f"  pipeline_integration.png")


# ── Figure E: Hidden State Confounders ──

def fig_hidden_confounders():
    fig, ax = plt.subplots(figsize=(12, 5.5))
    fig.patch.set_facecolor("white")
    ax.set_xlim(-1, 14)
    ax.set_ylim(-1.5, 5.5)
    ax.axis("off")
    ax.set_title("Why Local Observations Are Insufficient: Hidden Confounders",
                 fontsize=14, fontweight="bold", color=WARN_COLOR, pad=15, family=FONT)

    # Observable symptoms (left column)
    symptoms = [
        "High CCA busy",
        "Queue growth",
        "High retries",
        "High drops",
    ]
    for i, s in enumerate(symptoms):
        y = 4.0 - i * 1.3
        _rounded_box(ax, 1.5, y, 2.5, 0.7, s, TIER1_COLOR, fontsize=9)

    ax.text(1.5, 5.0, "Observable Symptoms", ha="center", va="center",
            fontsize=12, fontweight="bold", color=TIER1_COLOR, family=FONT)

    # Hidden causes (right column)
    causes_map = {
        0: ["dense friendly\nreuse", "hidden\nterminals", "jammer-like\ninterference"],
        1: ["bursty\narrivals", "bad links", "topology\nbreak"],
        2: ["weak links", "transient\ninterference", "NLOS\nobstruction"],
        3: ["admission\npressure", "persistent bad\nchannel", "overloaded\nbest-effort"],
    }

    ax.text(9.5, 5.0, "Possible Hidden Causes", ha="center", va="center",
            fontsize=12, fontweight="bold", color=WARN_COLOR, family=FONT)

    for i, causes in causes_map.items():
        y_sym = 4.0 - i * 1.3
        for j, cause in enumerate(causes):
            x = 6.5 + j * 2.8
            y = y_sym
            _rounded_box(ax, x, y, 2.2, 0.7, cause, WARN_COLOR, fontsize=7,
                         alpha=0.7 + j * 0.1)
            _arrow(ax, 2.8, y_sym, x - 1.15, y, color="#bdbdbd", lw=1)

    # Bottom message
    ax.text(6.5, -1.0,
            "Same local counters can arise from very different latent causes\n"
            r"$\rightarrow$ motivates enriching observations with Tier 2 and Tier 3 features",
            ha="center", va="center", fontsize=11, color=NEUTRAL_COLOR,
            style="italic", family=FONT)

    fig.savefig(OUT / "hidden_confounders.png", dpi=DPI, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close(fig)
    print(f"  hidden_confounders.png")


if __name__ == "__main__":
    print("Generating figures...")
    fig_stackelberg_structure()
    fig_training_loop()
    fig_observation_tiers()
    fig_pipeline_integration()
    fig_hidden_confounders()
    print("Done.")
