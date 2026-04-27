# DOCS_GUIDE

Quick reference for working with `radio-sim` documentation.

## Local Preview

From `radio-sim/`:

```bash
python3 -m pip install mkdocs mkdocs-material pymdown-extensions
python3 -m mkdocs serve
```

From repo root:

```bash
python3 -m mkdocs serve -f radio-sim/mkdocs.yml
```

Preview at <http://127.0.0.1:8000>.

## Static Build

```bash
python3 -m mkdocs build
```

Site output is written to `radio-sim/site/`.

## Docs Layout

- `docs/README.md`: docs homepage.
- `docs/getting_started.md`: first-run setup and validation.
- `docs/architecture_overview.md`: runtime/dataflow map.
- `docs/API_interface.md`: Python + config interface reference.
- `docs/pin_controller_api.md`: PIN controller loop contract and action semantics.
- `docs/pin_marl_formulation.md`: observation-first theory page with math, visuals, software mappings, and the implemented-vs-planned split.
- `docs/protocols.md`: protocol overview.
- `docs/mac_csma_implementation.md`: CSMA/CA implementation deep dive with diagrams.
- `docs/mac_tdma_implementation.md`: TDMA/TSM implementation deep dive with diagrams.
- `docs/technical_specification.md`: local control and conformance formulation.
- `docs/environment_propagation.md`: channel/path-loss assumptions.
- `docs/performance_optimizations.md`: performance and scaling guidance.
- `docs/conformance/README.md`: conformance harness runbook.
- `docs/pin_optimal_control_experiment.md`: optimal-control demo experiment runbook.
- `docs/known_issues.md`: active caveats and current mitigations.

## Update Flow

1. Edit or add a markdown file under `docs/`.
2. Update `mkdocs.yml` nav entries.
3. Run `mkdocs build` to catch broken links/paths.
4. Keep `README.md` and docs references consistent.
