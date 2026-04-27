# API Interface

This page documents the user-facing Python API in `radio_sim` and its mapping to core behavior.

## Primary Python Types

- `radio_sim.SimConfig`
- `radio_sim.Simulation`

Bindings are implemented in:
- `crates/radio-sim-py/src/config.rs`
- `crates/radio-sim-py/src/sim.rs`

## `SimConfig`

### Constructors

- `SimConfig()`
- `SimConfig.from_toml(path)`

`from_toml` runs full core validation (`SimConfig::validate`).

### Mode Selection

- `set_csma_mac()`
- `set_tdma_mac()`

### General Settings

- `set_num_nodes(n)`
- `set_sim_duration_s(seconds)`
- `set_area_size_m(meters)`
- `set_seed(seed)`

### Overlay Settings

- `set_control_overlay_enabled(enabled)`
- `set_control_observation_interval_ms(interval_ms)`

### Traffic/Scenario Settings

- `set_scenario_traffic(comms_log_path, audio_dir)`
- `set_media_scenario(manifest_path)`
- `set_traffic_class_mix(command, voice, best_effort)`
- `set_media_mtu_bytes(mtu_bytes)`
- `set_media_playout_slack_ms(slack_ms)`
- `set_voice_codec(sample_rate_hz, bits_per_sample, channels, frame_duration_ms)`

### PHY/MAC Settings

- `set_free_space_path_loss()`
- `set_tx_power_w(p)`
- `set_csma_queue_size(n)`
- `set_csma_capture_margin_db(margin_db)`
- `set_tdma_guard_fallback_mode(mode)`

### Conformance Settings

- `set_conformance_profile(profile)` where profile is `none|silvus_v1|tsm_v1`
- `set_conformance_strictness(strictness)` where strictness is `advisory|tiered|hard`
- `set_conformance_baseline_path(path_or_none)`
- `set_conformance_require_baseline(bool)`
- `set_conformance_scenario_set(name)`

## `Simulation`

### Construction

```python
cfg = radio_sim.SimConfig()
sim = radio_sim.Simulation(cfg)
```

### Runtime Methods

- `run()` -> returns summary dict.
- `run_until_ms(until_ms)` -> advances to absolute sim time in milliseconds.
- `current_time_ms()` -> current sim time.
- `is_finished()` -> whether `SimEnd` reached.
- `get_local_observations()` -> per-node observations (empty if overlay disabled).
- `apply_local_actions(actions)` -> applies per-node actions (errors if overlay disabled).
- `reconstruct_audio(frames)` -> helper for scenario/media reconstructions.

## Observation and Action Schema

### Observation item fields

- `node_id`, `time_ns`
- per-AC dictionaries keyed by `vo`, `vi`, `be`, `bk`:
  - `queue_len`, `head_of_line_age_ns`, `retry_count`
  - `backoff_stage`, `backoff_slots`, `current_cw_exp`
  - `tx_attempts`, `tx_success`, `retries`, `ack_timeouts`
  - `drops`, `deliveries`, `p95_latency_ns`
  - `internal_collisions`, `txop_grants`, `txop_uses`
- `collisions`, `cca_busy_fraction`, `mean_backoff_slots`

Observation counters are interval-delta style and reset after each `get_local_observations()` call.

Measurement note:

- `tx_attempts`, `tx_success`, `retries`, `ack_timeouts`, and `drops` are node-local interval MAC counters.
- `deliveries` and `p95_latency_ns` are destination-side interval delivery statistics for that node.

If you need sender-confirmed per-radio episode metrics, compute them from packet or event accounting rather than assuming the observation fields already provide them directly.

### Action format

Each action is a per-node dictionary:

```python
{
    "aifsn_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
    "cw_min_exp_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
    "cw_max_exp_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
    "txop_limit_us_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
}
```

The CSMA MAC interprets those deltas around the configured EDCA baseline for the four public access categories `VO / VI / BE / BK`.

## Summary Output Keys

`run()` summary includes:

- `packets_sent`, `packets_delivered`, `packets_dropped`, `drop_events`, `packets_failed`
- `pdr`, `pdr_sender_confirmed`, `pdr_receiver_unique`, `pdr_receiver_pairwise`
- `avg_latency_ns`, `median_latency_ns`, `p95_latency_ns`
- `collisions`, `events_processed`
- `media_results` (for media scenario)
- `voice_results` (for voice/scenario)

Notes:
- `pdr` is an alias of `pdr_sender_confirmed`.
- `pdr_receiver_pairwise` can exceed `1.0` under fanout.

## Minimal End-to-End Example

```python
import radio_sim

cfg = radio_sim.SimConfig()
cfg.set_csma_mac()
cfg.set_num_nodes(8)
cfg.set_sim_duration_s(1.5)
cfg.set_control_overlay_enabled(True)

sim = radio_sim.Simulation(cfg)

while not sim.is_finished():
    sim.run_until_ms(sim.current_time_ms() + 250.0)
    obs = sim.get_local_observations()
    if not obs:
        continue
    actions = [
        {
            "aifsn_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
            "cw_min_exp_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
            "cw_max_exp_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
            "txop_limit_us_delta": {"vo": 0, "vi": 0, "be": 0, "bk": 0},
        }
        for _ in obs
    ]
    sim.apply_local_actions(actions)

print(sim.run())
```
