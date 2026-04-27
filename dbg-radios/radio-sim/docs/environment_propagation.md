# Environment and Propagation

## Scope

`radio-sim` currently models radio-channel behavior through analytic PHY/channel models, not map-based obstacle geometry.

## Channel Model

Implemented in `crates/radio-sim-core/src/phy/channel.rs`.

Key modeled effects:

- Path loss: `LogDistance`, `MultiSlope`, or `FreeSpace`.
- Thermal noise floor from bandwidth and noise figure.
- Optional log-normal shadowing (cached per link).
- Optional fading (`JakesFader`) by link.
- SINR computation with explicit interference accounting.

## CCA Modes

Carrier sensing mode is configurable:

- `strongest_signal`: channel busy if any single sender crosses threshold.
- `aggregate_energy`: channel busy if sum energy crosses threshold.

This choice changes CSMA contention behavior significantly in dense deployments.

For CSMA, receiver-side busy detection and packet candidacy are now intentionally separate:

- `cca_threshold_dbm` controls whether arrival energy makes the medium busy at that receiver.
- `rx_sensitivity_dbm` controls whether an arrival is treated as a packet candidate at all.
- `preamble_detect_sinr_db` and `payload_decode_sinr_db` then control detect vs decode for those packet candidates.

That means a weak arrival can still hold CCA busy or reduce another frame's SINR without itself becoming a decodable packet or an EIFS source.

## Time-of-Arrival and Guard Handling

For TDMA cooperative reception, receiver-side signals include:

- `toa_offset_us` relative to earliest arrival in batch.

TDMA combining applies guard-time filtering and fallback policy (`strict` or `strongest_fallback`).

## Scenario Positions

Scenario and media manifests can include node positions, but current loader behavior uses only timestep 0 positions.

- No mobility playback is currently applied from scenario position timelines.

## Controller Observability Boundary

These channel and propagation models influence simulator outcomes, but they are not directly exposed to the current PIN controller API.

Today, the controller sees only interval-aggregated queue and MAC telemetry through `LocalObservation`.

That means the controller does **not** currently observe:

- per-packet SNR or RSSI summaries
- detect-vs-undetectable arrival classification
- direct LOS or NLOS indicators
- pathloss or rx-power summaries
- scene-conditioned mobility or geometry features

This distinction matters for the docs: current local control is a reactive MAC-window controller, not yet a full scene-aware predictive overlay. See [PIN MARL Formulation](pin_marl_formulation.md) for the staged observation model.

## Pathloss Sensing Interpretation

To keep the math clean, it is useful to distinguish the true environmental quantity from the controller-side proxy:

$$
\rho_{ij}(t; \xi) = \text{true pathloss on link } j \rightarrow i
$$

$$
\hat{\rho}_{ij}(t; \xi) = g_{\eta}\!\left(z_{ij}(t; \xi)\right)
$$

where $z_{ij}(t; \xi)$ is whatever sensing bundle is actually available to the controller.

In this repo, that currently means:

- $\rho_{ij}(t; \xi)$ is modeled inside the simulator channel and can also be calculated offline by the upstream `rf-pathloss` stage.
- $\rho_{ij}(t; \xi)$ is not directly exposed by the current `LocalObservation` API.
- a future PIN controller should therefore consume either a side-loaded RF summary derived from `rf-pathloss` or an estimator $\hat{\rho}_{ij}(t; \xi)$ built from future RF proxy channels such as RSSI, SNR, rx-power, link margin, and geometry priors.
- if none of those proxy channels are available, then pathloss remains latent and only its downstream effects are visible through retries, drops, delivery counts, and latency.

This is the right mathematical stance for the docs:

- true pathloss is an environment quantity
- estimated pathloss is a controller quantity
- the current runtime API exposes neither directly

## Unsupported Fidelity Knobs

Validation currently rejects non-default values for:

- `phy.los_k_factor`
- `phy.los_threshold_m`
- `phy.snr_threshold_db`

These are intentionally blocked until behavior is fully supported end-to-end.

## Practical Guidance

- Use `path_loss_model = FreeSpace` for deterministic sanity checks.
- Enable shadowing/fading when evaluating robustness trends.
- Keep CCA mode fixed when comparing baselines to avoid confounding drift.
