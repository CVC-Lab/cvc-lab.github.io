use std::collections::VecDeque;

use hashbrown::{HashMap, HashSet};

use crate::config::{CsmaAccessCategoryConfig, CsmaConfig};
use crate::control::{
    AccessCategory, AccessCategoryRuntimeSnapshot, AccessCategoryValues, ActionOutcomeCounters,
    LocalAction, MacControlCounters,
};
use crate::des::{EventKind, NodeId, PacketId, SimTime, SlotRole};
use crate::mac::traits::{Mac, MacAction, MacActions, MetricEvent, TimerKind};
use crate::node::Node;
use crate::packet::{Packet, PacketKind};
use crate::phy::channel::RxSignal;
use crate::rng::RngStream;

use super::backoff::BinaryBackoff;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CsmaState {
    Idle,
    WaitAifs,
    Backoff,
    TxData,
    WaitAck,
    WaitAckResponseSifs,
    WaitTxopSifs,
    TxAck,
}

#[derive(Debug, Clone)]
struct QueueEntry {
    packet: Packet,
    retry_count: u8,
}

#[derive(Debug)]
struct EdcafState {
    queue: VecDeque<QueueEntry>,
    backoff: BinaryBackoff,
    eligibility_time: SimTime,
    access_armed: bool,
    internal_collisions: u64,
    txop_grants: u64,
    txop_uses: u64,
}

impl EdcafState {
    fn new(params: &CsmaAccessCategoryConfig) -> Self {
        EdcafState {
            queue: VecDeque::new(),
            backoff: BinaryBackoff::new(params.cw_min_exp, params.cw_max_exp, 6),
            eligibility_time: SimTime::ZERO,
            access_armed: false,
            internal_collisions: 0,
            txop_grants: 0,
            txop_uses: 0,
        }
    }

    fn head(&self) -> Option<&QueueEntry> {
        self.queue.front()
    }

    fn has_pending(&self) -> bool {
        !self.queue.is_empty()
    }
}

#[derive(Debug, Clone)]
struct TxContext {
    entry: QueueEntry,
    ac: AccessCategory,
}

#[derive(Debug, Clone, Copy)]
struct TxopContext {
    ac: AccessCategory,
    deadline: SimTime,
}

#[derive(Debug)]
pub struct CsmaMac {
    config: CsmaConfig,
    state: CsmaState,
    edca_params: AccessCategoryValues<CsmaAccessCategoryConfig>,
    edcafs: AccessCategoryValues<EdcafState>,
    tx_context: Option<TxContext>,
    txop_context: Option<TxopContext>,
    ack_timeout_deadline: Option<SimTime>,
    ack_pending: Option<(NodeId, PacketId)>,
    resume_wait_ack_after_txack: bool,
    channel_busy: bool,
    access_not_before: SimTime,
    next_access_check: SimTime,
    active_action: LocalAction,
    max_queue: usize,
    delivered_packets: HashSet<PacketId>,
    data_sent: u64,
    data_received: u64,
    acks_sent: u64,
    acks_received: u64,
    retransmissions: u64,
    packets_dropped: u64,
    tx_attempts_by_ac: AccessCategoryValues<u64>,
    tx_success_by_ac: AccessCategoryValues<u64>,
    retries_by_ac: AccessCategoryValues<u64>,
    ack_timeouts_by_ac: AccessCategoryValues<u64>,
    drops_by_ac: AccessCategoryValues<u64>,
    internal_collisions_by_ac: AccessCategoryValues<u64>,
    txop_grants_by_ac: AccessCategoryValues<u64>,
    txop_uses_by_ac: AccessCategoryValues<u64>,
    collisions_seen: u64,
    cca_busy_samples: u64,
    cca_total_samples: u64,
    backoff_counter_sum: u64,
    backoff_sample_count: u64,
    // ---- Axis 3: admission-control state (per-AC overrides) ----
    /// Per-AC runtime queue cap that overrides the global `max_queue` when set.
    max_queue_len_override: AccessCategoryValues<Option<u16>>,
    /// Per-AC token-bucket emit-rate ceiling (packets per second).
    rate_cap_pps: AccessCategoryValues<Option<f32>>,
    /// Token bucket state per AC. Only meaningful when `rate_cap_pps` is `Some`.
    rate_cap_tokens: AccessCategoryValues<f64>,
    rate_cap_last_refill: AccessCategoryValues<SimTime>,
    // ---- Axis 4: stream-level state ----
    /// Streams whose new arrivals are silently dropped at admission.
    paused_streams: HashSet<u32>,
    /// Stream-id -> target AC override; takes precedence over packet-kind classifier.
    stream_ac_overrides: HashMap<u32, AccessCategory>,
    // ---- Action-outcome counters (cumulative; runner takes interval deltas) ----
    purged_oldest_by_ac: AccessCategoryValues<u32>,
    purged_older_than_by_ac: AccessCategoryValues<u32>,
    admission_drops_by_ac: AccessCategoryValues<u32>,
    rate_cap_drops_by_ac: AccessCategoryValues<u32>,
    stream_paused_drops: u32,
    stream_flush_drops: u32,
    stream_reclassifications: u32,
}

impl CsmaMac {
    pub fn new(config: CsmaConfig) -> Self {
        let max_queue = config.node_queue_size as usize;
        let edca_params = config.edca.clone();
        CsmaMac {
            config,
            state: CsmaState::Idle,
            edcafs: AccessCategoryValues::new(
                EdcafState::new(&edca_params.vo),
                EdcafState::new(&edca_params.vi),
                EdcafState::new(&edca_params.be),
                EdcafState::new(&edca_params.bk),
            ),
            edca_params,
            tx_context: None,
            txop_context: None,
            ack_timeout_deadline: None,
            ack_pending: None,
            resume_wait_ack_after_txack: false,
            channel_busy: false,
            access_not_before: SimTime::ZERO,
            next_access_check: SimTime::ZERO,
            active_action: LocalAction::default(),
            max_queue,
            delivered_packets: HashSet::new(),
            data_sent: 0,
            data_received: 0,
            acks_sent: 0,
            acks_received: 0,
            retransmissions: 0,
            packets_dropped: 0,
            tx_attempts_by_ac: AccessCategoryValues::default(),
            tx_success_by_ac: AccessCategoryValues::default(),
            retries_by_ac: AccessCategoryValues::default(),
            ack_timeouts_by_ac: AccessCategoryValues::default(),
            drops_by_ac: AccessCategoryValues::default(),
            internal_collisions_by_ac: AccessCategoryValues::default(),
            txop_grants_by_ac: AccessCategoryValues::default(),
            txop_uses_by_ac: AccessCategoryValues::default(),
            collisions_seen: 0,
            cca_busy_samples: 0,
            cca_total_samples: 0,
            backoff_counter_sum: 0,
            backoff_sample_count: 0,
            max_queue_len_override: AccessCategoryValues::new(None, None, None, None),
            rate_cap_pps: AccessCategoryValues::new(None, None, None, None),
            rate_cap_tokens: AccessCategoryValues::default(),
            rate_cap_last_refill: AccessCategoryValues::new(
                SimTime::ZERO,
                SimTime::ZERO,
                SimTime::ZERO,
                SimTime::ZERO,
            ),
            paused_streams: HashSet::new(),
            stream_ac_overrides: HashMap::new(),
            purged_oldest_by_ac: AccessCategoryValues::default(),
            purged_older_than_by_ac: AccessCategoryValues::default(),
            admission_drops_by_ac: AccessCategoryValues::default(),
            rate_cap_drops_by_ac: AccessCategoryValues::default(),
            stream_paused_drops: 0,
            stream_flush_drops: 0,
            stream_reclassifications: 0,
        }
    }

    fn classify(packet: &Packet) -> AccessCategory {
        AccessCategory::from_packet_kind(packet.kind).unwrap_or(AccessCategory::Be)
    }

    /// Try to consume one token from the per-AC rate-cap bucket. Returns
    /// `true` when the enqueue is allowed (no cap, or token available).
    /// Updates the bucket state in place. Bucket capacity is `rate * 1.0 s`.
    fn consume_rate_cap_token(&mut self, ac: AccessCategory, now: SimTime) -> bool {
        let Some(rate) = self.rate_cap_pps[ac] else {
            return true;
        };
        let rate = rate as f64;
        if !rate.is_finite() || rate <= 0.0 {
            // Zero or non-finite rate means "block everything".
            return false;
        }
        let cap = rate; // 1 second of burst capacity.
        let last = self.rate_cap_last_refill[ac];
        let elapsed_s = now.as_s().max(last.as_s()) - last.as_s();
        let new_tokens = (self.rate_cap_tokens[ac] + elapsed_s * rate).min(cap);
        self.rate_cap_last_refill[ac] = now;
        if new_tokens >= 1.0 {
            self.rate_cap_tokens[ac] = new_tokens - 1.0;
            true
        } else {
            self.rate_cap_tokens[ac] = new_tokens;
            false
        }
    }

    fn total_queue_len(&self) -> usize {
        self.edcafs.vo.queue.len()
            + self.edcafs.vi.queue.len()
            + self.edcafs.be.queue.len()
            + self.edcafs.bk.queue.len()
    }

    fn packet_airtime_us(&self, packet: &Packet) -> f64 {
        self.config.preamble_us + (packet.payload_bits as f64 / self.config.data_rate_bps) * 1e6
    }

    fn effective_params(&self, ac: AccessCategory) -> CsmaAccessCategoryConfig {
        let base = &self.config.edca[ac];
        let aifsn = (base.aifsn as i16 + self.active_action.aifsn_delta[ac] as i16).clamp(1, 15);
        let cw_min_exp =
            (base.cw_min_exp as i16 + self.active_action.cw_min_exp_delta[ac] as i16).clamp(1, 12);
        let cw_max_exp =
            (base.cw_max_exp as i16 + self.active_action.cw_max_exp_delta[ac] as i16).clamp(1, 12);
        let cw_min_exp = cw_min_exp as u8;
        let cw_max_exp = cw_max_exp.max(cw_min_exp as i16) as u8;
        let txop_limit_us =
            (base.txop_limit_us + self.active_action.txop_limit_us_delta[ac] as f64).max(0.0);
        CsmaAccessCategoryConfig {
            aifsn: aifsn as u8,
            cw_min_exp,
            cw_max_exp,
            txop_limit_us,
        }
    }

    fn effective_aifs_us(&self, ac: AccessCategory) -> f64 {
        self.config.sifs_us + self.edca_params[ac].aifsn as f64 * self.config.slot_duration_us
    }

    fn aifs_duration(&self, ac: AccessCategory) -> SimTime {
        SimTime::from_us(self.effective_aifs_us(ac))
    }

    fn ack_airtime_us(&self) -> f64 {
        self.config.preamble_us
            + (self.config.ack_bits as f64 / self.config.effective_control_rate_bps()) * 1e6
    }

    fn capture_window_us(&self) -> f64 {
        self.config.preamble_us.min(16.0)
    }

    fn txop_exchange_time(&self, packet: &Packet) -> SimTime {
        let mut exchange_us = self.packet_airtime_us(packet) + self.config.sifs_us;
        if packet.dest_id.is_some() {
            exchange_us += self.ack_airtime_us();
        }
        SimTime::from_us(exchange_us)
    }

    fn eligibility_after_defer(&self, ac: AccessCategory, now: SimTime) -> SimTime {
        std::cmp::max(now + self.aifs_duration(ac), self.access_not_before)
    }

    fn edcaf(&self, ac: AccessCategory) -> &EdcafState {
        self.edcafs.get(ac)
    }

    fn edcaf_mut(&mut self, ac: AccessCategory) -> &mut EdcafState {
        self.edcafs.get_mut(ac)
    }

    fn schedule_eifs(&mut self, now: SimTime) -> SimTime {
        let deadline = now + SimTime::from_us(self.config.eifs_us());
        if deadline > self.access_not_before {
            self.access_not_before = deadline;
        }
        if deadline > self.next_access_check {
            self.next_access_check = deadline;
        }
        deadline
    }

    fn recompute_queue_eligibility(&mut self, now: SimTime) {
        for ac in AccessCategory::ALL {
            if self.edcaf(ac).has_pending() {
                self.edcaf_mut(ac).eligibility_time = self.eligibility_after_defer(ac, now);
            }
        }
    }

    fn earliest_eligibility(&self) -> Option<SimTime> {
        AccessCategory::ALL
            .into_iter()
            .filter_map(|ac| {
                let edcaf = self.edcaf(ac);
                edcaf.has_pending().then_some(edcaf.eligibility_time)
            })
            .min()
    }

    fn schedule_access_check(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        actions: &mut MacActions,
    ) {
        if self.tx_context.is_some()
            || matches!(
                self.state,
                CsmaState::WaitAck
                    | CsmaState::WaitAckResponseSifs
                    | CsmaState::WaitTxopSifs
                    | CsmaState::TxAck
                    | CsmaState::TxData
            )
        {
            return;
        }
        if self.channel_busy {
            return;
        }
        if let Some(next_time) = self.earliest_eligibility() {
            self.state = CsmaState::WaitAifs;
            let next_time = std::cmp::max(next_time, self.access_not_before);
            self.next_access_check = next_time;
            let delay = if next_time > now {
                next_time - now
            } else {
                SimTime::ZERO
            };
            actions.push(MacAction::ScheduleEvent {
                delay,
                priority: 0,
                kind: EventKind::DifsExpired { node_id },
            });
        } else {
            self.state = CsmaState::Idle;
        }
    }

    fn update_channel_state(
        &mut self,
        node_id: NodeId,
        channel_busy: bool,
        now: SimTime,
        count_sample: bool,
        allow_idle_restart: bool,
    ) -> MacActions {
        let mut actions = MacActions::new();
        let was_busy = self.channel_busy;
        self.channel_busy = channel_busy;
        if count_sample {
            self.cca_total_samples += 1;
            if channel_busy {
                self.cca_busy_samples += 1;
            }
        }

        if channel_busy {
            if !was_busy && self.state == CsmaState::Backoff {
                for ac in self.eligible_acs(now) {
                    self.edcaf_mut(ac).backoff.freeze();
                }
            }
            return actions;
        }

        if was_busy {
            for ac in AccessCategory::ALL {
                if self.edcaf(ac).has_pending() && self.edcaf(ac).access_armed {
                    self.edcaf_mut(ac).backoff.resume();
                }
            }
            self.recompute_queue_eligibility(now);
        } else if allow_idle_restart && self.state == CsmaState::Idle && self.total_queue_len() > 0 {
            self.recompute_queue_eligibility(now);
        } else {
            return actions;
        }

        if matches!(self.state, CsmaState::Idle | CsmaState::WaitAifs | CsmaState::Backoff)
            && self.total_queue_len() > 0
        {
            self.schedule_access_check(node_id, now, &mut actions);
        }

        actions
    }

    fn eligible_acs(&self, now: SimTime) -> Vec<AccessCategory> {
        AccessCategory::ALL
            .into_iter()
            .filter(|ac| {
                let edcaf = self.edcaf(*ac);
                edcaf.has_pending() && now >= edcaf.eligibility_time
            })
            .collect()
    }

    fn prepare_eligible_edcafs(&mut self, now: SimTime, rng: &mut RngStream) {
        for ac in self.eligible_acs(now) {
            let params = self.edca_params[ac].clone();
            let edcaf = self.edcaf_mut(ac);
            if !edcaf.access_armed {
                edcaf.backoff.reconfigure(params.cw_min_exp, params.cw_max_exp);
                edcaf.backoff.reset(rng);
                edcaf.access_armed = true;
            }
        }
    }

    fn contend_now(&self, now: SimTime) -> Vec<AccessCategory> {
        AccessCategory::ALL
            .into_iter()
            .filter(|ac| {
                let edcaf = self.edcaf(*ac);
                edcaf.has_pending()
                    && now >= edcaf.eligibility_time
                    && edcaf.access_armed
                    && edcaf.backoff.is_zero()
            })
            .collect()
    }

    fn decrement_backoffs(&mut self, now: SimTime) {
        for ac in self.eligible_acs(now) {
            let counter = {
                let edcaf = self.edcaf_mut(ac);
                if !edcaf.access_armed {
                    continue;
                }
                let counter = edcaf.backoff.counter();
                if !edcaf.backoff.is_zero() {
                    edcaf.backoff.decrement();
                }
                counter
            };
            if counter == 0 {
                continue;
            }
            self.backoff_counter_sum += counter as u64;
            self.backoff_sample_count += 1;
        }
    }

    fn begin_tx_from_ac(
        &mut self,
        ac: AccessCategory,
        now: SimTime,
        txop_continuation: bool,
    ) -> Option<Packet> {
        let mut txop_deadline = None;
        let tx_entry = {
            let edcaf = self.edcaf_mut(ac);
            let tx_entry = edcaf.queue.pop_front();
            if txop_continuation {
                edcaf.txop_uses += 1;
            } else {
                edcaf.txop_grants += 1;
                let txop_limit_us = self.edca_params[ac].txop_limit_us;
                if txop_limit_us > 0.0 {
                    txop_deadline = Some(now + SimTime::from_us(txop_limit_us));
                }
            }
            tx_entry
        };
        let entry = tx_entry?;
        self.data_sent += 1;
        *self.tx_attempts_by_ac.get_mut(ac) += 1;
        if txop_continuation {
            *self.txop_uses_by_ac.get_mut(ac) += 1;
        } else {
            *self.txop_grants_by_ac.get_mut(ac) += 1;
        }
        self.tx_context = Some(TxContext { entry, ac });
        self.state = CsmaState::TxData;
        if !txop_continuation {
            self.txop_context = txop_deadline.map(|deadline| TxopContext { ac, deadline });
        }
        self.tx_context.as_ref().map(|ctx| ctx.entry.packet.clone())
    }

    fn maybe_continue_txop(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        actions: &mut MacActions,
    ) -> bool {
        let Some(txop) = self.txop_context else {
            return false;
        };
        if now >= txop.deadline {
            self.txop_context = None;
            return false;
        }
        let next_packet = self
            .edcaf(txop.ac)
            .head()
            .map(|entry| entry.packet.clone());
        let Some(packet) = next_packet else {
            self.txop_context = None;
            return false;
        };
        if now + self.txop_exchange_time(&packet) > txop.deadline {
            self.txop_context = None;
            return false;
        }
        self.state = CsmaState::WaitTxopSifs;
        actions.push(MacAction::ScheduleEvent {
            delay: SimTime::from_us(self.config.sifs_us),
            priority: -1,
            kind: EventKind::SifsExpired { node_id },
        });
        true
    }

    fn continue_or_restart_after_success(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        actions: &mut MacActions,
    ) {
        if self.maybe_continue_txop(node_id, now, actions) {
            return;
        }
        self.txop_context = None;
        self.state = CsmaState::Idle;
        if self.total_queue_len() > 0 {
            self.recompute_queue_eligibility(now);
            self.schedule_access_check(node_id, now, actions);
        }
    }

    fn emit_collision_and_defer(&mut self, node_id: NodeId, now: SimTime) -> MacActions {
        let mut actions = MacActions::new();
        self.collisions_seen += 1;
        actions.push(MacAction::Emit(MetricEvent::Collision {
            time: now,
            node_id,
        }));
        self.schedule_eifs(now);
        actions
    }

    fn ack_matches_outstanding_tx(&self, node_id: NodeId, packet: &Packet) -> bool {
        if packet.kind != PacketKind::Ack || packet.dest_id != Some(node_id) {
            return false;
        }
        self.tx_context
            .as_ref()
            .map(|tx| {
                tx.entry.packet.dest_id == Some(packet.source_id)
                    && packet.acked_packet_id() == Some(tx.entry.packet.id)
            })
            .unwrap_or(false)
    }

    fn mark_success_and_clear_tx(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        actions: &mut MacActions,
    ) -> Option<AccessCategory> {
        let tx = self.tx_context.take()?;
        *self.tx_success_by_ac.get_mut(tx.ac) += 1;
        self.acks_received += 1;
        self.ack_timeout_deadline = None;
        actions.push(MacAction::Emit(MetricEvent::TxEnd {
            time: now,
            node_id,
            packet_id: tx.entry.packet.id,
            success: true,
        }));
        let edcaf = self.edcaf_mut(tx.ac);
        edcaf.access_armed = false;
        Some(tx.ac)
    }

    fn note_success_without_ack(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        actions: &mut MacActions,
    ) -> Option<AccessCategory> {
        let tx = self.tx_context.take()?;
        *self.tx_success_by_ac.get_mut(tx.ac) += 1;
        actions.push(MacAction::Emit(MetricEvent::TxEnd {
            time: now,
            node_id,
            packet_id: tx.entry.packet.id,
            success: true,
        }));
        let edcaf = self.edcaf_mut(tx.ac);
        edcaf.access_armed = false;
        Some(tx.ac)
    }

    fn handle_new_enqueue(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        channel_busy: bool,
        actions: &mut MacActions,
    ) {
        let mut touched = false;
        for ac in AccessCategory::ALL {
            let should_prime = {
                let edcaf = self.edcaf(ac);
                edcaf.queue.len() == 1 && !edcaf.access_armed
            };
            if should_prime {
                let eligibility_time = self.eligibility_after_defer(ac, now);
                self.edcaf_mut(ac).eligibility_time = eligibility_time;
                touched = true;
            }
        }
        if !touched {
            return;
        }
        if channel_busy {
            return;
        }
        match self.state {
            CsmaState::Idle => {
                self.schedule_access_check(node_id, now, actions);
            }
            CsmaState::WaitAifs => {
                if let Some(next_time) = self.earliest_eligibility() {
                    let next_time = std::cmp::max(next_time, self.access_not_before);
                    if next_time < self.next_access_check {
                        self.next_access_check = next_time;
                        actions.push(MacAction::ScheduleEvent {
                            delay: next_time - now,
                            priority: 0,
                            kind: EventKind::DifsExpired { node_id },
                        });
                    }
                }
            }
            CsmaState::Backoff => {}
            _ => {}
        }
    }

    fn internal_collision_winner(contenders: &[AccessCategory]) -> AccessCategory {
        contenders
            .iter()
            .copied()
            .min_by_key(|ac| ac.index())
            .unwrap_or(AccessCategory::Bk)
    }

    fn resolve_internal_collisions(
        &mut self,
        contenders: &[AccessCategory],
        rng: &mut RngStream,
    ) -> AccessCategory {
        let winner = Self::internal_collision_winner(contenders);
        for ac in contenders.iter().copied().filter(|ac| *ac != winner) {
            let params = self.edca_params[ac].clone();
            *self.internal_collisions_by_ac.get_mut(ac) += 1;
            let edcaf = self.edcaf_mut(ac);
            edcaf.internal_collisions += 1;
            edcaf.backoff.reconfigure(params.cw_min_exp, params.cw_max_exp);
            edcaf.backoff.fail(rng);
            edcaf.access_armed = true;
        }
        winner
    }

    fn snapshot_current_state(&self, now: SimTime) -> AccessCategoryRuntimeSnapshot {
        let mut snapshot = AccessCategoryRuntimeSnapshot::default();
        for ac in AccessCategory::ALL {
            let edcaf = self.edcaf(ac);
            snapshot.queue_len[ac] = edcaf.queue.len() as u32;
            if let Some(entry) = edcaf.head() {
                snapshot.head_of_line_age_ns[ac] = (now - entry.packet.creation_time).as_ns();
                snapshot.retry_count[ac] = entry.retry_count as u32;
            }
            if edcaf.access_armed {
                snapshot.backoff_stage[ac] = edcaf.backoff.stage();
                snapshot.backoff_slots[ac] = edcaf.backoff.counter();
                snapshot.current_cw_exp[ac] = edcaf.backoff.current_cw_exp();
            } else if edcaf.has_pending() {
                snapshot.current_cw_exp[ac] = self.edca_params[ac].cw_min_exp;
            }
        }
        snapshot
    }
}

impl Mac for CsmaMac {
    fn on_slot_start(
        &mut self,
        _node: &mut Node,
        _frame: u32,
        _slot: u16,
        _role: SlotRole,
        _now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        MacActions::new()
    }

    fn on_rx_packet(
        &mut self,
        node: &mut Node,
        packet: &Packet,
        sinr_db: f64,
        _rx_power_w: f64,
        _tx_node_id: NodeId,
        now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        let mut actions = MacActions::new();

        if sinr_db < self.config.effective_payload_decode_sinr_db() {
            self.schedule_eifs(now);
            return actions;
        }

        match packet.kind {
            PacketKind::Ack => {
                let paused_wait_ack = self.resume_wait_ack_after_txack
                    && matches!(self.state, CsmaState::WaitAckResponseSifs | CsmaState::TxAck);
                if (self.state == CsmaState::WaitAck || paused_wait_ack)
                    && self.ack_matches_outstanding_tx(node.id, packet)
                {
                    if let Some(ac) = self.mark_success_and_clear_tx(node.id, now, &mut actions) {
                        actions.push(MacAction::CancelAckTimeout { node_id: node.id });
                        if self.state == CsmaState::WaitAck {
                            self.continue_or_restart_after_success(node.id, now, &mut actions);
                        } else {
                            self.resume_wait_ack_after_txack = false;
                            self.txop_context = self
                                .txop_context
                                .filter(|txop| txop.ac == ac && now < txop.deadline);
                        }
                    }
                }
            }
            _ => {
                self.data_received += 1;
                actions.push(MacAction::Emit(MetricEvent::Rx {
                    time: now,
                    node_id: node.id,
                    packet_id: packet.id,
                    source_id: packet.source_id,
                    sinr_db,
                    success: true,
                }));

                let media_meta = packet.media_meta();
                let is_media_frame = media_meta.is_some() && packet.payload.is_some();
                let unicast_for_us = packet.dest_id == Some(node.id);
                let media_broadcast_for_us = is_media_frame && packet.dest_id.is_none();
                let should_deliver = unicast_for_us || media_broadcast_for_us;

                if should_deliver && self.delivered_packets.insert(packet.id) {
                    let latency = now - packet.creation_time;
                    let stream_id = media_meta.map(|m| m.stream_id);
                    let message_id = media_meta.map(|m| m.message_id).or(packet.message_id);
                    let frame_index = media_meta.map(|m| m.frame_index).or(packet.frame_index);
                    let fragment_index = media_meta.map(|m| m.fragment_index);
                    let fragment_count = media_meta.map(|m| m.fragment_count);
                    let media_kind = media_meta.map(|m| m.media_kind);
                    actions.push(MacAction::Emit(MetricEvent::Delivery {
                        time: now,
                        packet_id: packet.id,
                        source_id: packet.source_id,
                        dest_id: node.id,
                        latency,
                        hop_count: packet.hop_count,
                        control_class: AccessCategory::from_packet_kind(packet.kind),
                        stream_id,
                        message_id,
                        frame_index,
                        fragment_index,
                        fragment_count,
                        media_kind,
                        payload_len: packet.payload.as_ref().map(|p| p.len() as u32),
                    }));
                    if let (Some(meta), Some(payload)) = (media_meta, packet.payload.as_ref()) {
                        actions.push(MacAction::TrackMediaFrame {
                            source_id: packet.source_id,
                            dest_id: node.id,
                            media: meta,
                            payload: payload.clone(),
                        });
                    }
                }

                if unicast_for_us && !matches!(self.state, CsmaState::WaitAckResponseSifs | CsmaState::TxAck)
                {
                    if self.state == CsmaState::WaitAck {
                        self.resume_wait_ack_after_txack = true;
                        actions.push(MacAction::CancelAckTimeout { node_id: node.id });
                    } else {
                        self.resume_wait_ack_after_txack = false;
                    }
                    self.ack_pending = Some((packet.source_id, packet.id));
                    self.state = CsmaState::WaitAckResponseSifs;
                    actions.push(MacAction::ScheduleEvent {
                        delay: SimTime::from_us(self.config.sifs_us),
                        priority: -1,
                        kind: EventKind::SifsExpired { node_id: node.id },
                    });
                }
            }
        }

        actions
    }

    fn on_rx_batch(
        &mut self,
        node: &mut Node,
        signals: &[RxSignal],
        now: SimTime,
        rng: &mut RngStream,
    ) -> MacActions {
        let preamble_threshold_db = self.config.effective_preamble_detect_sinr_db();
        let payload_threshold_db = self.config.effective_payload_decode_sinr_db();
        let capture_window_us = self.capture_window_us();
        let detected_signals: Vec<&RxSignal> = signals
            .iter()
            .filter(|signal| signal.preamble_sinr_db >= preamble_threshold_db)
            .collect();
        let overlap_failure = detected_signals
            .iter()
            .any(|signal| signal.overlap_packet_count > 1);
        let candidates: Vec<&RxSignal> = detected_signals
            .iter()
            .copied()
            .filter(|signal| signal.start_offset_us <= capture_window_us)
            .collect();

        if let Some(best) = candidates.iter().copied().max_by(|a, b| {
            a.rx_power_w
                .partial_cmp(&b.rx_power_w)
                .unwrap_or(std::cmp::Ordering::Equal)
        }) {
            let second_power = candidates
                .iter()
                .copied()
                .filter(|signal| signal.packet.id != best.packet.id)
                .map(|signal| signal.rx_power_w)
                .fold(0.0f64, f64::max);
            let capture_margin_db = if second_power > 0.0 && best.rx_power_w > 0.0 {
                10.0 * (best.rx_power_w / second_power).log10()
            } else {
                f64::INFINITY
            };
            if capture_margin_db >= self.config.capture_margin_db
                && best.sinr_db >= payload_threshold_db
            {
                return self.on_rx_packet(
                    node,
                    &best.packet,
                    best.sinr_db,
                    best.rx_power_w,
                    best.tx_node_id,
                    now,
                    rng,
                );
            }
        }

        if overlap_failure {
            return self.emit_collision_and_defer(node.id, now);
        }

        if let Some(best) = detected_signals.iter().copied().max_by(|a, b| {
            a.sinr_db
                .partial_cmp(&b.sinr_db)
                .unwrap_or(std::cmp::Ordering::Equal)
        }) {
            return self.on_rx_packet(
                node,
                &best.packet,
                best.sinr_db,
                best.rx_power_w,
                best.tx_node_id,
                now,
                rng,
            );
        }

        MacActions::new()
    }

    fn on_timer(
        &mut self,
        node: &mut Node,
        timer: TimerKind,
        now: SimTime,
        rng: &mut RngStream,
    ) -> MacActions {
        let mut actions = MacActions::new();

        match timer {
            TimerKind::DifsExpired => {
                if self.state != CsmaState::WaitAifs || now < self.next_access_check {
                    return actions;
                }
                if self.channel_busy {
                    return actions;
                }
                self.prepare_eligible_edcafs(now, rng);
                let contenders = self.contend_now(now);
                if !contenders.is_empty() {
                    let winner = self.resolve_internal_collisions(&contenders, rng);
                    if let Some(packet) = self.begin_tx_from_ac(winner, now, false) {
                        actions.push(MacAction::Transmit { packet });
                    }
                } else if !self.eligible_acs(now).is_empty() {
                    self.state = CsmaState::Backoff;
                    actions.push(MacAction::ScheduleEvent {
                        delay: SimTime::from_us(self.config.slot_duration_us),
                        priority: 0,
                        kind: EventKind::BackoffTick { node_id: node.id },
                    });
                } else {
                    self.schedule_access_check(node.id, now, &mut actions);
                }
            }
            TimerKind::BackoffTick => {
                if self.state != CsmaState::Backoff {
                    return actions;
                }
                self.prepare_eligible_edcafs(now, rng);
                if self.channel_busy {
                    for ac in self.eligible_acs(now) {
                        self.edcaf_mut(ac).backoff.freeze();
                    }
                    return actions;
                }
                let contenders = self.contend_now(now);
                if !contenders.is_empty() {
                    let winner = self.resolve_internal_collisions(&contenders, rng);
                    if let Some(packet) = self.begin_tx_from_ac(winner, now, false) {
                        actions.push(MacAction::Transmit { packet });
                    }
                } else if !self.eligible_acs(now).is_empty() {
                    self.decrement_backoffs(now);
                    actions.push(MacAction::ScheduleEvent {
                        delay: SimTime::from_us(self.config.slot_duration_us),
                        priority: 0,
                        kind: EventKind::BackoffTick { node_id: node.id },
                    });
                } else {
                    self.schedule_access_check(node.id, now, &mut actions);
                }
            }
            TimerKind::AckTimeout { packet_id } => {
                let waiting_for_packet = self
                    .tx_context
                    .as_ref()
                    .map(|tx| tx.entry.packet.id == packet_id)
                    .unwrap_or(false);
                if self.state == CsmaState::WaitAck && waiting_for_packet {
                    self.ack_timeout_deadline = None;
                    if let Some(mut tx) = self.tx_context.take() {
                        *self.ack_timeouts_by_ac.get_mut(tx.ac) += 1;
                        if tx.entry.retry_count >= self.config.max_retries {
                            self.packets_dropped += 1;
                            *self.drops_by_ac.get_mut(tx.ac) += 1;
                            actions.push(MacAction::Emit(MetricEvent::Drop {
                                time: now,
                                node_id: node.id,
                                packet_id: tx.entry.packet.id,
                                reason: "max_retries",
                            }));
                            actions.push(MacAction::Emit(MetricEvent::TxEnd {
                                time: now,
                                node_id: node.id,
                                packet_id: tx.entry.packet.id,
                                success: false,
                            }));
                            self.edcaf_mut(tx.ac).access_armed = false;
                            self.txop_context = None;
                            self.state = CsmaState::Idle;
                            if self.total_queue_len() > 0 {
                                self.recompute_queue_eligibility(now);
                                self.schedule_access_check(node.id, now, &mut actions);
                            }
                        } else {
                            self.retransmissions += 1;
                            *self.retries_by_ac.get_mut(tx.ac) += 1;
                            tx.entry.retry_count += 1;
                            let params = self.edca_params[tx.ac].clone();
                            let eligibility_time = self.eligibility_after_defer(tx.ac, now);
                            let edcaf = self.edcaf_mut(tx.ac);
                            edcaf.queue.push_front(tx.entry);
                            edcaf.backoff.reconfigure(params.cw_min_exp, params.cw_max_exp);
                            edcaf.backoff.fail(rng);
                            edcaf.access_armed = true;
                            edcaf.eligibility_time = eligibility_time;
                            self.txop_context = None;
                            self.state = CsmaState::WaitAifs;
                            actions.push(MacAction::ScheduleEvent {
                                delay: eligibility_time - now,
                                priority: 0,
                                kind: EventKind::DifsExpired { node_id: node.id },
                            });
                        }
                    }
                }
            }
            TimerKind::SifsExpired => match self.state {
                CsmaState::WaitAckResponseSifs => {
                    if let Some((dest, acked_packet_id)) = self.ack_pending.take() {
                        let ack =
                            Packet::new_ack(node.id, dest, acked_packet_id, now, self.config.ack_bits);
                        self.acks_sent += 1;
                        self.state = CsmaState::TxAck;
                        actions.push(MacAction::Transmit { packet: ack });
                    }
                }
                CsmaState::WaitTxopSifs => {
                    if let Some(txop) = self.txop_context {
                        if let Some(packet) = self.begin_tx_from_ac(txop.ac, now, true) {
                            actions.push(MacAction::Transmit { packet });
                        } else {
                            self.state = CsmaState::Idle;
                            self.txop_context = None;
                        }
                    } else {
                        self.state = CsmaState::Idle;
                    }
                }
                _ => {}
            },
            TimerKind::TxComplete {
                packet_id,
                ack_timeout_delay,
            } => match self.state {
                CsmaState::TxData => {
                    let tx_matches = self
                        .tx_context
                        .as_ref()
                        .map(|tx| tx.entry.packet.id == packet_id)
                        .unwrap_or(false);
                    if !tx_matches {
                        return actions;
                    }
                    let is_unicast = self
                        .tx_context
                        .as_ref()
                        .and_then(|tx| tx.entry.packet.dest_id)
                        .is_some();
                    if is_unicast {
                        self.state = CsmaState::WaitAck;
                        let timeout_delay = ack_timeout_delay
                            .unwrap_or_else(|| SimTime::from_us(self.config.ack_timeout_us));
                        self.ack_timeout_deadline = Some(now + timeout_delay);
                        actions.push(MacAction::ScheduleEvent {
                            delay: timeout_delay,
                            priority: 1,
                            kind: EventKind::AckTimeout {
                                node_id: node.id,
                                packet_id,
                            },
                        });
                    } else if self
                        .note_success_without_ack(node.id, now, &mut actions)
                        .is_some()
                    {
                        self.continue_or_restart_after_success(node.id, now, &mut actions);
                    }
                }
                CsmaState::TxAck => {
                    if self.resume_wait_ack_after_txack && self.tx_context.is_some() {
                        self.state = CsmaState::WaitAck;
                        self.resume_wait_ack_after_txack = false;
                        if let Some(tx) = self.tx_context.as_ref() {
                            let delay = self
                                .ack_timeout_deadline
                                .map(|deadline| if now >= deadline { SimTime::ZERO } else { deadline - now })
                                .unwrap_or_else(|| SimTime::from_us(self.config.ack_timeout_us));
                            actions.push(MacAction::ScheduleEvent {
                                delay,
                                priority: 1,
                                kind: EventKind::AckTimeout {
                                    node_id: node.id,
                                    packet_id: tx.entry.packet.id,
                                },
                            });
                        }
                    } else {
                        self.resume_wait_ack_after_txack = false;
                        self.continue_or_restart_after_success(node.id, now, &mut actions);
                    }
                }
                _ => {}
            },
        }

        actions
    }

    fn on_cca_result(
        &mut self,
        node: &mut Node,
        channel_busy: bool,
        now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        self.update_channel_state(node.id, channel_busy, now, true, true)
    }

    fn on_medium_state_change(
        &mut self,
        node: &mut Node,
        channel_busy: bool,
        now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        self.update_channel_state(node.id, channel_busy, now, false, false)
    }

    fn on_enqueue(
        &mut self,
        node: &mut Node,
        now: SimTime,
        channel_busy: bool,
        _rng: &mut RngStream,
    ) -> MacActions {
        let mut actions = MacActions::new();
        self.handle_new_enqueue(node.id, now, channel_busy, &mut actions);
        actions
    }

    fn queue_length(&self) -> usize {
        self.total_queue_len()
    }

    fn enqueue(&mut self, packet: Packet, _priority: u8) {
        // Resolve target AC: stream override beats packet-kind classifier.
        let stream_id = packet.media_meta().map(|m| m.stream_id);
        let mut ac = Self::classify(&packet);
        if let Some(sid) = stream_id {
            if self.paused_streams.contains(&sid) {
                self.stream_paused_drops += 1;
                return;
            }
            if let Some(target_ac) = self.stream_ac_overrides.get(&sid).copied() {
                if target_ac != ac {
                    self.stream_reclassifications += 1;
                }
                ac = target_ac;
            }
        }

        // Per-AC token-bucket rate cap.
        if !self.consume_rate_cap_token(ac, packet.creation_time) {
            *self.rate_cap_drops_by_ac.get_mut(ac) += 1;
            return;
        }

        // Per-AC admission cap (override beats global cap).
        let per_ac_cap = self.max_queue_len_override[ac].map(|v| v as usize);
        if let Some(cap) = per_ac_cap {
            if self.edcaf(ac).queue.len() >= cap {
                *self.admission_drops_by_ac.get_mut(ac) += 1;
                return;
            }
        }
        if self.total_queue_len() >= self.max_queue {
            self.packets_dropped += 1;
            *self.drops_by_ac.get_mut(ac) += 1;
            return;
        }

        self.edcaf_mut(ac).queue.push_back(QueueEntry {
            packet,
            retry_count: 0,
        });
    }

    fn apply_local_action(
        &mut self,
        action: &LocalAction,
        now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        let mut out = MacActions::new();

        // ---- Axis 1: EDCA tuning ----
        // Persist deltas so `effective_params` continues to read them.
        self.active_action.aifsn_delta = action.aifsn_delta;
        self.active_action.cw_min_exp_delta = action.cw_min_exp_delta;
        self.active_action.cw_max_exp_delta = action.cw_max_exp_delta;
        self.active_action.txop_limit_us_delta = action.txop_limit_us_delta;
        self.edca_params = AccessCategoryValues::new(
            self.effective_params(AccessCategory::Vo),
            self.effective_params(AccessCategory::Vi),
            self.effective_params(AccessCategory::Be),
            self.effective_params(AccessCategory::Bk),
        );
        for ac in AccessCategory::ALL {
            let params = self.edca_params[ac].clone();
            self.edcaf_mut(ac)
                .backoff
                .reconfigure(params.cw_min_exp, params.cw_max_exp);
        }

        // ---- Axis 3: admission control (persistent overrides) ----
        for ac in AccessCategory::ALL {
            self.max_queue_len_override[ac] = action.max_queue_len[ac];
            // If rate-cap newly enabled, seed the bucket with `now`.
            let prev = self.rate_cap_pps[ac];
            self.rate_cap_pps[ac] = action.rate_cap_pps[ac];
            match (prev, action.rate_cap_pps[ac]) {
                (None, Some(rate)) => {
                    let cap = (rate as f64).max(0.0); // 1 second of burst
                    self.rate_cap_tokens[ac] = cap;
                    self.rate_cap_last_refill[ac] = now;
                }
                _ => {}
            }
        }

        // ---- Axis 4: stream-level (persistent state) ----
        for sid in &action.pause_streams {
            self.paused_streams.insert(*sid);
        }
        for sid in &action.resume_streams {
            self.paused_streams.remove(sid);
        }
        for (sid, target_ac) in &action.reclassify_streams {
            self.stream_ac_overrides.insert(*sid, *target_ac);
        }

        // ---- Axis 4: drop_streams (imperative, this tick) ----
        let mut node_id_for_event: Option<NodeId> = None;
        if !action.drop_streams.is_empty() {
            node_id_for_event = self
                .tx_context
                .as_ref()
                .map(|tx| tx.entry.packet.source_id);
            let drop_set: HashSet<u32> = action.drop_streams.iter().copied().collect();
            for ac in AccessCategory::ALL {
                let queue = &mut self.edcaf_mut(ac).queue;
                let before = queue.len();
                queue.retain(|entry| {
                    let keep = entry
                        .packet
                        .media_meta()
                        .map(|m| !drop_set.contains(&m.stream_id))
                        .unwrap_or(true);
                    if !keep {
                        out.push(MacAction::Emit(MetricEvent::Drop {
                            time: now,
                            node_id: entry.packet.source_id,
                            packet_id: entry.packet.id,
                            reason: "agent_drop_stream",
                        }));
                    }
                    keep
                });
                self.stream_flush_drops += (before - queue.len()) as u32;
            }
        }

        // ---- Axis 2: queue management (imperative, this tick) ----
        for ac in AccessCategory::ALL {
            let n = action.purge_oldest[ac];
            if n > 0 {
                let mut purged = 0u32;
                while purged < n as u32 {
                    if let Some(entry) = self.edcaf_mut(ac).queue.pop_front() {
                        out.push(MacAction::Emit(MetricEvent::Drop {
                            time: now,
                            node_id: entry.packet.source_id,
                            packet_id: entry.packet.id,
                            reason: "agent_purge_oldest",
                        }));
                        purged += 1;
                    } else {
                        break;
                    }
                }
                *self.purged_oldest_by_ac.get_mut(ac) += purged;
            }

            let threshold_ms = action.purge_older_than_ms[ac];
            if threshold_ms > 0 {
                let threshold_ns = (threshold_ms as u64).saturating_mul(1_000_000);
                let mut purged = 0u32;
                while let Some(entry) = self.edcaf(ac).queue.front() {
                    let age_ns = now
                        .as_ns()
                        .saturating_sub(entry.packet.creation_time.as_ns());
                    if age_ns < threshold_ns {
                        break;
                    }
                    if let Some(entry) = self.edcaf_mut(ac).queue.pop_front() {
                        out.push(MacAction::Emit(MetricEvent::Drop {
                            time: now,
                            node_id: entry.packet.source_id,
                            packet_id: entry.packet.id,
                            reason: "agent_purge_older_than",
                        }));
                        purged += 1;
                    }
                }
                *self.purged_older_than_by_ac.get_mut(ac) += purged;
            }
        }

        let _ = node_id_for_event;
        out
    }

    fn queue_length_by_access_category(&self) -> AccessCategoryValues<usize> {
        AccessCategoryValues::new(
            self.edcaf(AccessCategory::Vo).queue.len(),
            self.edcaf(AccessCategory::Vi).queue.len(),
            self.edcaf(AccessCategory::Be).queue.len(),
            self.edcaf(AccessCategory::Bk).queue.len(),
        )
    }

    fn snapshot_access_state(&self, now: SimTime) -> AccessCategoryRuntimeSnapshot {
        self.snapshot_current_state(now)
    }

    fn snapshot_mac_counters(&self) -> MacControlCounters {
        MacControlCounters {
            tx_attempts: self.tx_attempts_by_ac,
            tx_success: self.tx_success_by_ac,
            retries: self.retries_by_ac,
            ack_timeouts: self.ack_timeouts_by_ac,
            drops: self.drops_by_ac,
            internal_collisions: self.internal_collisions_by_ac,
            txop_grants: self.txop_grants_by_ac,
            txop_uses: self.txop_uses_by_ac,
            collisions: self.collisions_seen,
            cca_busy_samples: self.cca_busy_samples,
            cca_total_samples: self.cca_total_samples,
            backoff_counter_sum: self.backoff_counter_sum,
            backoff_sample_count: self.backoff_sample_count,
        }
    }

    fn snapshot_action_outcomes(&self) -> ActionOutcomeCounters {
        ActionOutcomeCounters {
            purged_oldest: self.purged_oldest_by_ac,
            purged_older_than: self.purged_older_than_by_ac,
            admission_drops: self.admission_drops_by_ac,
            rate_cap_drops: self.rate_cap_drops_by_ac,
            stream_paused_drops: self.stream_paused_drops,
            stream_flush_drops: self.stream_flush_drops,
            stream_reclassifications: self.stream_reclassifications,
        }
    }

    fn snapshot_streams_present(&self) -> Vec<u32> {
        let mut seen: HashSet<u32> = HashSet::new();
        for ac in AccessCategory::ALL {
            for entry in &self.edcaf(ac).queue {
                if let Some(meta) = entry.packet.media_meta() {
                    seen.insert(meta.stream_id);
                }
            }
        }
        let mut out: Vec<u32> = seen.into_iter().collect();
        out.sort_unstable();
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::node::Vec2;
    use crate::phy::channel::RxSignal;
    use crate::rng::RngContext;

    fn make_packet(id: PacketId, kind: PacketKind, dest_id: Option<NodeId>) -> Packet {
        Packet {
            id,
            source_id: 0,
            dest_id,
            kind,
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

    fn scheduled_delay<F>(actions: &MacActions, matcher: F) -> Option<SimTime>
    where
        F: Fn(&EventKind) -> bool,
    {
        actions.iter().find_map(|action| match action {
            MacAction::ScheduleEvent { delay, kind, .. } if matcher(kind) => Some(*delay),
            _ => None,
        })
    }

    fn rx_signal(
        packet: Packet,
        preamble_sinr_db: f64,
        sinr_db: f64,
        overlap_packet_count: u16,
    ) -> RxSignal {
        RxSignal {
            packet,
            rx_power_w: 1.0,
            sinr_linear: 10f64.powf(sinr_db / 10.0),
            sinr_db,
            preamble_sinr_db,
            tx_node_id: 1,
            other_plus_noise_w: 0.1,
            toa_offset_us: 0.0,
            start_offset_us: 0.0,
            overlap_packet_count,
        }
    }

    #[test]
    fn queue_lengths_follow_access_categories() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        mac.enqueue(make_packet(1, PacketKind::Voice, None), 0);
        mac.enqueue(make_packet(2, PacketKind::Video, None), 0);
        mac.enqueue(make_packet(3, PacketKind::Data, None), 0);
        mac.enqueue(make_packet(4, PacketKind::Bulk, None), 0);
        let q = mac.queue_length_by_access_category();
        assert_eq!(q.vo, 1);
        assert_eq!(q.vi, 1);
        assert_eq!(q.be, 1);
        assert_eq!(q.bk, 1);
    }

    #[test]
    fn local_aifsn_delta_changes_access_delay() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(3).stream("aifs_control");
        mac.enqueue(make_packet(1, PacketKind::Data, None), 0);

        let mut action = LocalAction::default();
        action.aifsn_delta.be = 4;
        let _ = mac.apply_local_action(&action, SimTime::ZERO, &mut rng);

        let actions = mac.on_cca_result(&mut node, false, SimTime::ZERO, &mut rng);
        let expected = mac.aifs_duration(AccessCategory::Be);
        assert_eq!(mac.edcaf(AccessCategory::Be).eligibility_time, expected);
        assert_eq!(
            scheduled_delay(&actions, |kind| {
                matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
            }),
            Some(expected),
        );
    }

    #[test]
    fn failed_decode_defers_access_until_eifs() {
        let cfg = CsmaConfig::default();
        let mut mac = CsmaMac::new(cfg.clone());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(4).stream("eifs");
        mac.enqueue(make_packet(1, PacketKind::Data, None), 0);

        let bad_rx = make_packet(99, PacketKind::Data, Some(0));
        let actions = mac.on_rx_packet(
            &mut node,
            &bad_rx,
            cfg.effective_payload_decode_sinr_db() - 1.0,
            0.0,
            1,
            SimTime::ZERO,
            &mut rng,
        );
        assert!(actions.is_empty(), "failed decode should not emit actions immediately");

        let cca_actions = mac.on_cca_result(&mut node, false, SimTime::ZERO, &mut rng);
        let expected = SimTime::from_us(cfg.eifs_us());
        assert_eq!(mac.edcaf(AccessCategory::Be).eligibility_time, expected);
        assert_eq!(
            scheduled_delay(&cca_actions, |kind| {
                matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
            }),
            Some(expected),
        );
    }

    #[test]
    fn internal_collision_prefers_higher_priority_ac() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        let mut rng = RngContext::new(1).stream("internal_collision");
        mac.enqueue(make_packet(1, PacketKind::Voice, None), 0);
        mac.enqueue(make_packet(2, PacketKind::Data, None), 0);
        mac.edcaf_mut(AccessCategory::Vo).eligibility_time = SimTime::ZERO;
        mac.edcaf_mut(AccessCategory::Be).eligibility_time = SimTime::ZERO;
        mac.edcaf_mut(AccessCategory::Vo).access_armed = true;
        mac.edcaf_mut(AccessCategory::Be).access_armed = true;
        mac.edcaf_mut(AccessCategory::Vo).backoff.reconfigure(1, 1);
        mac.edcaf_mut(AccessCategory::Be).backoff.reconfigure(1, 1);
        mac.edcaf_mut(AccessCategory::Vo).backoff.reset(&mut rng);
        mac.edcaf_mut(AccessCategory::Be).backoff.reset(&mut rng);
        mac.edcaf_mut(AccessCategory::Vo).backoff.freeze();
        mac.edcaf_mut(AccessCategory::Be).backoff.freeze();
        mac.edcaf_mut(AccessCategory::Vo).backoff.resume();
        mac.edcaf_mut(AccessCategory::Be).backoff.resume();
        mac.edcaf_mut(AccessCategory::Vo).backoff.reconfigure(1, 1);
        mac.edcaf_mut(AccessCategory::Be).backoff.reconfigure(1, 1);
        assert_eq!(mac.resolve_internal_collisions(&[AccessCategory::Be, AccessCategory::Vo], &mut rng), AccessCategory::Vo);
    }

    #[test]
    fn backoff_zero_waits_until_next_slot_boundary() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(5).stream("backoff_zero");
        mac.enqueue(make_packet(1, PacketKind::Data, None), 0);
        mac.state = CsmaState::Backoff;
        mac.edcaf_mut(AccessCategory::Be).eligibility_time = SimTime::ZERO;
        mac.edcaf_mut(AccessCategory::Be).access_armed = true;
        mac.edcaf_mut(AccessCategory::Be).backoff.set_counter(1);

        let first = mac.on_timer(&mut node, TimerKind::BackoffTick, SimTime::ZERO, &mut rng);
        assert!(
            !first
                .iter()
                .any(|action| matches!(action, MacAction::Transmit { .. })),
            "counter reaching zero this tick must not transmit immediately",
        );
        assert_eq!(mac.edcaf(AccessCategory::Be).backoff.counter(), 0);
        assert_eq!(
            scheduled_delay(&first, |kind| {
                matches!(kind, EventKind::BackoffTick { node_id } if *node_id == 0)
            }),
            Some(SimTime::from_us(mac.config.slot_duration_us)),
        );

        let second = mac.on_timer(
            &mut node,
            TimerKind::BackoffTick,
            SimTime::from_us(mac.config.slot_duration_us),
            &mut rng,
        );
        assert!(second.iter().any(|action| {
            matches!(action, MacAction::Transmit { packet } if packet.id == 1)
        }));
    }

    #[test]
    fn txop_continuation_schedules_second_voice_frame() {
        let mut cfg = CsmaConfig::default();
        cfg.edca.vo.txop_limit_us = 5000.0;
        let mut mac = CsmaMac::new(cfg);
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(2).stream("txop");
        mac.enqueue(make_packet(1, PacketKind::Voice, None), 0);
        mac.enqueue(make_packet(2, PacketKind::Voice, None), 0);
        mac.state = CsmaState::WaitAifs;
        mac.next_access_check = SimTime::ZERO;
        mac.edcaf_mut(AccessCategory::Vo).eligibility_time = SimTime::ZERO;
        mac.edcaf_mut(AccessCategory::Vo).access_armed = true;
        mac.edcaf_mut(AccessCategory::Vo).backoff.set_counter(0);

        let actions = mac.on_timer(&mut node, TimerKind::DifsExpired, SimTime::ZERO, &mut rng);
        assert!(actions.iter().any(|a| matches!(a, MacAction::Transmit { packet } if packet.id == 1)));

        let complete = mac.on_timer(
            &mut node,
            TimerKind::TxComplete {
                packet_id: 1,
                ack_timeout_delay: None,
            },
            SimTime::from_us(500.0),
            &mut rng,
        );
        assert!(complete.iter().any(|a| {
            matches!(
                a,
                MacAction::ScheduleEvent {
                    kind: EventKind::SifsExpired { node_id: 0 },
                    ..
                }
            )
        }));
    }

    #[test]
    fn txop_rejects_unicast_frame_that_cannot_fit_ack_exchange() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        let mut actions = MacActions::new();
        let packet = make_packet(2, PacketKind::Data, Some(1));
        let data_plus_sifs = mac.packet_airtime_us(&packet) + mac.config.sifs_us;
        let full_exchange = mac.txop_exchange_time(&packet);
        assert!(
            SimTime::from_us(data_plus_sifs + 1.0) < full_exchange,
            "test requires ACK time to exceed the slack beyond data+SIFS",
        );

        mac.edcaf_mut(AccessCategory::Be).queue.push_back(QueueEntry {
            packet,
            retry_count: 0,
        });
        mac.txop_context = Some(TxopContext {
            ac: AccessCategory::Be,
            deadline: SimTime::from_us(data_plus_sifs + 1.0),
        });

        let continued = mac.maybe_continue_txop(0, SimTime::ZERO, &mut actions);
        assert!(!continued);
        assert!(actions.is_empty());
        assert!(mac.txop_context.is_none());
    }

    #[test]
    fn broadcast_success_restarts_access_for_queued_packet() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(6).stream("broadcast_restart");

        mac.edcaf_mut(AccessCategory::Be).queue.push_back(QueueEntry {
            packet: make_packet(2, PacketKind::Data, None),
            retry_count: 0,
        });
        mac.edcaf_mut(AccessCategory::Be).access_armed = true;
        mac.tx_context = Some(TxContext {
            entry: QueueEntry {
                packet: make_packet(1, PacketKind::Data, None),
                retry_count: 0,
            },
            ac: AccessCategory::Be,
        });
        mac.state = CsmaState::TxData;

        let actions = mac.on_timer(
            &mut node,
            TimerKind::TxComplete {
                packet_id: 1,
                ack_timeout_delay: None,
            },
            SimTime::ZERO,
            &mut rng,
        );

        assert!(mac.tx_context.is_none());
        assert_eq!(mac.state, CsmaState::WaitAifs);
        assert_eq!(
            mac.edcaf(AccessCategory::Be)
                .head()
                .map(|entry| entry.packet.id),
            Some(2),
        );
        assert_eq!(
            scheduled_delay(&actions, |kind| {
                matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
            }),
            Some(mac.aifs_duration(AccessCategory::Be)),
        );
    }

    #[test]
    fn tx_ack_completion_restarts_local_backlog() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(10).stream("tx_ack_restart");
        mac.enqueue(make_packet(3, PacketKind::Data, Some(1)), 0);
        mac.state = CsmaState::TxAck;

        let actions = mac.on_timer(
            &mut node,
            TimerKind::TxComplete {
                packet_id: 999,
                ack_timeout_delay: None,
            },
            SimTime::ZERO,
            &mut rng,
        );

        assert_eq!(mac.state, CsmaState::WaitAifs);
        assert_eq!(
            scheduled_delay(&actions, |kind| {
                matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
            }),
            Some(mac.aifs_duration(AccessCategory::Be)),
        );
    }

    #[test]
    fn enqueue_with_shorter_aifs_reschedules_waitaifs_earlier() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(11).stream("enqueue_waitaifs");
        mac.enqueue(make_packet(1, PacketKind::Data, None), 0);

        let initial = mac.on_cca_result(&mut node, false, SimTime::ZERO, &mut rng);
        assert_eq!(mac.state, CsmaState::WaitAifs);
        let be_delay = scheduled_delay(&initial, |kind| {
            matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
        })
        .expect("BE access should schedule an initial wait");

        mac.enqueue(make_packet(2, PacketKind::Voice, None), 0);
        let enqueue_actions = mac.on_enqueue(&mut node, SimTime::ZERO, false, &mut rng);
        let vo_delay = mac.aifs_duration(AccessCategory::Vo);

        assert!(vo_delay < be_delay, "VO should have a shorter AIFS than BE");
        assert_eq!(mac.state, CsmaState::WaitAifs);
        assert_eq!(mac.next_access_check, vo_delay);
        assert_eq!(
            scheduled_delay(&enqueue_actions, |kind| {
                matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
            }),
            Some(vo_delay),
        );
    }

    #[test]
    fn later_aifs_ac_joins_running_backoff_round() {
        let mut mac = CsmaMac::new(CsmaConfig::default());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(12).stream("join_backoff");
        mac.enqueue(make_packet(1, PacketKind::Voice, None), 0);
        mac.enqueue(make_packet(2, PacketKind::Data, None), 0);
        mac.state = CsmaState::Backoff;
        mac.edcaf_mut(AccessCategory::Vo).eligibility_time = SimTime::ZERO;
        mac.edcaf_mut(AccessCategory::Vo).access_armed = true;
        mac.edcaf_mut(AccessCategory::Vo).backoff.set_counter(3);
        mac.edcaf_mut(AccessCategory::Be).eligibility_time =
            SimTime::from_us(mac.config.slot_duration_us);

        let now = SimTime::from_us(mac.config.slot_duration_us);
        let actions = mac.on_timer(&mut node, TimerKind::BackoffTick, now, &mut rng);
        let be_joined = mac.edcaf(AccessCategory::Be).access_armed
            || mac
                .tx_context
                .as_ref()
                .map(|tx| tx.entry.packet.id == 2)
                .unwrap_or(false)
            || actions.iter().any(|action| {
                matches!(action, MacAction::Transmit { packet } if packet.id == 2)
            });

        assert!(
            be_joined,
            "BE should arm and join the current backoff round once its later AIFS expires",
        );
    }

    #[test]
    fn undetectable_signal_does_not_trigger_eifs() {
        let cfg = CsmaConfig::default();
        let mut mac = CsmaMac::new(cfg.clone());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(13).stream("undetectable_signal");
        mac.enqueue(make_packet(1, PacketKind::Data, None), 0);

        let signal = rx_signal(
            make_packet(99, PacketKind::Data, Some(0)),
            cfg.effective_preamble_detect_sinr_db() - 1.0,
            cfg.effective_payload_decode_sinr_db() - 2.0,
            1,
        );
        let actions = mac.on_rx_batch(&mut node, &[signal], SimTime::ZERO, &mut rng);
        assert!(actions.is_empty(), "undetectable packets should not emit MAC actions");

        let cca_actions = mac.on_cca_result(&mut node, false, SimTime::ZERO, &mut rng);
        assert_eq!(
            scheduled_delay(&cca_actions, |kind| {
                matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
            }),
            Some(mac.aifs_duration(AccessCategory::Be)),
        );
    }

    #[test]
    fn detected_but_undecodable_signal_triggers_eifs() {
        let cfg = CsmaConfig::default();
        let mut mac = CsmaMac::new(cfg.clone());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(14).stream("detect_gate");
        mac.enqueue(make_packet(1, PacketKind::Data, None), 0);

        let signal = rx_signal(
            make_packet(99, PacketKind::Data, Some(0)),
            cfg.effective_preamble_detect_sinr_db() + 3.0,
            cfg.effective_payload_decode_sinr_db() - 1.0,
            1,
        );
        let actions = mac.on_rx_batch(&mut node, &[signal], SimTime::ZERO, &mut rng);
        assert!(actions.is_empty(), "failed decode should defer internally via EIFS");

        let cca_actions = mac.on_cca_result(&mut node, false, SimTime::ZERO, &mut rng);
        assert_eq!(
            scheduled_delay(&cca_actions, |kind| {
                matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
            }),
            Some(SimTime::from_us(cfg.eifs_us())),
        );
    }

    #[test]
    fn final_ack_timeout_drop_restarts_access_for_queued_packet() {
        let mut cfg = CsmaConfig::default();
        cfg.max_retries = 0;
        let mut mac = CsmaMac::new(cfg.clone());
        let mut node = Node::new(0, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(8).stream("final_drop");

        let dropped = make_packet(1, PacketKind::Data, Some(1));
        let queued = make_packet(2, PacketKind::Data, Some(1));
        mac.edcaf_mut(AccessCategory::Be).queue.push_back(QueueEntry {
            packet: queued.clone(),
            retry_count: 0,
        });
        mac.edcaf_mut(AccessCategory::Be).access_armed = true;
        mac.tx_context = Some(TxContext {
            entry: QueueEntry {
                packet: dropped,
                retry_count: 0,
            },
            ac: AccessCategory::Be,
        });
        mac.state = CsmaState::WaitAck;

        let actions = mac.on_timer(
            &mut node,
            TimerKind::AckTimeout { packet_id: 1 },
            SimTime::ZERO,
            &mut rng,
        );

        assert!(mac.tx_context.is_none());
        assert_eq!(mac.state, CsmaState::WaitAifs);
        assert!(!mac.edcaf(AccessCategory::Be).access_armed);
        assert_eq!(
            mac.edcaf(AccessCategory::Be)
                .head()
                .map(|entry| entry.packet.id),
            Some(2),
        );
        assert_eq!(
            scheduled_delay(&actions, |kind| {
                matches!(kind, EventKind::DifsExpired { node_id } if *node_id == 0)
            }),
            Some(mac.aifs_duration(AccessCategory::Be)),
        );
    }
}
