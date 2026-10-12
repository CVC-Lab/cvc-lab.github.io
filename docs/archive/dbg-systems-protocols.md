# DBG internal page: Systems & Protocols (archived)

> Archived text of the page that was published at
> `/projects/dynamic-belief-games/internal/systems-protocols/` on cvc-lab.github.io, behind the
> site's password prompt. It was removed from the website on 2026-10-12; see
> [README.md](README.md).

Internal Workstream

Internal summary of the `radio-sim` workstream: runtime architecture, protocol behavior, controller interfaces, PIN training formulation, and the validation logic that connects simulator claims to reviewable engineering evidence.

> This page is convenience-gated for collaborator review only. It should stay at the level of internal summary and approved engineering context rather than sensitive field details or private implementation notes.

## Live Links: Demo and documentation

Open the browser demo or read the built docs.

The links in this section pointed to files under `static/projects/dynamic-belief-games/DBG_progress/`. Those files were never added to the `main` branch, so the links did not work on the published site; the files are on the `Andrewsbranch` branch.

### Live Demo: RF packet visualizer

Browser-based interactive demo of the full voice transport chain: microphone capture, frame slicing, G.711 µ-law or PCM16 codec, header + CRC-16 packetization, a configurable channel (delay, jitter, loss, per-byte bit-flip), AM/FM/BPSK RF preview, jitter buffer, and playback — with live TX/RX waveforms, spectra, a packet grid, and an animated signal pipeline so you can watch individual packets traverse each stage.

Useful for narrating how a single spoken frame becomes bytes on the air and back again, and for injecting failures (drops, corruption) to see CRC rejection, reordering, and packet-loss concealment in real time.

- Check it out in action →: `/projects/dynamic-belief-games/DBG_progress/radio_sim/index.html`
- Read the overview: `/projects/dynamic-belief-games/DBG_progress/radio_sim/overview.html`

### Documentation: Protocol stack and PIN control

Rust + PyO3 radio emulator and research workspace for local PIN (Predictive Intelligent Network) control overlays. Covers CSMA/CA-style local control for Silvus-like behavior and TDMA/TSM-style barrage alignment, with a conformance harness, experiment notebooks, and artifacts that measure packet delivery ratio (PDR) and latency over scenario life.

- Read about the protocols →: `/projects/dynamic-belief-games/DBG_progress/protocol-docs/`
- PIN controller API — interface and integration points for the PIN overlay: `/projects/dynamic-belief-games/DBG_progress/protocol-docs/pin_controller_api/`
- CSMA MAC deep dive — CSMA/CA-style local control, Silvus-like behavior: `/projects/dynamic-belief-games/DBG_progress/protocol-docs/mac_csma_implementation/`
- TDMA MAC deep dive — TDMA/TSM-style barrage alignment and constraints: `/projects/dynamic-belief-games/DBG_progress/protocol-docs/mac_tdma_implementation/`
- PIN optimal-control experiment — reproducible PDR/latency experiment: `/projects/dynamic-belief-games/DBG_progress/protocol-docs/pin_optimal_control_experiment/`

## At a Glance: What this workstream actually contains

- Rust-core radio emulator with Python control bindings
- CSMA/CA runtime is the strongest implemented control surface today
- TDMA / barrage-relay path exists, but local overlay control is still behind CSMA
- Controller boundary is explicit: local observations in, bounded local actions out
- Broader PIN claims depend on scene, traffic, RF, and kinematic context outside the base radio telemetry slice
- Conformance, reproducibility, and experiment runbooks are treated as first-class engineering work

## Core Narrative: What the docs bundle says, in cleaner internal-site language

The central message of the bundle is that `radio-sim` is already a meaningful control and validation substrate, but it is not the whole PIN story. The docs are at their best when they stay precise about that boundary.

### Architecture and Runtime Boundary

The `radio-sim` stack is a discrete-event simulator with a Rust core, PyO3 bindings, and experiment tooling layered above it. Core radio behavior stays in Rust while Python exposes configuration, runtime stepping, and controller hooks. That separation is deliberate: the simulator remains the radio-side substrate, not the entire training pipeline.

### What the Controller Actually Sees

The implemented runtime API exposes interval-aggregated local observations per node: queue state, backoff state, contention summaries, attempt and delivery counters, latency summaries, and neighbor RSSI or PDR hints. It is intentionally a local reactive surface. Richer scene-conditioned sensing belongs to the broader PIN stack and should not be described as if it already lives inside the current radio runtime.

### Protocol Modes and Current Maturity

Two MAC families are documented: CSMA for Silvus-like behavior and TDMA for TSM-style barrage relay. CSMA currently carries the most complete local action path, including EDCA-style AIFS, contention-window, and TXOP tuning. TDMA delivery, slot handling, relay behavior, and combining are documented, but the local control overlay is still substantially less mature.

### PIN Formulation and Learning View

The docs now treat the canonical v1 training problem as a two-level Stackelberg game rather than generic simultaneous-move MARL. The environment or scenario layer commits first, and distributed PIN followers respond through local overlay actions. That framing is one of the clearest outputs of the bundle and should remain central to any internal summary of the work.

### Validation, Conformance, and Repeatability

The bundle is not only theory and protocol prose. It includes conformance profiles, strictness modes, baseline comparisons, a reproducible PIN optimal-control demo runbook, and deterministic experiment guidance. That makes the simulator more than a concept page; it is framed as a testable and reviewable engineering system.

### Broader Stack Integration

The docs repeatedly position `radio-sim` inside a larger program that also includes geometry, traffic, and RF enrichment tooling. The important point is not just that these upstream systems exist, but that they provide the richer context needed for stronger PIN claims while the current runtime remains honest about what a radio observes today.

## Implemented vs Planned: The most important distinction to preserve

The source material is unusually careful about scope. That is a strength, and the internal page should preserve it rather than flattening everything into one maturity level.

- Implemented now: local CSMA observation and action surface, Python API control loop, conformance harness, and reproducible experiment workflow.
- Implemented upstream but not native to the radio runtime: scene structure, platoon layout, traffic programs, and RF/pathloss enrichments from adjacent repositories.
- Planned broader PIN scope: richer observation bundles, predictive features, distributed MARL training beyond the local telemetry slice, and a fuller TDMA local-control path.

## Capability Areas: What can be summarized on this page without turning it into repo docs

### Simulation Core

Discrete-event runtime, event dispatch, packet handling, channel logic, and metric collection.

### Python Control Surface

Configuration, runtime stepping, observation polling, local action injection, and experiment scripting.

### CSMA Control Path

Current best-developed control target for local PIN overlays and the main basis for the v1 learning docs.

### TDMA / Barrage Relay

Documented protocol path with relay lifecycle and slot semantics, but not yet an equally mature control target.

### Validation and Conformance

Profile-driven checks, scenario sets, strictness modes, baseline comparisons, and repeatable KPI review.

### Media and Voice Path

Audio and media injection path, end-to-end reconstruction, and stream-level KPI handling for communication experiments.

## Next Steps: How to use this material on the DBG site

- Pull the strongest implementation-backed pieces of `radio-sim` into a cleaner internal narrative without collapsing the implemented-versus-planned distinction.
- Keep CSMA, TDMA, and broader PIN-scope claims carefully separated so collaborators do not overread current runtime maturity.
- Use conformance and optimal-control experiment outputs as the default evidence layer when describing progress, not only architecture diagrams.
- Decide which assets from the docs bundle are safe for collaborator web review under the current weak password gate and which should stay in repo-local documentation only.
