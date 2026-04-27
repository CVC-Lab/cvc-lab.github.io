# PIN Local Radio Control Optimization

## Goal
Design a minimal local control overlay for each radio (not a global controller) that improves mission-relevant reliability and timeliness under load.

## Local Overlay Assumption
Each radio hosts a local PIN agent that:
- reads local observation windows every $\Delta_c$ milliseconds,
- emits local control action $a_t^{(i)}$ for its own MAC only,
- does not directly command other radios.

This matches deployability constraints where waveform internals remain unchanged and control sits above the radio MAC as an overlay.

## R-POMDP Formulation
For radio $i$ at control step $t$:
- Hidden network state: $x_t$
- Local observation: $o_t^{(i)} \sim O_i(\cdot \mid x_t)$
- Local action: $a_t^{(i)} \sim \pi_\theta(\cdot \mid h_t^{(i)})$
- History: $h_t^{(i)} = (o_{0:t}^{(i)}, a_{0:t-1}^{(i)})$

The objective is constrained expected return:

$$
\max_{\pi_\theta}\; \mathbb{E}\!\left[\sum_{t=0}^{T-1} \gamma^t r_t\right]
$$

subject to mission constraints:
- $PDR_t^{cmd} \ge p_{\min}$
- $L_{95,t}^{cmd} \le \ell_{\max}$
- $Drop_t^{cmd} \approx 0$

where $cmd$ is command/control traffic class.

## Minimal Action Space
Per class $c \in \{\text{command}, \text{voice}, \text{best\_effort}\}$:
- $w_c$: service bias (queue/scheduling preference)
- $\eta_c$: admission threshold (drop pressure gate)
- $\kappa_c$: CSMA contention aggressiveness (CW scaling)

So each node action is:

$$
a_t^{(i)} = \{w_c,\eta_c,\kappa_c\}_{c=1}^{3}
$$

Implemented as `LocalAction` in code:
- `service_bias[c]`
- `admission_threshold[c]`
- `cw_aggressiveness[c]`

## Observation Vector Requirements
At each window, each node provides:
- queue lengths by class,
- TX attempts/success by class,
- retry and ACK timeout counts by class,
- drop counts by class,
- per-class delivery counts,
- per-class p95 latency estimate,
- collision count,
- CCA busy fraction,
- mean backoff slots.

Implemented as `LocalObservation` in code.

## Reward Design (first demonstrator)
Latency-first with high-priority PDR floor:

$$
r_t = \alpha\,PDR_t^{high} - \beta\,L95_t^{high} - \delta\,Drop_t^{high} + \zeta\,Deliveries_t^{high}
$$

where $high = \{\text{command}, \text{voice}\}$.

The first demo uses tabular RL with this reward shape and evaluates against a neutral baseline.

## Why This Is Minimal but Effective
- No routing/power/slot-plan changes required.
- Uses only local telemetry and local action.
- Acts on congestion where PDR/latency degradation appears first.
- Keeps protocol mechanics intact (CSMA timers/ACK flow, TDMA relay semantics).

## Simulator Mapping
### Action execution mapping
- `service_bias` -> class-aware queue ordering score
- `admission_threshold` -> class-aware enqueue drop decision
- `cw_aggressiveness` -> class-aware CSMA backoff exponent scaling

### Observation mapping
Windowed observations come from per-node MAC counters + per-window delivery/latency aggregation in simulation runner.

## Scope for this pass
- Active control path: CSMA.
- TDMA: control I/O scaffold only (no active adaptive scheduling changes).

This preserves TSM barrage behavior while enabling immediate end-to-end PIN validation on CSMA.

## Companion Documentation

- PIN controller API contract: [`../radio-sim/docs/pin_controller_api.md`](../radio-sim/docs/pin_controller_api.md)
- Optimal-control experiment runbook: [`pin_optimal_control_experiment.md`](pin_optimal_control_experiment.md)
