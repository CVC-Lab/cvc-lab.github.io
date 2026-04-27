use hashbrown::HashMap;
use serde::Serialize;

use radio_sim_core::config::{
    ControlOverlayConfig, CsmaConfig, GeneralConfig, MacConfig, PhyConfig, SimConfig,
    TrafficConfig, TrafficModel,
};
use radio_sim_core::control::{AccessCategoryValues, LocalAction, LocalObservation};
use radio_sim_core::des::SimTime;
use radio_sim_core::sim::Simulation;

const ACTIONS: usize = 4;
const CONTROL_INTERVAL_MS: f64 = 250.0;
const TRAIN_EPISODES: usize = 2;
const EVAL_SEEDS: [u64; 2] = [201, 202];
const BASE_TRAIN_SEED: u64 = 10_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct State {
    q_bin: u8,
    busy_bin: u8,
    drop_bin: u8,
}

#[derive(Debug, Default)]
struct TabularPolicy {
    q: HashMap<State, [f64; ACTIONS]>,
}

impl TabularPolicy {
    fn values_mut(&mut self, state: State) -> &mut [f64; ACTIONS] {
        self.q.entry(state).or_insert([0.0; ACTIONS])
    }

    fn values(&self, state: State) -> [f64; ACTIONS] {
        self.q.get(&state).copied().unwrap_or([0.0; ACTIONS])
    }

    fn greedy(&self, state: State) -> usize {
        let values = self.values(state);
        argmax(&values)
    }

    fn epsilon_greedy(&self, state: State, epsilon: f64, rng: &mut SmallRng) -> usize {
        if rng.next_f64() < epsilon {
            rng.next_usize(ACTIONS)
        } else {
            self.greedy(state)
        }
    }

    fn update(&mut self, s: State, a: usize, r: f64, s_next: State, alpha: f64, gamma: f64) {
        let next_values = self.values(s_next);
        let next_best = next_values[argmax(&next_values)];
        let target = r + gamma * next_best;
        let values = self.values_mut(s);
        values[a] += alpha * (target - values[a]);
    }
}

#[derive(Debug, Clone, Serialize)]
struct EpisodeMetrics {
    seed: u64,
    high_pdr: f64,
    high_p95_latency_ms: f64,
    overall_pdr: f64,
    overall_p95_latency_ms: f64,
}

#[derive(Debug, Clone, Serialize)]
struct EpisodeDelta {
    high_pdr: f64,
    high_p95_latency_ms: f64,
    overall_pdr: f64,
    overall_p95_latency_ms: f64,
}

#[derive(Debug, Clone, Serialize)]
struct StepMetrics {
    time_ms: f64,
    high_pdr: f64,
    high_p95_latency_ms: f64,
    overall_pdr: f64,
    overall_p95_latency_ms: f64,
    high_queue_mean: f64,
    best_effort_queue_mean: f64,
    high_drops: u64,
    best_effort_drops: u64,
    cca_busy_mean: f64,
    backoff_mean: f64,
}

#[derive(Debug, Clone, Serialize)]
struct SeedScenario {
    seed: u64,
    baseline_metrics: EpisodeMetrics,
    controlled_metrics: EpisodeMetrics,
    delta: EpisodeDelta,
    baseline_trace: Vec<StepMetrics>,
    controlled_trace: Vec<StepMetrics>,
    controlled_action_counts: [u64; ACTIONS],
}

#[derive(Debug, Clone, Serialize)]
struct AggregateMetrics {
    high_pdr_mean: f64,
    high_p95_latency_ms_mean: f64,
    overall_pdr_mean: f64,
    overall_p95_latency_ms_mean: f64,
}

#[derive(Debug, Clone, Serialize)]
struct DemoOutput {
    config: DemoConfig,
    baseline: Vec<EpisodeMetrics>,
    controlled: Vec<EpisodeMetrics>,
    baseline_mean: AggregateMetrics,
    controlled_mean: AggregateMetrics,
    delta: AggregateMetrics,
    seed_scenarios: Vec<SeedScenario>,
    highlight_seed: u64,
    highlight_reason: String,
}

#[derive(Debug, Clone, Serialize)]
struct DemoConfig {
    control_interval_ms: f64,
    train_episodes: usize,
    eval_seeds: Vec<u64>,
    objective: &'static str,
}

#[derive(Debug, Default)]
struct EpisodeAccumulator {
    high_attempts: u64,
    high_successes: u64,
    high_latency_samples_ms: Vec<f64>,
}

#[derive(Debug)]
struct EpisodeRun {
    metrics: EpisodeMetrics,
    trace: Vec<StepMetrics>,
    action_counts: [u64; ACTIONS],
}

#[derive(Debug, Clone, Copy)]
struct SmallRng {
    state: u64,
}

impl SmallRng {
    fn new(seed: u64) -> Self {
        SmallRng {
            state: seed ^ 0x9E3779B97F4A7C15,
        }
    }

    fn next_u64(&mut self) -> u64 {
        // xorshift64*
        let mut x = self.state;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.state = x;
        x.wrapping_mul(0x2545F4914F6CDD1D)
    }

    fn next_f64(&mut self) -> f64 {
        let v = self.next_u64() >> 11;
        (v as f64) / ((1u64 << 53) as f64)
    }

    fn next_usize(&mut self, n: usize) -> usize {
        (self.next_u64() as usize) % n
    }
}

fn argmax(values: &[f64; ACTIONS]) -> usize {
    let mut best_idx = 0usize;
    let mut best_val = values[0];
    for (idx, value) in values.iter().enumerate().skip(1) {
        if *value > best_val {
            best_val = *value;
            best_idx = idx;
        }
    }
    best_idx
}

fn percentile95(mut values: Vec<f64>) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let idx = ((values.len() as f64 * 0.95) as usize).min(values.len() - 1);
    values[idx]
}

fn build_config(seed: u64) -> SimConfig {
    SimConfig {
        general: GeneralConfig {
            num_nodes: 8,
            area_size_m: 150.0,
            sim_duration_s: 1.5,
            seed,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.6,
            broadcast_probability: 0.15,
            node_queue_size: 6,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::Bernoulli,
            packet_bits: 1024,
            codec: radio_sim_core::config::CodecConfig::default(),
            class_mix: radio_sim_core::config::TrafficClassMix {
                command: 0.15,
                voice: 0.25,
                best_effort: 0.60,
            },
            ..TrafficConfig::default()
        },
        control_overlay: ControlOverlayConfig {
            enabled: true,
            observation_interval_ms: 250.0,
        },
        ..SimConfig::default()
    }
}

fn state_from_obs(obs: &LocalObservation) -> State {
    let q_high = obs.queue_len.vo + obs.queue_len.vi;
    let q_bin = if q_high == 0 {
        0
    } else if q_high <= 3 {
        1
    } else if q_high <= 7 {
        2
    } else {
        3
    };
    let busy_bin = if obs.cca_busy_fraction < 0.35 {
        0
    } else if obs.cca_busy_fraction < 0.6 {
        1
    } else {
        2
    };
    let high_drops = obs.drops.vo + obs.drops.vi;
    let drop_bin = if high_drops == 0 {
        0
    } else if high_drops <= 2 {
        1
    } else {
        2
    };
    State {
        q_bin,
        busy_bin,
        drop_bin,
    }
}

fn action_template(idx: usize) -> LocalAction {
    match idx {
        // Push VO/VI earlier into contention and lengthen BE/BK deferral.
        1 => LocalAction {
            aifsn_delta: AccessCategoryValues::new(-1, -1, 1, 2),
            cw_min_exp_delta: AccessCategoryValues::new(-1, -1, 1, 1),
            cw_max_exp_delta: AccessCategoryValues::new(-1, -1, 1, 1),
            txop_limit_us_delta: AccessCategoryValues::new(752, 1504, 0, 0),
            ..LocalAction::default()
        },
        // Moderate prioritization for VO/VI with mild BE/BK expansion.
        2 => LocalAction {
            aifsn_delta: AccessCategoryValues::new(0, 0, 1, 1),
            cw_min_exp_delta: AccessCategoryValues::new(0, -1, 0, 1),
            cw_max_exp_delta: AccessCategoryValues::new(0, -1, 0, 1),
            txop_limit_us_delta: AccessCategoryValues::new(512, 1024, 0, 0),
            ..LocalAction::default()
        },
        // Conservative shift that reduces VO/VI aggression slightly.
        3 => LocalAction {
            aifsn_delta: AccessCategoryValues::new(1, 0, 0, 1),
            cw_min_exp_delta: AccessCategoryValues::new(1, 0, 0, 1),
            cw_max_exp_delta: AccessCategoryValues::new(1, 0, 0, 1),
            txop_limit_us_delta: AccessCategoryValues::new(-512, 0, 0, 0),
            ..LocalAction::default()
        },
        // Neutral baseline.
        _ => LocalAction::default(),
    }
}

fn reward(obs: &LocalObservation) -> f64 {
    let high_attempts = (obs.tx_attempts.vo + obs.tx_attempts.vi) as f64;
    let high_success = (obs.tx_success.vo + obs.tx_success.vi) as f64;
    let high_pdr = if high_attempts > 0.0 {
        high_success / high_attempts
    } else {
        0.0
    };
    let high_deliveries = (obs.deliveries.vo + obs.deliveries.vi) as f64;
    let high_drops = (obs.drops.vo + obs.drops.vi) as f64;
    let high_p95_ms = (obs.p95_latency_ns.vo.max(obs.p95_latency_ns.vi) as f64) / 1e6;
    2.5 * high_pdr + 0.03 * high_deliveries - 0.015 * high_p95_ms - 0.05 * high_drops
}

fn aggregate_step(time_ms: f64, observations: &[LocalObservation]) -> StepMetrics {
    let mut high_attempts = 0u64;
    let mut high_success = 0u64;
    let mut all_attempts = 0u64;
    let mut all_success = 0u64;
    let mut high_latency = Vec::new();
    let mut overall_latency = Vec::new();
    let mut high_queue_sum = 0f64;
    let mut best_queue_sum = 0f64;
    let mut high_drops = 0u64;
    let mut best_drops = 0u64;
    let mut cca_sum = 0f64;
    let mut backoff_sum = 0f64;

    for obs in observations {
        high_attempts += (obs.tx_attempts.vo + obs.tx_attempts.vi) as u64;
        high_success += (obs.tx_success.vo + obs.tx_success.vi) as u64;
        all_attempts +=
            (obs.tx_attempts.vo + obs.tx_attempts.vi + obs.tx_attempts.be + obs.tx_attempts.bk)
                as u64;
        all_success +=
            (obs.tx_success.vo + obs.tx_success.vi + obs.tx_success.be + obs.tx_success.bk)
                as u64;
        if obs.p95_latency_ns.vo > 0 {
            high_latency.push(obs.p95_latency_ns.vo as f64 / 1e6);
            overall_latency.push(obs.p95_latency_ns.vo as f64 / 1e6);
        }
        if obs.p95_latency_ns.vi > 0 {
            high_latency.push(obs.p95_latency_ns.vi as f64 / 1e6);
            overall_latency.push(obs.p95_latency_ns.vi as f64 / 1e6);
        }
        if obs.p95_latency_ns.be > 0 {
            overall_latency.push(obs.p95_latency_ns.be as f64 / 1e6);
        }
        if obs.p95_latency_ns.bk > 0 {
            overall_latency.push(obs.p95_latency_ns.bk as f64 / 1e6);
        }
        high_queue_sum += (obs.queue_len.vo + obs.queue_len.vi) as f64;
        best_queue_sum += (obs.queue_len.be + obs.queue_len.bk) as f64;
        high_drops += (obs.drops.vo + obs.drops.vi) as u64;
        best_drops += (obs.drops.be + obs.drops.bk) as u64;
        cca_sum += obs.cca_busy_fraction;
        backoff_sum += obs.mean_backoff_slots;
    }

    let n = observations.len().max(1) as f64;
    let high_pdr = if high_attempts > 0 {
        high_success as f64 / high_attempts as f64
    } else {
        0.0
    };
    let overall_pdr = if all_attempts > 0 {
        all_success as f64 / all_attempts as f64
    } else {
        0.0
    };

    StepMetrics {
        time_ms,
        high_pdr,
        high_p95_latency_ms: percentile95(high_latency),
        overall_pdr,
        overall_p95_latency_ms: percentile95(overall_latency),
        high_queue_mean: high_queue_sum / n,
        best_effort_queue_mean: best_queue_sum / n,
        high_drops,
        best_effort_drops: best_drops,
        cca_busy_mean: cca_sum / n,
        backoff_mean: backoff_sum / n,
    }
}

fn delta_episode(controlled: &EpisodeMetrics, baseline: &EpisodeMetrics) -> EpisodeDelta {
    EpisodeDelta {
        high_pdr: controlled.high_pdr - baseline.high_pdr,
        high_p95_latency_ms: controlled.high_p95_latency_ms - baseline.high_p95_latency_ms,
        overall_pdr: controlled.overall_pdr - baseline.overall_pdr,
        overall_p95_latency_ms: controlled.overall_p95_latency_ms - baseline.overall_p95_latency_ms,
    }
}

fn run_episode(
    seed: u64,
    policy: &mut TabularPolicy,
    training: bool,
    epsilon: f64,
    collect_trace: bool,
    force_neutral: bool,
) -> EpisodeRun {
    let mut sim = Simulation::new(build_config(seed)).expect("valid simulation config");
    let interval = SimTime::from_ms(CONTROL_INTERVAL_MS);
    let mut obs = sim.take_local_observations();
    let mut rng = SmallRng::new(seed ^ 0xA5A5_5A5A);
    let mut acc = EpisodeAccumulator::default();
    let mut guard_steps = 0usize;
    let mut trace = Vec::new();
    let mut action_counts = [0u64; ACTIONS];

    while !sim.is_finished() {
        guard_steps += 1;
        if guard_steps > 512 {
            break;
        }
        let mut actions = Vec::with_capacity(obs.len());
        let mut chosen_action_idx = Vec::with_capacity(obs.len());
        for node_obs in &obs {
            let a_idx = if force_neutral {
                0usize
            } else {
                let state = state_from_obs(node_obs);
                if training {
                    policy.epsilon_greedy(state, epsilon, &mut rng)
                } else {
                    policy.greedy(state)
                }
            };
            action_counts[a_idx] += 1;
            chosen_action_idx.push(a_idx);
            actions.push(action_template(a_idx));
        }
        sim.apply_local_actions(&actions);
        let before = sim.current_time();
        sim.run_until(before + interval);
        if sim.current_time() == before {
            break;
        }
        let next_obs = sim.take_local_observations();
        if collect_trace {
            trace.push(aggregate_step(sim.current_time().as_ms(), &next_obs));
        }

        for (idx, node_next) in next_obs.iter().enumerate() {
            acc.high_attempts += (node_next.tx_attempts.vo + node_next.tx_attempts.vi) as u64;
            acc.high_successes += (node_next.tx_success.vo + node_next.tx_success.vi) as u64;
            if node_next.p95_latency_ns.vo > 0 {
                acc.high_latency_samples_ms
                    .push(node_next.p95_latency_ns.vo as f64 / 1e6);
            }
            if node_next.p95_latency_ns.vi > 0 {
                acc.high_latency_samples_ms
                    .push(node_next.p95_latency_ns.vi as f64 / 1e6);
            }
            if training {
                let s = state_from_obs(&obs[idx]);
                let s_next = state_from_obs(node_next);
                let r = reward(node_next);
                policy.update(s, chosen_action_idx[idx], r, s_next, 0.22, 0.90);
            }
        }

        obs = next_obs;
    }

    let summary = sim.metrics.summary();
    let high_pdr = if acc.high_attempts > 0 {
        acc.high_successes as f64 / acc.high_attempts as f64
    } else {
        0.0
    };
    EpisodeRun {
        metrics: EpisodeMetrics {
            seed,
            high_pdr,
            high_p95_latency_ms: percentile95(acc.high_latency_samples_ms),
            overall_pdr: summary.pdr,
            overall_p95_latency_ms: summary.p95_latency_ns / 1e6,
        },
        trace,
        action_counts,
    }
}

fn aggregate(metrics: &[EpisodeMetrics]) -> AggregateMetrics {
    let n = metrics.len().max(1) as f64;
    AggregateMetrics {
        high_pdr_mean: metrics.iter().map(|m| m.high_pdr).sum::<f64>() / n,
        high_p95_latency_ms_mean: metrics
            .iter()
            .map(|m| m.high_p95_latency_ms)
            .sum::<f64>()
            / n,
        overall_pdr_mean: metrics.iter().map(|m| m.overall_pdr).sum::<f64>() / n,
        overall_p95_latency_ms_mean: metrics
            .iter()
            .map(|m| m.overall_p95_latency_ms)
            .sum::<f64>()
            / n,
    }
}

fn subtract(a: &AggregateMetrics, b: &AggregateMetrics) -> AggregateMetrics {
    AggregateMetrics {
        high_pdr_mean: a.high_pdr_mean - b.high_pdr_mean,
        high_p95_latency_ms_mean: a.high_p95_latency_ms_mean - b.high_p95_latency_ms_mean,
        overall_pdr_mean: a.overall_pdr_mean - b.overall_pdr_mean,
        overall_p95_latency_ms_mean: a.overall_p95_latency_ms_mean - b.overall_p95_latency_ms_mean,
    }
}

fn main() {
    let mut policy = TabularPolicy::default();

    for ep in 0..TRAIN_EPISODES {
        let seed = BASE_TRAIN_SEED + ep as u64;
        let epsilon = (0.35 - 0.012 * ep as f64).max(0.05);
        let _ = run_episode(seed, &mut policy, true, epsilon, false, false);
        eprintln!("trained episode {} seed {}", ep + 1, seed);
    }

    let mut baseline_runs = Vec::with_capacity(EVAL_SEEDS.len());
    for seed in EVAL_SEEDS {
        let mut neutral = TabularPolicy::default();
        baseline_runs.push(run_episode(seed, &mut neutral, false, 0.0, true, true));
        eprintln!("baseline eval seed {}", seed);
    }

    let mut controlled_runs = Vec::with_capacity(EVAL_SEEDS.len());
    for seed in EVAL_SEEDS {
        controlled_runs.push(run_episode(seed, &mut policy, false, 0.0, true, false));
        eprintln!("controlled eval seed {}", seed);
    }

    let baseline: Vec<EpisodeMetrics> = baseline_runs.iter().map(|r| r.metrics.clone()).collect();
    let controlled: Vec<EpisodeMetrics> = controlled_runs.iter().map(|r| r.metrics.clone()).collect();

    let baseline_mean = aggregate(&baseline);
    let controlled_mean = aggregate(&controlled);
    let delta = subtract(&controlled_mean, &baseline_mean);

    let mut seed_scenarios = Vec::with_capacity(EVAL_SEEDS.len());
    for idx in 0..EVAL_SEEDS.len() {
        let b = &baseline_runs[idx];
        let c = &controlled_runs[idx];
        seed_scenarios.push(SeedScenario {
            seed: b.metrics.seed,
            baseline_metrics: b.metrics.clone(),
            controlled_metrics: c.metrics.clone(),
            delta: delta_episode(&c.metrics, &b.metrics),
            baseline_trace: b.trace.clone(),
            controlled_trace: c.trace.clone(),
            controlled_action_counts: c.action_counts,
        });
    }

    let mut highlight_seed = seed_scenarios
        .first()
        .map(|s| s.seed)
        .unwrap_or(0);
    let mut highlight_score = f64::NEG_INFINITY;
    for scenario in &seed_scenarios {
        let pdr_gain = scenario.delta.high_pdr;
        let overall_latency_gain = -scenario.delta.overall_p95_latency_ms;
        let score = pdr_gain + 0.01 * overall_latency_gain;
        if score > highlight_score {
            highlight_score = score;
            highlight_seed = scenario.seed;
        }
    }
    let highlight_reason = seed_scenarios
        .iter()
        .find(|s| s.seed == highlight_seed)
        .map(|scenario| {
            if scenario.delta.overall_p95_latency_ms < 0.0 {
                format!(
                    "Selected seed {} due to strongest combined high-priority PDR gain with overall latency reduction.",
                    highlight_seed
                )
            } else {
                format!(
                    "Selected seed {} due to strongest combined high-priority PDR gain (overall latency did not improve).",
                    highlight_seed
                )
            }
        })
        .unwrap_or_else(|| format!("Selected seed {} for scenario inspection.", highlight_seed));

    let output = DemoOutput {
        config: DemoConfig {
            control_interval_ms: CONTROL_INTERVAL_MS,
            train_episodes: TRAIN_EPISODES,
            eval_seeds: EVAL_SEEDS.to_vec(),
            objective: "Latency-first with high-priority PDR emphasis (soft objective in this demo)",
        },
        baseline,
        controlled,
        baseline_mean,
        controlled_mean,
        delta,
        seed_scenarios,
        highlight_seed,
        highlight_reason,
    };

    let json = serde_json::to_string_pretty(&output).expect("serialize output");
    println!("{json}");
}
