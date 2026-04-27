use hashbrown::{HashMap, HashSet};

use crate::config::{ConfigError, MacConfig, SimConfig, TdmaConfig, TrafficModel};
use crate::control::{
    AccessCategoryRuntimeSnapshot, AccessCategoryValues, ActionOutcomeCounters, LocalAction,
    LocalObservation, MacControlCounters,
};
use crate::des::{DesEngine, EventKind, NodeId, PacketId, SimTime, SlotRole};
use crate::mac::traits::{MacAction, MetricEvent, TimerKind};
use crate::mac::{CsmaMac, Mac, TdmaMac};
use crate::media::scenario::{MediaScenario, MediaScenarioError};
use crate::metrics::{MediaDropReason, MetricsCollector, VoiceDropReason};
use crate::node::{Node, Vec2};
use crate::packet::Packet;
use crate::phy::channel::Channel;
use crate::rng::RngContext;
use crate::traffic::{BernoulliTraffic, PoissonTraffic, ScenarioTraffic, TrafficGenerator};
use crate::voice::scenario::{Scenario, ScenarioError};

const CSMA_CAPTURE_WINDOW_US: f64 = 16.0;

/// An in-flight CSMA transmission (stored until TxEnd for deferred delivery).
#[derive(Clone)]
struct ActiveTx {
    node_id: NodeId,
    position: Vec2,
    packet: Packet,
    end: SimTime,
}

#[derive(Clone)]
struct ReceiverArrival {
    tx_node_id: NodeId,
    tx_position: Vec2,
    packet: Packet,
    arrival_start: SimTime,
    arrival_end: SimTime,
}

#[derive(Clone, Copy, PartialEq, Eq)]
struct ArrivalKey {
    tx_node_id: NodeId,
    packet_id: PacketId,
}

#[derive(Debug)]
struct NodeIntervalStats {
    deliveries: AccessCategoryValues<u64>,
    latencies_ns: AccessCategoryValues<Vec<u64>>,
}

impl Default for NodeIntervalStats {
    fn default() -> Self {
        NodeIntervalStats {
            deliveries: AccessCategoryValues::default(),
            latencies_ns: AccessCategoryValues::default(),
        }
    }
}

/// A complete simulation instance.
pub struct Simulation {
    pub engine: DesEngine,
    pub config: SimConfig,
    pub rng: RngContext,
    pub nodes: Vec<Node>,
    pub macs: Vec<Box<dyn Mac>>,
    pub channel: Channel,
    pub metrics: MetricsCollector,
    pub next_packet_id: PacketId,
    traffic_gens: Vec<Box<dyn TrafficGenerator>>,
    /// Pending CSMA transmissions from the current event handler.
    csma_pending_tx: Vec<(NodeId, Vec2, Packet)>,
    /// TDMA transmissions staged at SlotStart and delivered at SlotEnd.
    tdma_slot_transmissions: HashMap<(u32, u16), Vec<(NodeId, Vec2, Packet)>>,
    /// CCA threshold from CSMA config (cached).
    cca_threshold_dbm: f64,
    /// In-flight CSMA transmissions awaiting sender-local TxEnd.
    active_transmissions: Vec<ActiveTx>,
    /// CSMA arrivals scheduled but not yet started at each receiver.
    scheduled_arrivals: Vec<Vec<ReceiverArrival>>,
    /// Receiver-local active CSMA arrivals used for CCA and overlap tracking.
    active_arrivals: Vec<Vec<ReceiverArrival>>,
    /// Receiver-local completed CSMA arrivals retained for overlap-history reconstruction.
    completed_arrivals: Vec<Vec<ReceiverArrival>>,
    /// Receiver-local arrivals that completed and still need one RxBatch evaluation.
    pending_rx_targets: Vec<Vec<ArrivalKey>>,
    /// Whether control-overlay logic is active.
    overlay_enabled: bool,
    /// Previous cumulative MAC counters for delta observation windows.
    prev_mac_counters: Vec<MacControlCounters>,
    /// Previous cumulative action-outcome counters for delta windows.
    prev_action_outcomes: Vec<ActionOutcomeCounters>,
    /// Interval-level per-node delivery/latency/drop stats.
    interval_stats: Vec<NodeIntervalStats>,
    /// Simulation termination state.
    finished: bool,
}

#[derive(Debug)]
pub enum SimulationInitError {
    InvalidConfig(ConfigError),
    ScenarioLoad(ScenarioError),
    MediaScenarioLoad(MediaScenarioError),
    Internal(&'static str),
}

impl std::fmt::Display for SimulationInitError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SimulationInitError::InvalidConfig(err) => write!(f, "{err}"),
            SimulationInitError::ScenarioLoad(err) => write!(f, "failed to load scenario traffic: {err}"),
            SimulationInitError::MediaScenarioLoad(err) => {
                write!(f, "failed to load media scenario: {err}")
            }
            SimulationInitError::Internal(msg) => write!(f, "internal simulation init error: {msg}"),
        }
    }
}

impl std::error::Error for SimulationInitError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            SimulationInitError::InvalidConfig(err) => Some(err),
            SimulationInitError::ScenarioLoad(err) => Some(err),
            SimulationInitError::MediaScenarioLoad(err) => Some(err),
            SimulationInitError::Internal(_) => None,
        }
    }
}

impl Simulation {
    pub fn new(config: SimConfig) -> Result<Self, SimulationInitError> {
        config
            .validate()
            .map_err(SimulationInitError::InvalidConfig)?;
        let rng = RngContext::new(config.general.seed);
        let num = config.general.num_nodes as usize;

        // Initialize nodes with random positions
        let mut nodes = Vec::with_capacity(num);
        for i in 0..num {
            let mut node_rng = rng.stream(&format!("node_init:{i}"));
            let pos = Vec2::new(
                node_rng.gen_range_float(0.0, config.general.area_size_m),
                node_rng.gen_range_float(0.0, config.general.area_size_m),
            );
            nodes.push(Node::new(i as NodeId, pos));
        }

        // Create MAC instances
        let mut macs: Vec<Box<dyn Mac>> = Vec::with_capacity(num);
        let cca_threshold_dbm = match &config.mac {
            MacConfig::Tdma(_) => -82.0,
            MacConfig::Csma(c) => c.cca_threshold_dbm,
        };
        let allow_tdma_origination = !matches!(
            &config.traffic.model,
            TrafficModel::Scenario { .. }
                | TrafficModel::MediaScenario { .. }
                | TrafficModel::MediaInMemory { .. }
        );
        match &config.mac {
            MacConfig::Tdma(tdma_cfg) => {
                let dlc_indices: Vec<u16> = tdma_cfg
                    .slot_roles
                    .iter()
                    .enumerate()
                    .filter(|(_, r)| **r == SlotRole::DLC)
                    .map(|(i, _)| i as u16)
                    .collect();
                for _ in 0..num {
                    macs.push(Box::new(TdmaMac::new(
                        tdma_cfg.clone(),
                        &dlc_indices,
                        config.general.num_nodes,
                        allow_tdma_origination,
                    )));
                }
            }
            MacConfig::Csma(csma_cfg) => {
                for _ in 0..num {
                    macs.push(Box::new(CsmaMac::new(csma_cfg.clone())));
                }
            }
        }

        let scenario = match &config.traffic.model {
            TrafficModel::Scenario {
                comms_log_path,
                audio_dir,
            } => Some(
                Scenario::load(
                    comms_log_path,
                    audio_dir,
                    &config.traffic.codec,
                    config.general.num_nodes,
                )
                .map_err(SimulationInitError::ScenarioLoad)?,
            ),
            _ => None,
        };
        let media_scenario = match &config.traffic.model {
            TrafficModel::MediaScenario { manifest_path } => Some(
                MediaScenario::load(
                    manifest_path,
                    config.general.num_nodes,
                    config.traffic.mtu_bytes,
                    config.traffic.playout_slack_ms,
                )
                .map_err(SimulationInitError::MediaScenarioLoad)?,
            ),
            TrafficModel::MediaInMemory { entries } => Some(
                MediaScenario::from_in_memory(
                    entries.as_ref().clone(),
                    config.general.num_nodes,
                    config.traffic.mtu_bytes,
                    config.traffic.playout_slack_ms,
                    None,
                )
                .map_err(SimulationInitError::MediaScenarioLoad)?,
            ),
            _ => None,
        };

        // Override random positions with scenario positions if available
        if let Some(ref scenario) = scenario {
            if let Some(ref positions) = scenario.node_positions {
                for (i, pos) in positions.iter().enumerate() {
                    if i < nodes.len() {
                        nodes[i].position = *pos;
                    }
                }
            }
        }
        if let Some(ref media_scenario) = media_scenario {
            if let Some(ref positions) = media_scenario.node_positions {
                for (i, pos) in positions.iter().enumerate() {
                    if i < nodes.len() {
                        nodes[i].position = *pos;
                    }
                }
            }
        }

        // Create traffic generators based on config.traffic.model
        let mut traffic_gens: Vec<Box<dyn TrafficGenerator>> = Vec::with_capacity(num);
        let max_hops = match &config.mac {
            MacConfig::Tdma(t) => t.max_hops,
            MacConfig::Csma(_) => 1,
        };
        let source_prob = match &config.mac {
            MacConfig::Tdma(t) => t.source_probability,
            MacConfig::Csma(c) => c.source_probability,
        };
        let bcast_prob = match &config.mac {
            MacConfig::Tdma(t) => t.broadcast_probability,
            MacConfig::Csma(c) => c.broadcast_probability,
        };
        for i in 0..num {
            let gen: Box<dyn TrafficGenerator> = match &config.traffic.model {
                TrafficModel::Poisson { rate_per_slot } => Box::new(PoissonTraffic {
                    rate_per_slot: *rate_per_slot,
                    broadcast_probability: bcast_prob,
                    packet_bits: config.traffic.packet_bits,
                    max_hops,
                    class_mix: config.traffic.class_mix.clone(),
                }),
                TrafficModel::Bernoulli => Box::new(BernoulliTraffic {
                    source_probability: source_prob,
                    broadcast_probability: bcast_prob,
                    packet_bits: config.traffic.packet_bits,
                    max_hops,
                    class_mix: config.traffic.class_mix.clone(),
                }),
                TrafficModel::Scenario { .. } => {
                    let frames = scenario
                        .as_ref()
                        .ok_or(SimulationInitError::Internal("scenario model without loaded scenario"))?
                        .frames_for_sender(i as NodeId);
                    Box::new(ScenarioTraffic::new(frames, max_hops))
                }
                TrafficModel::MediaScenario { .. } | TrafficModel::MediaInMemory { .. } => {
                    let frames = media_scenario
                        .as_ref()
                        .ok_or(SimulationInitError::Internal(
                            "media scenario model without loaded manifest",
                        ))?
                        .frames_for_sender(i as NodeId);
                    Box::new(ScenarioTraffic::new(frames, max_hops))
                }
            };
            traffic_gens.push(gen);
        }

        let channel = Channel::new(&config.phy, &rng);
        let mut metrics = MetricsCollector::new();
        metrics.set_num_nodes(config.general.num_nodes);
        if let Some(scenario) = &scenario {
            metrics.seed_voice_messages(&scenario.expected_messages());
        }
        if let Some(media_scenario) = &media_scenario {
            metrics.seed_media_streams(media_scenario.expected_streams());
            metrics.seed_media_frame_deadlines(media_scenario.expected_frame_deadlines());
        }
        let mut engine = DesEngine::new();

        // Schedule initial events
        match &config.mac {
            MacConfig::Tdma(tdma_cfg) => {
                Self::schedule_tdma_slots(&mut engine, tdma_cfg, config.general.sim_duration_s);
            }
            MacConfig::Csma(csma_cfg)
                if !matches!(
                    &config.traffic.model,
                    TrafficModel::Scenario { .. }
                        | TrafficModel::MediaScenario { .. }
                        | TrafficModel::MediaInMemory { .. }
                ) =>
            {
                Self::schedule_csma_init(
                    &mut engine,
                    csma_cfg,
                    num,
                    config.general.sim_duration_s,
                );
            }
            MacConfig::Csma(_) => {}
        }
        if matches!(
            &config.traffic.model,
            TrafficModel::Scenario { .. }
                | TrafficModel::MediaScenario { .. }
                | TrafficModel::MediaInMemory { .. }
        ) {
            Self::schedule_scenario_traffic(
                &mut engine,
                &traffic_gens,
                config.general.sim_duration_s,
            );
        }

        engine.schedule(
            SimTime::from_s(config.general.sim_duration_s),
            i8::MAX,
            EventKind::SimEnd,
        );

        let overlay_enabled = config.control_overlay.enabled;
        let prev_mac_counters = if overlay_enabled {
            macs
                .iter()
                .map(|m| m.snapshot_mac_counters())
                .collect::<Vec<_>>()
        } else {
            vec![MacControlCounters::default(); num]
        };
        let prev_action_outcomes = if overlay_enabled {
            macs
                .iter()
                .map(|m| m.snapshot_action_outcomes())
                .collect::<Vec<_>>()
        } else {
            vec![ActionOutcomeCounters::default(); num]
        };
        let interval_stats = (0..num).map(|_| NodeIntervalStats::default()).collect();

        Ok(Simulation {
            engine,
            config,
            rng,
            nodes,
            macs,
            channel,
            metrics,
            next_packet_id: 1,
            traffic_gens,
            csma_pending_tx: Vec::new(),
            tdma_slot_transmissions: HashMap::new(),
            cca_threshold_dbm,
            active_transmissions: Vec::new(),
            prev_action_outcomes,
            scheduled_arrivals: vec![Vec::new(); num],
            active_arrivals: vec![Vec::new(); num],
            completed_arrivals: vec![Vec::new(); num],
            pending_rx_targets: vec![Vec::new(); num],
            overlay_enabled,
            prev_mac_counters,
            interval_stats,
            finished: false,
        })
    }

    fn schedule_tdma_slots(engine: &mut DesEngine, cfg: &TdmaConfig, duration_s: f64) {
        let slot_duration = SimTime::from_ms(cfg.slot_duration_ms);
        if slot_duration == SimTime::ZERO || cfg.slot_roles.is_empty() {
            return;
        }
        let end = SimTime::from_s(duration_s);
        let mut time = SimTime::ZERO;
        let mut frame = 0u32;
        while time < end {
            for (slot_idx, role) in cfg.slot_roles.iter().enumerate() {
                if time >= end {
                    break;
                }
                let slot_end = time + slot_duration;
                if slot_end > end {
                    time = end;
                    break;
                }
                engine.schedule(
                    time,
                    -2,
                    EventKind::SlotStart {
                        frame,
                        slot: slot_idx as u16,
                        role: *role,
                    },
                );
                engine.schedule(
                    slot_end,
                    -3,
                    EventKind::SlotEnd {
                        frame,
                        slot: slot_idx as u16,
                    },
                );
                time = slot_end;
            }
            frame += 1;
        }
    }

    fn schedule_csma_init(
        engine: &mut DesEngine,
        cfg: &crate::config::CsmaConfig,
        num_nodes: usize,
        duration_s: f64,
    ) {
        let slot_us = cfg.slot_duration_us;
        let interval = SimTime::from_us(slot_us * 100.0);
        let end = SimTime::from_s(duration_s);
        for node_id in 0..num_nodes {
            let mut time = SimTime::from_us(slot_us * node_id as f64);
            while time < end {
                engine.schedule(
                    time,
                    1,
                    EventKind::TrafficGenerate {
                        node_id: node_id as NodeId,
                    },
                );
                time = time + interval;
            }
        }
    }

    fn schedule_scenario_traffic(
        engine: &mut DesEngine,
        traffic_gens: &[Box<dyn TrafficGenerator>],
        duration_s: f64,
    ) {
        let end = SimTime::from_s(duration_s);
        for (node_id, gen) in traffic_gens.iter().enumerate() {
            let mut times = gen.pending_times();
            times.sort_unstable();
            for time in times {
                if time < end {
                    engine.schedule(
                        time,
                        1,
                        EventKind::TrafficGenerate {
                            node_id: node_id as NodeId,
                        },
                    );
                }
            }
        }
    }

    pub fn run(&mut self) {
        self.run_until(SimTime::MAX);
    }

    /// Advance simulation up to and including `until` (absolute sim time).
    pub fn run_until(&mut self, until: SimTime) {
        if self.finished {
            return;
        }
        while let Some(next_time) = self.engine.peek_next_time() {
            if next_time > until {
                break;
            }
            let event = match self.engine.next_event() {
                Some(ev) => ev,
                None => break,
            };
            match event.kind {
                EventKind::SimEnd => {
                    self.finished = true;
                    break;
                }
                _ => self.dispatch(event.kind, event.time),
            }
        }
    }

    pub fn current_time(&self) -> SimTime {
        self.engine.now()
    }

    pub fn is_finished(&self) -> bool {
        self.finished
    }

    pub fn apply_local_actions(&mut self, actions: &[LocalAction]) {
        if !self.overlay_enabled {
            return;
        }
        let n = actions.len().min(self.macs.len());
        let now = self.engine.now();
        for (idx, action) in actions.iter().take(n).enumerate() {
            let mut rng = self
                .rng
                .stream(&format!("apply_action:{idx}:{}", now.as_ns()));
            let mac_actions = self.macs[idx].apply_local_action(action, now, &mut rng);
            // Process emitted metric / schedule actions (e.g., drop events from purges).
            self.process_csma_actions(idx, mac_actions, now);
        }
    }

    pub fn take_local_observations(&mut self) -> Vec<LocalObservation> {
        if !self.overlay_enabled {
            return Vec::new();
        }
        let now_ns = self.current_time().as_ns();
        let mut out = Vec::with_capacity(self.nodes.len());
        for i in 0..self.nodes.len() {
            let cur = self.macs[i].snapshot_mac_counters();
            let delta = cur.saturating_sub(&self.prev_mac_counters[i]);
            self.prev_mac_counters[i] = cur;

            let access_state: AccessCategoryRuntimeSnapshot =
                self.macs[i].snapshot_access_state(self.current_time());

            let stats = &mut self.interval_stats[i];
            let mut p95_latency_ns = AccessCategoryValues::default();
            for latencies in [
                (&mut stats.latencies_ns.vo, &mut p95_latency_ns.vo),
                (&mut stats.latencies_ns.vi, &mut p95_latency_ns.vi),
                (&mut stats.latencies_ns.be, &mut p95_latency_ns.be),
                (&mut stats.latencies_ns.bk, &mut p95_latency_ns.bk),
            ] {
                if !latencies.0.is_empty() {
                    latencies.0.sort_unstable();
                    let idx = ((latencies.0.len() as f64 * 0.95) as usize)
                        .min(latencies.0.len() - 1);
                    *latencies.1 = latencies.0[idx];
                }
            }

            let cca_busy_fraction = if delta.cca_total_samples > 0 {
                delta.cca_busy_samples as f64 / delta.cca_total_samples as f64
            } else {
                0.0
            };
            let mean_backoff_slots = if delta.backoff_sample_count > 0 {
                delta.backoff_counter_sum as f64 / delta.backoff_sample_count as f64
            } else {
                0.0
            };

            let cur_outcomes = self.macs[i].snapshot_action_outcomes();
            let outcome_delta = cur_outcomes.saturating_sub(&self.prev_action_outcomes[i]);
            self.prev_action_outcomes[i] = cur_outcomes;
            let streams_present = self.macs[i].snapshot_streams_present();

            out.push(LocalObservation {
                node_id: self.nodes[i].id,
                time_ns: now_ns,
                queue_len: access_state.queue_len,
                head_of_line_age_ns: access_state.head_of_line_age_ns,
                retry_count: access_state.retry_count,
                backoff_stage: access_state.backoff_stage,
                backoff_slots: access_state.backoff_slots,
                current_cw_exp: access_state.current_cw_exp,
                tx_attempts: delta.tx_attempts.map(|v| v as u32),
                tx_success: delta.tx_success.map(|v| v as u32),
                retries: delta.retries.map(|v| v as u32),
                ack_timeouts: delta.ack_timeouts.map(|v| v as u32),
                drops: delta.drops.map(|v| v as u32),
                deliveries: stats.deliveries.map(|v| v as u32),
                p95_latency_ns,
                internal_collisions: delta.internal_collisions.map(|v| v as u32),
                txop_grants: delta.txop_grants.map(|v| v as u32),
                txop_uses: delta.txop_uses.map(|v| v as u32),
                collisions: delta.collisions as u32,
                cca_busy_fraction,
                mean_backoff_slots,
                action_outcomes: outcome_delta,
                streams_present,
            });

            self.interval_stats[i] = NodeIntervalStats::default();
        }
        out
    }

    fn dispatch(&mut self, kind: EventKind, now: SimTime) {
        match kind {
            EventKind::SignalArrivalStart {
                rx_node,
                tx_node,
                packet_id,
            } => {
                self.handle_signal_arrival_start(rx_node, tx_node, packet_id, now);
            }
            EventKind::SignalArrivalEnd {
                rx_node,
                tx_node,
                packet_id,
            } => {
                self.handle_signal_arrival_end(rx_node, tx_node, packet_id, now);
            }
            EventKind::RxBatch { rx_node } => {
                self.handle_csma_rx_batch(rx_node, now);
            }
            EventKind::CarrierSenseUpdate { node_id } => {
                self.handle_medium_state_change(node_id, now);
            }
            EventKind::SlotStart { frame, slot, role } => {
                self.handle_slot_start(frame, slot, role, now);
            }
            EventKind::SlotEnd { frame, slot } => {
                self.handle_slot_end(frame, slot, now);
            }
            EventKind::TrafficGenerate { node_id } => {
                self.handle_traffic_generate(node_id, now);
            }
            EventKind::DifsExpired { node_id } => {
                self.handle_mac_timer(node_id, TimerKind::DifsExpired, now);
            }
            EventKind::SifsExpired { node_id } => {
                self.handle_mac_timer(node_id, TimerKind::SifsExpired, now);
            }
            EventKind::BackoffTick { node_id } => {
                self.handle_mac_timer(node_id, TimerKind::BackoffTick, now);
            }
            EventKind::AckTimeout {
                node_id,
                packet_id,
            } => {
                self.handle_mac_timer(node_id, TimerKind::AckTimeout { packet_id }, now);
            }
            EventKind::CcaSample { node_id } => {
                self.handle_cca_sample(node_id, now);
            }
            EventKind::TxEnd { .. } => {
                self.handle_csma_tx_end(now);
            }
            _ => {}
        }
    }

    /// Handle TDMA slot start: process all nodes and collect transmissions.
    fn handle_slot_start(&mut self, frame: u32, slot: u16, role: SlotRole, now: SimTime) {
        let num = self.nodes.len();
        let mut transmissions: Vec<(NodeId, Vec2, Packet)> = Vec::new();

        // Phase 1: each node's MAC decides what to transmit
        for i in 0..num {
            // Fix #6: include time in RNG stream name for independent draws per slot
            let mut rng = self.rng.stream(&format!("mac:{i}:{}", now.as_ns()));
            let actions = self.macs[i].on_slot_start(
                &mut self.nodes[i],
                frame,
                slot,
                role,
                now,
                &mut rng,
            );
            for action in actions {
                match action {
                    MacAction::Transmit { mut packet } => {
                        if packet.id == 0 {
                            packet.id = self.next_packet_id;
                            self.next_packet_id += 1;
                        }
                        // Fix #5: emit TxStart AFTER ID assignment
                        self.record_metric(MetricEvent::TxStart {
                            time: now,
                            node_id: self.nodes[i].id,
                            packet_id: packet.id,
                            kind: if packet.hop_count > 0 { "relay" } else { "data" },
                            hop_count: packet.hop_count,
                            payload_bits: packet.payload_bits,
                        });
                        transmissions.push((
                            self.nodes[i].id,
                            self.nodes[i].position,
                            packet,
                        ));
                    }
                    MacAction::Emit(metric) => {
                        self.record_metric(metric);
                    }
                    MacAction::ScheduleEvent {
                        delay,
                        priority,
                        kind,
                    } => {
                        self.engine.schedule(now + delay, priority, kind);
                    }
                    MacAction::TrackMediaFrame {
                        source_id,
                        dest_id,
                        media,
                        payload,
                    } => {
                        self.metrics
                            .record_media_frame(source_id, dest_id, media, payload, now);
                    }
                    MacAction::CancelAckTimeout { .. } => {}
                }
            }
        }

        if !transmissions.is_empty() {
            self.tdma_slot_transmissions.insert((frame, slot), transmissions);
        }
    }

    /// Handle TDMA slot end: deliver transmissions at the true slot-end event time.
    fn handle_slot_end(&mut self, frame: u32, slot: u16, now: SimTime) {
        if let Some(transmissions) = self.tdma_slot_transmissions.remove(&(frame, slot)) {
            self.deliver_transmissions(&transmissions, now);
        }
    }

    /// Compute reception for a set of transmissions and deliver to MAC layers.
    fn deliver_transmissions(
        &mut self,
        transmissions: &[(NodeId, Vec2, Packet)],
        now: SimTime,
    ) {
        if transmissions.is_empty() {
            return;
        }
        let num = self.nodes.len();
        for i in 0..num {
            let rx_id = self.nodes[i].id;
            let rx_pos = self.nodes[i].position;
            let signals = self
                .channel
                .compute_rx_signals(rx_id, rx_pos, transmissions, now);
            if !signals.is_empty() {
                // Fix #6: include time in RNG stream name
                let mut rng = self.rng.stream(&format!("rx:{i}:{}", now.as_ns()));
                let actions =
                    self.macs[i].on_rx_batch(&mut self.nodes[i], &signals, now, &mut rng);
                // Process without collecting CSMA tx (reception doesn't trigger new tx)
                for action in actions {
                    match action {
                        MacAction::Emit(metric) => {
                            self.record_metric(metric);
                        }
                        MacAction::ScheduleEvent {
                            delay,
                            priority,
                            kind,
                        } => {
                            self.engine.schedule(now + delay, priority, kind);
                        }
                        MacAction::TrackMediaFrame {
                            source_id,
                            dest_id,
                            media,
                            payload,
                        } => {
                            self.metrics
                                .record_media_frame(source_id, dest_id, media, payload, now);
                        }
                        MacAction::Transmit { mut packet } => {
                            // ACK transmissions from CSMA on_rx_batch
                            if packet.id == 0 {
                                packet.id = self.next_packet_id;
                                self.next_packet_id += 1;
                            }
                            self.csma_pending_tx.push((
                                self.nodes[i].id,
                                self.nodes[i].position,
                                packet,
                            ));
                        }
                        MacAction::CancelAckTimeout { node_id } => {
                            self.engine.cancel_matching(|k| {
                                matches!(k, EventKind::AckTimeout { node_id: n, .. } if *n == node_id)
                            });
                        }
                    }
                }
            }
        }
        // Deliver any ACK transmissions generated during reception
        if !self.csma_pending_tx.is_empty() {
            let pending: Vec<(NodeId, Vec2, Packet)> = self.csma_pending_tx.drain(..).collect();
            self.deliver_transmissions(&pending, now);
        }
    }

    /// Handle traffic generation event from configured traffic model.
    fn handle_traffic_generate(&mut self, node_id: NodeId, now: SimTime) {
        let idx = node_id as usize;
        if idx >= self.nodes.len() {
            return;
        }
        let mut rng = self.rng.stream(&format!("traffic:{node_id}:{}", now.as_ns()));
        if let Some(pkt) = self.traffic_gens[idx].generate(
            node_id,
            now,
            &mut self.next_packet_id,
            self.config.general.num_nodes,
            &mut rng,
        ) {
            let queue_before = self.macs[idx].queue_length();
            let source_id = pkt.source_id;
            let message_id = pkt.message_id;
            let frame_index = pkt.frame_index;
            let media_meta = pkt.media_meta();
            let priority = pkt.kind.default_priority();
            let dropped_packet_id = pkt.id;
            self.macs[idx].enqueue(pkt, priority);
            let queue_after = self.macs[idx].queue_length();
            if queue_after == queue_before {
                self.record_metric(MetricEvent::Drop {
                    time: now,
                    node_id,
                    packet_id: dropped_packet_id,
                    reason: "queue_full",
                });
                if let Some(media) = media_meta {
                    self.metrics.record_media_drop(
                        source_id,
                        media.stream_id,
                        media.media_kind,
                        Some(media.frame_index),
                        MediaDropReason::QueueFull,
                    );
                } else if let Some(message_id) = message_id {
                    self.metrics.record_voice_drop(
                        source_id,
                        message_id,
                        frame_index,
                        VoiceDropReason::QueueFull,
                    );
                }
            }

            if matches!(&self.config.mac, MacConfig::Csma(_)) {
                let busy = self.check_carrier_sense(node_id, now);
                let mut enqueue_rng = self.rng.stream(&format!("enqueue:{node_id}:{}", now.as_ns()));
                let enqueue_actions =
                    self.macs[idx].on_enqueue(&mut self.nodes[idx], now, busy, &mut enqueue_rng);
                self.process_csma_actions(idx, enqueue_actions, now);
                let mut rng = self.rng.stream(&format!("cca:{node_id}:{}", now.as_ns()));
                let actions =
                    self.macs[idx].on_cca_result(&mut self.nodes[idx], busy, now, &mut rng);
                self.process_csma_actions(idx, actions, now);
            }
        }
    }

    /// Handle a MAC timer expiration.
    fn handle_mac_timer(&mut self, node_id: NodeId, timer: TimerKind, now: SimTime) {
        let idx = node_id as usize;
        if idx >= self.nodes.len() {
            return;
        }
        let mut rng = self.rng.stream(&format!("timer:{node_id}:{}", now.as_ns()));
        let actions = self.macs[idx].on_timer(&mut self.nodes[idx], timer, now, &mut rng);
        self.process_csma_actions(idx, actions, now);
    }

    /// Handle CCA sample for a CSMA node.
    fn handle_cca_sample(&mut self, node_id: NodeId, now: SimTime) {
        let idx = node_id as usize;
        if idx >= self.nodes.len() {
            return;
        }
        let busy = self.check_carrier_sense(node_id, now);
        let mut rng = self.rng.stream(&format!("cca:{node_id}:{}", now.as_ns()));
        let actions = self.macs[idx].on_cca_result(&mut self.nodes[idx], busy, now, &mut rng);
        self.process_csma_actions(idx, actions, now);
    }

    fn check_carrier_sense(&mut self, node_id: NodeId, now: SimTime) -> bool {
        let idx = node_id as usize;
        if idx >= self.active_arrivals.len() || self.active_arrivals[idx].is_empty() {
            return false;
        }
        let rx_pos = self.nodes[idx].position;
        let tx_list: Vec<(NodeId, Vec2)> = self.active_arrivals[idx]
            .iter()
            .map(|arrival| (arrival.tx_node_id, arrival.tx_position))
            .collect();
        self.channel
            .carrier_sensed(node_id, rx_pos, &tx_list, self.cca_threshold_dbm, now)
    }

    fn store_csma_tx(&mut self, node_idx: usize, mut packet: Packet, now: SimTime) -> SimTime {
        if packet.id == 0 {
            packet.id = self.next_packet_id;
            self.next_packet_id += 1;
        }
        let node_id = self.nodes[node_idx].id;
        self.record_metric(MetricEvent::TxStart {
            time: now,
            node_id,
            packet_id: packet.id,
            kind: if packet.kind == crate::packet::PacketKind::Ack {
                "ack"
            } else {
                "data"
            },
            hop_count: packet.hop_count,
            payload_bits: packet.payload_bits,
        });
        let (preamble_us, tx_rate_bps) = match &self.config.mac {
            MacConfig::Csma(c) => (
                c.preamble_us,
                if packet.kind == crate::packet::PacketKind::Ack {
                    c.effective_control_rate_bps()
                } else {
                    c.data_rate_bps
                },
            ),
            _ => (20.0, 6e6),
        };
        let payload_us = (packet.payload_bits as f64 / tx_rate_bps) * 1e6;
        let tx_duration = SimTime::from_us(preamble_us + payload_us);
        self.engine.schedule(
            now + tx_duration,
            0,
            EventKind::TxEnd {
                node_id,
                packet_id: packet.id,
            },
        );
        let tx_end = now + tx_duration;
        let active_tx = ActiveTx {
            node_id,
            position: self.nodes[node_idx].position,
            packet: packet.clone(),
            end: tx_end,
        };
        self.active_transmissions.push(active_tx);
        for rx_idx in 0..self.nodes.len() {
            let rx_node = self.nodes[rx_idx].id;
            let rx_pos = self.nodes[rx_idx].position;
            let propagation_delay =
                SimTime::from_us(Channel::propagation_delay_us(self.nodes[node_idx].position, rx_pos));
            self.scheduled_arrivals[rx_idx].push(ReceiverArrival {
                tx_node_id: node_id,
                tx_position: self.nodes[node_idx].position,
                packet: packet.clone(),
                arrival_start: now + propagation_delay,
                arrival_end: tx_end + propagation_delay,
            });
            self.engine.schedule(
                now + propagation_delay,
                -4,
                EventKind::SignalArrivalStart {
                    rx_node,
                    tx_node: node_id,
                    packet_id: packet.id,
                },
            );
            self.engine.schedule(
                tx_end + propagation_delay,
                -4,
                EventKind::SignalArrivalEnd {
                    rx_node,
                    tx_node: node_id,
                    packet_id: packet.id,
                },
            );
        }
        tx_duration
    }

    fn csma_acquisition_window_us(&self) -> f64 {
        match &self.config.mac {
            MacConfig::Csma(cfg) => cfg.preamble_us.min(CSMA_CAPTURE_WINDOW_US),
            _ => CSMA_CAPTURE_WINDOW_US,
        }
    }

    fn find_arrival_index(
        arrivals: &[ReceiverArrival],
        tx_node_id: NodeId,
        packet_id: PacketId,
    ) -> Option<usize> {
        arrivals.iter().position(|arrival| {
            arrival.tx_node_id == tx_node_id && arrival.packet.id == packet_id
        })
    }

    fn ack_timeout_delay_for_tx(&self, tx: &ActiveTx) -> Option<SimTime> {
        let dest_id = tx.packet.dest_id?;
        let rx_idx = dest_id as usize;
        if rx_idx >= self.nodes.len() {
            return None;
        }
        let csma_cfg = match &self.config.mac {
            MacConfig::Csma(cfg) => cfg,
            _ => return None,
        };
        let propagation_us =
            Channel::propagation_delay_us(tx.position, self.nodes[rx_idx].position);
        let ack_airtime_us = csma_cfg.preamble_us
            + (csma_cfg.ack_bits as f64 / csma_cfg.effective_control_rate_bps()) * 1e6;
        Some(SimTime::from_us(
            propagation_us
                + csma_cfg.sifs_us
                + ack_airtime_us
                + propagation_us
                + csma_cfg.ack_timeout_us,
        ))
    }

    fn arrival_detection_midpoint_us(&self, arrival: &ReceiverArrival) -> f64 {
        let acquisition_window_us = (arrival.arrival_end - arrival.arrival_start)
            .as_us()
            .max(0.0)
            .min(self.csma_acquisition_window_us());
        arrival.arrival_start.as_us() + acquisition_window_us * 0.5
    }

    fn arrival_detection_power_w(
        &mut self,
        arrival: &ReceiverArrival,
        rx_pos: Vec2,
        rx_id: NodeId,
    ) -> f64 {
        let sample_time = SimTime::from_us(self.arrival_detection_midpoint_us(arrival));
        self.channel.received_power_w(
            arrival.tx_position,
            rx_pos,
            arrival.tx_node_id,
            rx_id,
            sample_time,
        )
    }

    fn arrival_is_detectable(
        &mut self,
        arrival: &ReceiverArrival,
        rx_pos: Vec2,
        rx_id: NodeId,
        threshold_w: f64,
    ) -> bool {
        self.arrival_detection_power_w(arrival, rx_pos, rx_id) >= threshold_w
    }

    fn summarize_csma_target_for_receiver(
        &mut self,
        rx_id: NodeId,
        rx_pos: Vec2,
        target: &ReceiverArrival,
        arrivals: &[&ReceiverArrival],
    ) -> Option<crate::phy::channel::RxSignal> {
        let target_start_us = target.arrival_start.as_us();
        let target_end_us = target.arrival_end.as_us();

        let mut overlapping: Vec<&ReceiverArrival> = arrivals
            .iter()
            .copied()
            .filter(|arrival| {
                arrival.arrival_start.as_us() < target_end_us
                    && target_start_us < arrival.arrival_end.as_us()
            })
            .collect();
        overlapping.retain(|arrival| {
            arrival.arrival_start.as_us() < target_end_us
                && target_start_us < arrival.arrival_end.as_us()
        });
        if overlapping.is_empty() {
            return None;
        }
        if overlapping.iter().any(|arrival| arrival.tx_node_id == rx_id) {
            return None;
        }

        let rx_sensitivity_w = match &self.config.mac {
            MacConfig::Csma(cfg) => crate::units::dbm_to_w(cfg.effective_rx_sensitivity_dbm()),
            _ => 0.0,
        };
        let detectable_arrivals: Vec<&ReceiverArrival> = overlapping
            .iter()
            .copied()
            .filter(|arrival| self.arrival_is_detectable(arrival, rx_pos, rx_id, rx_sensitivity_w))
            .collect();
        if detectable_arrivals.is_empty() {
            return None;
        }
        if !detectable_arrivals.iter().any(|arrival| {
            arrival.tx_node_id == target.tx_node_id && arrival.packet.id == target.packet.id
        }) {
            return None;
        }

        let earliest_start_us = detectable_arrivals
            .iter()
            .map(|arrival| arrival.arrival_start.as_us())
            .fold(f64::INFINITY, f64::min);
        let min_delay_us = overlapping
            .iter()
            .map(|arrival| Channel::propagation_delay_us(arrival.tx_position, rx_pos))
            .fold(f64::INFINITY, f64::min);
        let acquisition_window_us = (target_end_us - target_start_us)
            .max(0.0)
            .min(self.csma_acquisition_window_us());
        let acquisition_end_us = target_start_us + acquisition_window_us;

        let mut boundaries = vec![target_start_us, target_end_us];
        for arrival in &overlapping {
            let arrival_start_us = arrival.arrival_start.as_us();
            let arrival_end_us = arrival.arrival_end.as_us();
            if arrival_start_us > target_start_us && arrival_start_us < target_end_us {
                boundaries.push(arrival_start_us);
            }
            if arrival_end_us > target_start_us && arrival_end_us < target_end_us {
                boundaries.push(arrival_end_us);
            }
        }
        boundaries.sort_by(f64::total_cmp);
        boundaries.dedup_by(|a, b| (*a - *b).abs() < 1e-9);
        if boundaries.len() < 2 {
            return None;
        }

        let mut min_sinr_linear = f64::INFINITY;
        let mut preamble_sinr_linear = f64::INFINITY;
        let mut acquisition_other_plus_noise_w = self.channel.noise_floor_w();
        let acquisition_power_w = self.arrival_detection_power_w(target, rx_pos, rx_id);
        if acquisition_power_w < rx_sensitivity_w {
            return None;
        }

        for window in boundaries.windows(2) {
            let start_us = window[0];
            let end_us = window[1];
            if end_us <= start_us {
                continue;
            }
            let midpoint_us = (start_us + end_us) * 0.5;
            let sample_time = SimTime::from_us(midpoint_us);
            let mut total_power_w = 0.0;
            let mut target_power_w = 0.0;
            let mut target_present = false;
            for arrival in &overlapping {
                let arrival_start_us = arrival.arrival_start.as_us();
                let arrival_end_us = arrival.arrival_end.as_us();
                if midpoint_us < arrival_start_us || midpoint_us >= arrival_end_us {
                    continue;
                }
                let power_w = self.channel.received_power_w(
                    arrival.tx_position,
                    rx_pos,
                    arrival.tx_node_id,
                    rx_id,
                    sample_time,
                );
                total_power_w += power_w;
                if arrival.packet.id == target.packet.id && arrival.tx_node_id == target.tx_node_id {
                    target_present = true;
                    target_power_w = power_w;
                }
            }
            if !target_present {
                continue;
            }
            let other_plus_noise_w = (total_power_w - target_power_w).max(0.0) + self.channel.noise_floor_w();
            let sinr_linear = if other_plus_noise_w > 0.0 && target_power_w > 0.0 {
                target_power_w / other_plus_noise_w
            } else {
                0.0
            };
            min_sinr_linear = min_sinr_linear.min(sinr_linear);
            if acquisition_window_us == 0.0 || start_us < acquisition_end_us {
                preamble_sinr_linear = preamble_sinr_linear.min(sinr_linear);
                if midpoint_us >= target_start_us && midpoint_us <= acquisition_end_us {
                    acquisition_other_plus_noise_w = other_plus_noise_w;
                }
            }
        }

        if !min_sinr_linear.is_finite() {
            return None;
        }
        if !preamble_sinr_linear.is_finite() {
            preamble_sinr_linear = min_sinr_linear;
        }

        let overlap_packet_count = detectable_arrivals
            .iter()
            .map(|arrival| arrival.packet.id)
            .collect::<HashSet<_>>()
            .len() as u16;

        Some(crate::phy::channel::RxSignal {
            packet: target.packet.clone(),
            rx_power_w: acquisition_power_w,
            sinr_linear: min_sinr_linear,
            sinr_db: if min_sinr_linear > 0.0 {
                10.0 * min_sinr_linear.log10()
            } else {
                f64::NEG_INFINITY
            },
            preamble_sinr_db: if preamble_sinr_linear > 0.0 {
                10.0 * preamble_sinr_linear.log10()
            } else {
                f64::NEG_INFINITY
            },
            tx_node_id: target.tx_node_id,
            other_plus_noise_w: acquisition_other_plus_noise_w,
            toa_offset_us: Channel::propagation_delay_us(target.tx_position, rx_pos) - min_delay_us,
            start_offset_us: target_start_us - earliest_start_us,
            overlap_packet_count,
        })
    }

    fn prune_completed_arrival_history(&mut self, rx_idx: usize) {
        let Some(earliest_active_start) = self.active_arrivals[rx_idx]
            .iter()
            .map(|arrival| arrival.arrival_start)
            .min()
        else {
            self.completed_arrivals[rx_idx].clear();
            return;
        };
        self.completed_arrivals[rx_idx]
            .retain(|arrival| arrival.arrival_end > earliest_active_start);
    }

    /// Process CSMA MAC actions: store transmissions for deferred delivery.
    fn process_csma_actions(
        &mut self,
        sender_idx: usize,
        actions: crate::mac::MacActions,
        now: SimTime,
    ) {
        for action in actions {
            match action {
                MacAction::Transmit { packet } => {
                    self.store_csma_tx(sender_idx, packet, now);
                }
                MacAction::Emit(metric) => {
                    self.record_metric(metric);
                }
                MacAction::ScheduleEvent {
                    delay,
                    priority,
                    kind,
                } => {
                    self.engine.schedule(now + delay, priority, kind);
                }
                MacAction::TrackMediaFrame {
                    source_id,
                    dest_id,
                    media,
                    payload,
                } => {
                    self.metrics
                        .record_media_frame(source_id, dest_id, media, payload, now);
                }
                MacAction::CancelAckTimeout { node_id } => {
                    self.engine.cancel_matching(|k| {
                        matches!(k, EventKind::AckTimeout { node_id: n, .. } if *n == node_id)
                    });
                }
            }
        }
    }

    fn handle_signal_arrival_start(
        &mut self,
        rx_node: NodeId,
        tx_node: NodeId,
        packet_id: PacketId,
        now: SimTime,
    ) {
        let rx_idx = rx_node as usize;
        if rx_idx >= self.nodes.len() {
            return;
        }
        let Some(arrival_idx) = Self::find_arrival_index(&self.scheduled_arrivals[rx_idx], tx_node, packet_id)
        else {
            return;
        };
        let arrival = self.scheduled_arrivals[rx_idx].remove(arrival_idx);
        debug_assert_eq!(arrival.arrival_start, now);
        self.active_arrivals[rx_idx].push(arrival);
        self.engine.schedule(
            now,
            -2,
            EventKind::CarrierSenseUpdate { node_id: rx_node },
        );
    }

    fn handle_signal_arrival_end(
        &mut self,
        rx_node: NodeId,
        tx_node: NodeId,
        packet_id: PacketId,
        now: SimTime,
    ) {
        let rx_idx = rx_node as usize;
        if rx_idx >= self.nodes.len() {
            return;
        }
        let Some(arrival_idx) = Self::find_arrival_index(&self.active_arrivals[rx_idx], tx_node, packet_id)
        else {
            return;
        };
        let arrival = self.active_arrivals[rx_idx].remove(arrival_idx);
        debug_assert_eq!(arrival.arrival_end, now);
        self.pending_rx_targets[rx_idx].push(ArrivalKey {
            tx_node_id: tx_node,
            packet_id,
        });
        self.completed_arrivals[rx_idx].push(arrival);
        self.engine
            .schedule(now, -3, EventKind::RxBatch { rx_node });
        self.engine.schedule(
            now,
            -2,
            EventKind::CarrierSenseUpdate { node_id: rx_node },
        );
    }

    fn handle_medium_state_change(&mut self, node_id: NodeId, now: SimTime) {
        let idx = node_id as usize;
        if idx >= self.nodes.len() {
            return;
        }
        let busy = self.check_carrier_sense(node_id, now);
        let mut rng = self.rng.stream(&format!("medium:{node_id}:{}", now.as_ns()));
        let actions =
            self.macs[idx].on_medium_state_change(&mut self.nodes[idx], busy, now, &mut rng);
        self.process_csma_actions(idx, actions, now);
    }

    fn handle_csma_rx_batch(&mut self, rx_node: NodeId, now: SimTime) {
        let rx_idx = rx_node as usize;
        if rx_idx >= self.nodes.len() {
            return;
        }
        let completed_snapshot = self.completed_arrivals[rx_idx].clone();
        let mut pending = Vec::new();
        self.pending_rx_targets[rx_idx].retain(|key| {
            let is_ready = completed_snapshot.iter().any(|arrival| {
                arrival.tx_node_id == key.tx_node_id
                    && arrival.packet.id == key.packet_id
                    && arrival.arrival_end == now
            });
            if is_ready {
                pending.push(*key);
            }
            !is_ready
        });
        if pending.is_empty() {
            return;
        }

        let rx_id = self.nodes[rx_idx].id;
        let rx_pos = self.nodes[rx_idx].position;
        let completed_arrivals = self.completed_arrivals[rx_idx].clone();
        let active_arrivals = self.active_arrivals[rx_idx].clone();
        let overlap_pool: Vec<&ReceiverArrival> = completed_arrivals
            .iter()
            .chain(active_arrivals.iter())
            .collect();
        let mut signals = Vec::new();
        for key in pending {
            let Some(target) = completed_arrivals.iter().find(|arrival| {
                arrival.tx_node_id == key.tx_node_id && arrival.packet.id == key.packet_id
            }) else {
                continue;
            };
            if let Some(signal) =
                self.summarize_csma_target_for_receiver(rx_id, rx_pos, target, &overlap_pool)
            {
                signals.push(signal);
            }
        }
        if !signals.is_empty() {
            let mut rng = self.rng.stream(&format!("rx:{rx_idx}:{}", now.as_ns()));
            let actions =
                self.macs[rx_idx].on_rx_batch(&mut self.nodes[rx_idx], &signals, now, &mut rng);
            self.process_csma_actions(rx_idx, actions, now);
        }
        self.prune_completed_arrival_history(rx_idx);
    }

    fn handle_csma_tx_end(&mut self, now: SimTime) {
        let mut completing = Vec::new();
        let mut remaining = Vec::new();
        for atx in self.active_transmissions.drain(..) {
            if atx.end == now {
                completing.push(atx);
            } else {
                remaining.push(atx);
            }
        }
        self.active_transmissions = remaining;

        if completing.is_empty() {
            return;
        }

        for atx in &completing {
            let idx = atx.node_id as usize;
            if idx >= self.nodes.len() {
                continue;
            }
            let ack_timeout_delay = self.ack_timeout_delay_for_tx(atx);
            let mut rng = self
                .rng
                .stream(&format!("tx_complete:{}:{}", atx.node_id, now.as_ns()));
            let actions = self.macs[idx].on_timer(
                &mut self.nodes[idx],
                TimerKind::TxComplete {
                    packet_id: atx.packet.id,
                    ack_timeout_delay,
                },
                now,
                &mut rng,
            );
            self.process_csma_actions(idx, actions, now);
        }
    }

    fn record_metric(&mut self, metric: MetricEvent) {
        if let MetricEvent::Delivery {
            dest_id,
            latency,
            control_class,
            ..
        } = &metric
        {
            if self.overlay_enabled {
                if let Some(class) = *control_class {
                    let idx = *dest_id as usize;
                    if idx < self.interval_stats.len() {
                        *self.interval_stats[idx].deliveries.get_mut(class) += 1;
                        self.interval_stats[idx]
                            .latencies_ns
                            .get_mut(class)
                            .push(latency.as_ns());
                    }
                }
            }
        }
        self.metrics.record(metric);
    }
}

impl std::fmt::Debug for Simulation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Simulation")
            .field("nodes", &self.nodes.len())
            .field("events_processed", &self.engine.events_processed())
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{CsmaConfig, GeneralConfig, MacConfig, PathLossModel, PhyConfig, SimConfig, TrafficConfig};
    use crate::metrics::events::SimEvent;
    use crate::packet::PacketKind;

    fn test_csma_sim(num_nodes: u16) -> Simulation {
        let config = SimConfig {
            general: GeneralConfig {
                num_nodes,
                area_size_m: 100.0,
                sim_duration_s: 0.01,
                seed: 7,
            },
            phy: PhyConfig {
                path_loss_model: PathLossModel::FreeSpace,
                shadowing_std_db: 0.0,
                enable_fading: false,
                ..PhyConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig {
                source_probability: 0.0,
                broadcast_probability: 1.0,
                ..CsmaConfig::default()
            }),
            traffic: TrafficConfig::default(),
            ..SimConfig::default()
        };
        Simulation::new(config).expect("valid CSMA test config")
    }

    fn make_csma_packet(id: PacketId, source_id: NodeId, dest_id: Option<NodeId>) -> Packet {
        Packet {
            id,
            source_id,
            dest_id,
            kind: PacketKind::Data,
            creation_time: SimTime::ZERO,
            payload_bits: 1024,
            payload: None,
            media: None,
            message_id: None,
            frame_index: None,
            hop_count: 0,
            max_hops: 1,
            delivered: false,
            region_id: None,
        }
    }

    fn completed_arrival(
        tx_node_id: NodeId,
        tx_position: Vec2,
        packet: Packet,
        arrival_start_us: f64,
        arrival_end_us: f64,
    ) -> ReceiverArrival {
        ReceiverArrival {
            tx_node_id,
            tx_position,
            packet,
            arrival_start: SimTime::from_us(arrival_start_us),
            arrival_end: SimTime::from_us(arrival_end_us),
        }
    }

    #[test]
    fn tdma_slot_scheduling_skips_partial_final_slot() {
        let mut engine = DesEngine::new();
        let cfg = TdmaConfig {
            slot_duration_ms: 1.0,
            slot_roles: vec![SlotRole::DLC],
            ..TdmaConfig::default()
        };
        Simulation::schedule_tdma_slots(&mut engine, &cfg, 0.0015);

        let mut starts = 0usize;
        let mut ends = 0usize;
        while let Some(event) = engine.next_event() {
            match event.kind {
                EventKind::SlotStart { .. } => {
                    starts += 1;
                    assert!(event.time < SimTime::from_s(0.0015));
                }
                EventKind::SlotEnd { .. } => {
                    ends += 1;
                    assert!(event.time <= SimTime::from_s(0.0015));
                }
                _ => {}
            }
        }
        assert_eq!(starts, 1, "one full slot should be scheduled");
        assert_eq!(ends, 1, "one full slot end should be scheduled");
    }

    #[test]
    fn csma_partial_overlap_history_causes_collision() {
        let mut sim = test_csma_sim(3);
        sim.nodes[0].position = Vec2::new(5.0, 0.0);
        sim.nodes[1].position = Vec2::new(5.0, 0.0);
        sim.nodes[2].position = Vec2::new(0.0, 0.0);

        sim.completed_arrivals[2].push(completed_arrival(
            1,
            sim.nodes[1].position,
            make_csma_packet(11, 1, None),
            20.0,
            80.0,
        ));
        sim.completed_arrivals[2].push(completed_arrival(
            0,
            sim.nodes[0].position,
            make_csma_packet(10, 0, None),
            0.0,
            160.0,
        ));
        sim.pending_rx_targets[2].push(ArrivalKey {
            tx_node_id: 0,
            packet_id: 10,
        });
        sim.handle_csma_rx_batch(2, SimTime::from_us(160.0));

        assert!(
            !sim.metrics.events().iter().any(|event| {
                matches!(
                    event,
                    SimEvent::Rx {
                        node_id,
                        packet_id,
                        ..
                    } if *node_id == 2 && *packet_id == 10
                )
            }),
            "receiver should not decode a frame corrupted by an earlier overlapping interferer",
        );
        assert!(
            sim.metrics.events().iter().any(|event| {
                matches!(event, SimEvent::Collision { node_id, .. } if *node_id == 2)
            }),
            "receiver should emit a collision when overlap history corrupts the frame",
        );
    }

    #[test]
    fn csma_in_window_late_stronger_packet_captures() {
        let mut sim = test_csma_sim(3);
        sim.nodes[0].position = Vec2::new(40.0, 0.0);
        sim.nodes[1].position = Vec2::new(1.0, 0.0);
        sim.nodes[2].position = Vec2::new(0.0, 0.0);

        sim.completed_arrivals[2].push(completed_arrival(
            0,
            sim.nodes[0].position,
            make_csma_packet(20, 0, None),
            0.0,
            160.0,
        ));
        sim.completed_arrivals[2].push(completed_arrival(
            1,
            sim.nodes[1].position,
            make_csma_packet(21, 1, None),
            10.0,
            160.0,
        ));
        sim.pending_rx_targets[2].push(ArrivalKey {
            tx_node_id: 0,
            packet_id: 20,
        });
        sim.pending_rx_targets[2].push(ArrivalKey {
            tx_node_id: 1,
            packet_id: 21,
        });
        sim.handle_csma_rx_batch(2, SimTime::from_us(160.0));

        assert!(
            sim.metrics.events().iter().any(|event| {
                matches!(
                    event,
                    SimEvent::Rx {
                        node_id,
                        packet_id,
                        ..
                    } if *node_id == 2 && *packet_id == 21
                )
            }),
            "stronger packet starting inside the capture window should win reception",
        );
        assert!(
            !sim.metrics.events().iter().any(|event| {
                matches!(event, SimEvent::Collision { node_id, .. } if *node_id == 2)
            }),
            "successful capture should not emit a receiver collision",
        );
    }

    #[test]
    fn csma_late_interferer_after_capture_window_causes_failure_without_capture() {
        let mut sim = test_csma_sim(3);
        sim.nodes[0].position = Vec2::new(20.0, 0.0);
        sim.nodes[1].position = Vec2::new(1.0, 0.0);
        sim.nodes[2].position = Vec2::new(0.0, 0.0);

        sim.completed_arrivals[2].push(completed_arrival(
            0,
            sim.nodes[0].position,
            make_csma_packet(30, 0, None),
            0.0,
            160.0,
        ));
        sim.completed_arrivals[2].push(completed_arrival(
            1,
            sim.nodes[1].position,
            make_csma_packet(31, 1, None),
            30.0,
            160.0,
        ));
        sim.pending_rx_targets[2].push(ArrivalKey {
            tx_node_id: 0,
            packet_id: 30,
        });
        sim.pending_rx_targets[2].push(ArrivalKey {
            tx_node_id: 1,
            packet_id: 31,
        });
        sim.handle_csma_rx_batch(2, SimTime::from_us(160.0));

        assert!(
            !sim.metrics.events().iter().any(|event| {
                matches!(
                    event,
                    SimEvent::Rx {
                        node_id,
                        packet_id,
                        ..
                    } if *node_id == 2 && (*packet_id == 30 || *packet_id == 31)
                )
            }),
            "a late interferer after the capture window should prevent decode rather than steal it",
        );
        assert!(
            sim.metrics.events().iter().any(|event| {
                matches!(event, SimEvent::Collision { node_id, .. } if *node_id == 2)
            }),
            "receiver should record a collision when a late interferer destroys the locked frame",
        );
    }

    #[test]
    fn csma_half_duplex_blocks_decode_for_any_overlap() {
        let mut sim = test_csma_sim(3);
        sim.nodes[0].position = Vec2::new(5.0, 0.0);
        sim.nodes[1].position = Vec2::new(50.0, 0.0);
        sim.nodes[2].position = Vec2::new(0.0, 0.0);

        sim.completed_arrivals[2].push(completed_arrival(
            2,
            sim.nodes[2].position,
            make_csma_packet(41, 2, None),
            40.0,
            120.0,
        ));
        sim.completed_arrivals[2].push(completed_arrival(
            0,
            sim.nodes[0].position,
            make_csma_packet(40, 0, None),
            0.0,
            160.0,
        ));
        sim.pending_rx_targets[2].push(ArrivalKey {
            tx_node_id: 0,
            packet_id: 40,
        });
        sim.handle_csma_rx_batch(2, SimTime::from_us(160.0));

        assert!(
            !sim.metrics.events().iter().any(|event| {
                matches!(
                    event,
                    SimEvent::Rx {
                        node_id,
                        packet_id,
                        ..
                    } if *node_id == 2 && *packet_id == 40
                )
            }),
            "receiver must not decode a frame that overlapped any part of its own transmit interval",
        );
    }

    #[test]
    fn csma_sub_sensitivity_target_is_ignored() {
        let config = SimConfig {
            general: GeneralConfig {
                num_nodes: 2,
                area_size_m: 100.0,
                sim_duration_s: 0.01,
                seed: 23,
            },
            phy: PhyConfig {
                path_loss_model: PathLossModel::FreeSpace,
                shadowing_std_db: 0.0,
                enable_fading: false,
                ..PhyConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig {
                source_probability: 0.0,
                broadcast_probability: 1.0,
                rx_sensitivity_dbm: Some(40.0),
                ..CsmaConfig::default()
            }),
            traffic: TrafficConfig::default(),
            ..SimConfig::default()
        };
        let mut sim = Simulation::new(config).expect("valid detect-gate config");
        sim.nodes[0].position = Vec2::new(1.0, 0.0);
        sim.nodes[1].position = Vec2::new(0.0, 0.0);

        sim.completed_arrivals[1].push(completed_arrival(
            0,
            sim.nodes[0].position,
            make_csma_packet(60, 0, None),
            0.0,
            160.0,
        ));
        sim.pending_rx_targets[1].push(ArrivalKey {
            tx_node_id: 0,
            packet_id: 60,
        });
        sim.handle_csma_rx_batch(1, SimTime::from_us(160.0));

        assert!(
            !sim.metrics.events().iter().any(|event| {
                matches!(
                    event,
                    SimEvent::Rx {
                        node_id,
                        packet_id,
                        ..
                    } if *node_id == 1 && *packet_id == 60
                )
            }),
            "a sub-sensitivity arrival should not be surfaced as a receive candidate",
        );
        assert!(
            !sim.metrics.events().iter().any(|event| {
                matches!(event, SimEvent::Collision { node_id, .. } if *node_id == 1)
            }),
            "ignoring an undetectable arrival should not create a collision",
        );
    }

    #[test]
    fn csma_undetectable_overlap_does_not_force_collision() {
        let config = SimConfig {
            general: GeneralConfig {
                num_nodes: 3,
                area_size_m: 2_000.0,
                sim_duration_s: 0.01,
                seed: 24,
            },
            phy: PhyConfig {
                path_loss_model: PathLossModel::FreeSpace,
                shadowing_std_db: 0.0,
                enable_fading: false,
                ..PhyConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig {
                source_probability: 0.0,
                broadcast_probability: 1.0,
                rx_sensitivity_dbm: Some(-50.0),
                ..CsmaConfig::default()
            }),
            traffic: TrafficConfig::default(),
            ..SimConfig::default()
        };
        let mut sim = Simulation::new(config).expect("valid overlap detect-gate config");
        sim.nodes[0].position = Vec2::new(1.0, 0.0);
        sim.nodes[1].position = Vec2::new(1_000.0, 0.0);
        sim.nodes[2].position = Vec2::new(0.0, 0.0);

        sim.completed_arrivals[2].push(completed_arrival(
            0,
            sim.nodes[0].position,
            make_csma_packet(61, 0, None),
            0.0,
            160.0,
        ));
        sim.completed_arrivals[2].push(completed_arrival(
            1,
            sim.nodes[1].position,
            make_csma_packet(62, 1, None),
            0.0,
            160.0,
        ));
        sim.pending_rx_targets[2].push(ArrivalKey {
            tx_node_id: 0,
            packet_id: 61,
        });
        sim.pending_rx_targets[2].push(ArrivalKey {
            tx_node_id: 1,
            packet_id: 62,
        });
        sim.handle_csma_rx_batch(2, SimTime::from_us(160.0));

        assert!(
            sim.metrics.events().iter().any(|event| {
                matches!(
                    event,
                    SimEvent::Rx {
                        node_id,
                        packet_id,
                        ..
                    } if *node_id == 2 && *packet_id == 61
                )
            }),
            "the detectable target should still decode when only an undetectable overlap is present",
        );
        assert!(
            !sim.metrics.events().iter().any(|event| {
                matches!(event, SimEvent::Collision { node_id, .. } if *node_id == 2)
            }),
            "an undetectable overlap must not manufacture a receiver collision",
        );
    }

    #[test]
    fn csma_ack_timeout_uses_control_rate_and_data_airtime_separately() {
        let mut cfg = CsmaConfig::default();
        cfg.source_probability = 0.0;
        cfg.broadcast_probability = 0.0;
        cfg.slot_duration_us = 1.0;
        cfg.sifs_us = 10.0;
        cfg.ack_timeout_us = 0.0;
        cfg.preamble_us = 50.0;
        cfg.ack_bits = 4000;
        cfg.data_rate_bps = 2e6;
        cfg.control_rate_bps = Some(0.5e6);
        cfg.edca.be.aifsn = 1;
        cfg.edca.be.cw_min_exp = 1;
        cfg.edca.be.cw_max_exp = 1;

        let config = SimConfig {
            general: GeneralConfig {
                num_nodes: 2,
                area_size_m: 20_000.0,
                sim_duration_s: 0.02,
                seed: 19,
            },
            phy: PhyConfig {
                tx_power_w: 5.0,
                path_loss_model: PathLossModel::FreeSpace,
                shadowing_std_db: 0.0,
                enable_fading: false,
                ..PhyConfig::default()
            },
            mac: MacConfig::Csma(cfg.clone()),
            traffic: TrafficConfig::default(),
            ..SimConfig::default()
        };
        let mut sim = Simulation::new(config).expect("valid propagation timing config");
        sim.nodes[0].position = Vec2::new(0.0, 0.0);
        sim.nodes[1].position = Vec2::new(8_000.0, 0.0);

        let packet = make_csma_packet(70, 0, Some(1));
        sim.macs[0].enqueue(packet.clone(), packet.kind.default_priority());
        let mut rng = sim.rng.stream("ack_margin");
        let actions = sim.macs[0].on_cca_result(&mut sim.nodes[0], false, SimTime::ZERO, &mut rng);
        sim.process_csma_actions(0, actions, SimTime::ZERO);
        sim.run();

        let propagation_us = Channel::propagation_delay_us(sim.nodes[0].position, sim.nodes[1].position);
        let ack_airtime_us =
            cfg.preamble_us + (cfg.ack_bits as f64 / cfg.effective_control_rate_bps()) * 1e6;
        let derived_timeout_us = propagation_us + cfg.sifs_us + ack_airtime_us + propagation_us;
        assert!(
            derived_timeout_us > 100.0,
            "test requires a derived ACK wait beyond the legacy fixed 100 us timeout",
        );
        assert!(
            sim.metrics.events().iter().any(|event| {
                matches!(
                    event,
                    SimEvent::TxEnd {
                        node_id,
                        packet_id,
                        success,
                        ..
                    } if *node_id == 0 && *packet_id == 70 && *success
                )
            }),
            "sender should still complete successfully when ACK arrives after the legacy fixed timeout",
        );
        assert_eq!(
            sim.macs[0].snapshot_mac_counters().ack_timeouts.be,
            0,
            "derived timeout should prevent a spurious ACK timeout",
        );
        let data_tx_start_ns = sim
            .metrics
            .events()
            .iter()
            .find_map(|event| match event {
                SimEvent::TxStart {
                    time_ns,
                    node_id,
                    packet_id,
                    kind,
                    ..
                } if *node_id == 0 && *packet_id == 70 && *kind == "data" => Some(*time_ns),
                _ => None,
            })
            .expect("data transmission should have started");
        let expected_ack_start_ns = data_tx_start_ns
            + SimTime::from_us(
                cfg.preamble_us
                    + (packet.payload_bits as f64 / cfg.data_rate_bps) * 1e6
                    + propagation_us
                    + cfg.sifs_us,
            )
            .as_ns();
        assert!(
            sim.metrics.events().iter().any(|event| {
                matches!(
                    event,
                    SimEvent::TxStart {
                        time_ns,
                        node_id,
                        kind,
                        ..
                    } if *node_id == 1 && *kind == "ack" && *time_ns == expected_ack_start_ns
                )
            }),
            "ACK start should still be driven by data airtime plus propagation, not control airtime",
        );
    }

    #[test]
    fn csma_carrier_sense_tracks_receiver_local_arrival_window() {
        let mut sim = test_csma_sim(2);
        sim.nodes[0].position = Vec2::new(0.0, 0.0);
        sim.nodes[1].position = Vec2::new(2_997.92458, 0.0);

        let packet = make_csma_packet(80, 0, None);
        let tx_duration = sim.store_csma_tx(0, packet.clone(), SimTime::ZERO);
        let propagation_delay =
            SimTime::from_us(Channel::propagation_delay_us(sim.nodes[0].position, sim.nodes[1].position));
        let arrival_end = propagation_delay + tx_duration;

        assert!(
            !sim.check_carrier_sense(1, SimTime::ZERO),
            "receiver should remain idle before the signal reaches it",
        );
        sim.handle_signal_arrival_start(1, 0, packet.id, propagation_delay);
        assert!(
            sim.check_carrier_sense(1, propagation_delay),
            "receiver should become busy when the first bit arrives locally",
        );
        sim.handle_signal_arrival_end(1, 0, packet.id, arrival_end);
        assert!(
            !sim.check_carrier_sense(1, arrival_end),
            "receiver should return idle when the last bit arrives locally",
        );
    }
}
