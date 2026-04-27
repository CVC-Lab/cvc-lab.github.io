# radio-sim Documentation

## Overview

`radio-sim` is a behavior-level tactical radio emulator with:

- CSMA/CA MAC emulation for Silvus-like behavior.
- TDMA/TSM-style barrage relay emulation.
- Optional local PIN control overlay through a Python API boundary.

Within the broader TSM program, this simulator is the radio-side control substrate for PIN research. The long-term goal is to train agents against diverse scene, traffic, platoon, and RF conditions, while keeping the current implementation boundary honest about what the radio actually observes today. The canonical theory page for that split is [`pin_marl_formulation.md`](pin_marl_formulation.md).

This documentation mirrors the structure used in `tsm-barrage-sim`, updated for the current Rust/PyO3 implementation.

## Documentation Structure

### Getting Started
- [`getting_started.md`](getting_started.md): environment setup, first simulation, first conformance run.
- [`documentation_workflow.md`](documentation_workflow.md): how to preview/build docs and add new pages.

### Core Design
- [`architecture_overview.md`](architecture_overview.md): system architecture and data flow.
- [`API_interface.md`](API_interface.md): Python API and `SimConfig` control surface.
- [`pin_controller_api.md`](pin_controller_api.md): PIN control loop I/O contract and action semantics.
- [`pin_marl_formulation.md`](pin_marl_formulation.md): observation-first theory page with math, visuals, software mappings, and the implemented-vs-planned split.
- [`pin_learning_algorithm.md`](pin_learning_algorithm.md): implementation-facing learning spec for the future Stackelberg adversarial MARL track, grounded in the current CSMA control surface.
- [`technical_specification.md`](technical_specification.md): concise implemented local-control specification and conformance gate math.

### Protocol Stack
- [`protocols.md`](protocols.md): protocol summary and links.
- [`mac_csma_implementation.md`](mac_csma_implementation.md): CSMA/CA state machine, timers, queueing, collisions, capture.
- [`mac_tdma_implementation.md`](mac_tdma_implementation.md): TDMA slot lifecycle, BAC scheduler, relay pipeline, combining.

### Environment + Fidelity
- [`environment_propagation.md`](environment_propagation.md): channel/CCA/path-loss assumptions and limits.

### Validation + Experiments
- [`conformance/README.md`](conformance/README.md): harness options, strictness modes, baseline comparisons.
- [`pin_optimal_control_experiment.md`](pin_optimal_control_experiment.md): reproducible runbook for the PIN optimal-control demo experiment.

### Maintenance
- [`performance_optimizations.md`](performance_optimizations.md): current scaling characteristics and tuning tips.
- [`known_issues.md`](known_issues.md): active caveats and user-facing gotchas.

## Visuals

MAC and controller pages include Mermaid diagrams. Mermaid rendering is enabled in `mkdocs.yml` and `docs/javascripts/mermaid-init.js`.

## Quick Commands

From `radio-sim/`:

```bash
cargo test -p radio-sim-core
PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --release
python3 experiments/conformance/run_conformance.py --strictness advisory
```

## Related Program Docs

- Program objective and outputs live at repository root in `../OBJECTIVES.md` and `../docs/`.
- PIN demo artifacts are indexed in `../docs/README.md`.
