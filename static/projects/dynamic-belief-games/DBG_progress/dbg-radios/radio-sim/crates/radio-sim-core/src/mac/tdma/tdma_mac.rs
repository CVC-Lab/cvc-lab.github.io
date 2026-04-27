use std::collections::VecDeque;

use hashbrown::{HashMap, HashSet};

use crate::config::{GuardFallbackMode, TdmaConfig};
use crate::control::{AccessCategory, AccessCategoryValues, LocalAction, MacControlCounters};
use crate::des::{NodeId, PacketId, SimTime, SlotRole};
use crate::node::Node;
use crate::packet::{AirBits, HopSidecar, Packet, PacketKind};
use crate::phy::channel::RxSignal;
use crate::rng::RngStream;

use super::bac::BacScheduler;
use super::combining;
use crate::mac::traits::{Mac, MacAction, MacActions, MetricEvent, TimerKind};

/// Stored packet data for relay.
#[derive(Debug, Clone)]
struct StoredPacket {
    packet: Packet,
    _airbits: AirBits,
    _sidecar: HopSidecar,
}

/// TDMA MAC with BRN-style barrage relay.
#[derive(Debug)]
pub struct TdmaMac {
    config: TdmaConfig,
    bac: BacScheduler,

    // Pipeline parameters
    m_pipeline: u8,
    global_dlc_index: u32,

    // Per-packet relay state
    armed: HashSet<PacketId>,
    relayed: HashSet<PacketId>,
    seen: HashSet<PacketId>,
    relay_next_slot_class: HashMap<PacketId, u8>,
    relay_ready_dlc: HashMap<PacketId, u32>,
    packet_ttl: HashMap<PacketId, u32>,
    packet_store: HashMap<PacketId, StoredPacket>,

    // Transmission queue
    tx_queue: VecDeque<Packet>,
    max_queue: usize,

    // Network info for destination selection
    num_nodes: u16,
    current_slot_role: SlotRole,
    allow_mac_origination: bool,
}

impl TdmaMac {
    pub fn new(
        config: TdmaConfig,
        dlc_slot_indices: &[u16],
        num_nodes: u16,
        allow_mac_origination: bool,
    ) -> Self {
        let bac =
            BacScheduler::round_robin(dlc_slot_indices, num_nodes, config.drain_slots);
        let m = config.m_pipeline;
        let max_q = config.node_queue_size as usize;
        TdmaMac {
            config,
            bac,
            m_pipeline: m,
            global_dlc_index: 0,
            armed: HashSet::new(),
            relayed: HashSet::new(),
            seen: HashSet::new(),
            relay_next_slot_class: HashMap::new(),
            relay_ready_dlc: HashMap::new(),
            packet_ttl: HashMap::new(),
            packet_store: HashMap::new(),
            tx_queue: VecDeque::new(),
            max_queue: max_q,
            num_nodes,
            current_slot_role: SlotRole::DLC,
            allow_mac_origination,
        }
    }

    /// Garbage collect packets whose TTL has expired.
    fn gc_expired(&mut self, current_dlc: u32) {
        let expired: Vec<PacketId> = self
            .packet_ttl
            .iter()
            .filter(|(_, &ttl)| ttl < current_dlc)
            .map(|(&pid, _)| pid)
            .collect();
        for pid in expired {
            self.packet_ttl.remove(&pid);
            self.relay_next_slot_class.remove(&pid);
            self.relay_ready_dlc.remove(&pid);
            self.packet_store.remove(&pid);
            self.armed.remove(&pid);
            self.relayed.remove(&pid);
        }
    }

    /// Try to originate a new packet.
    fn try_originate(
        &mut self,
        node: &mut Node,
        now: SimTime,
        rng: &mut RngStream,
    ) -> Option<Packet> {
        // First check local queue
        if let Some(pkt) = self.tx_queue.pop_front() {
            node.created_packets.insert(pkt.id);
            return Some(pkt);
        }

        if !self.allow_mac_origination {
            return None;
        }

        // Bernoulli origination
        if rng.gen_bool(self.config.source_probability) {
            let dest = if rng.gen_bool(self.config.broadcast_probability) {
                None
            } else {
                let candidates: Vec<NodeId> = (0..self.num_nodes)
                    .filter(|&n| n != node.id)
                    .collect();
                rng.choice(&candidates)
            };
            let pkt = Packet {
                id: 0, // assigned by runner
                source_id: node.id,
                dest_id: dest,
                kind: PacketKind::Data,
                creation_time: now,
                payload_bits: 1024,
                payload: None,
                media: None,
                message_id: None,
                frame_index: None,
                hop_count: 0,
                max_hops: self.config.max_hops,
                delivered: false,
                region_id: None,
            };
            node.created_packets.insert(pkt.id);
            return Some(pkt);
        }
        None
    }

    /// Select the best relay candidate from armed packets matching the slot class.
    fn try_relay(&mut self, slot_class: u8, current_dlc: u32) -> Option<Packet> {
        let eligible: Vec<PacketId> = self
            .armed
            .iter()
            .filter(|pid| {
                self.relay_next_slot_class.get(*pid) == Some(&slot_class)
                    && current_dlc >= *self.relay_ready_dlc.get(*pid).unwrap_or(&current_dlc)
            })
            .copied()
            .collect();

        if eligible.is_empty() {
            return None;
        }

        // Deterministic selection: highest priority, then lowest hop count, then lowest ID
        let best_pid = eligible
            .iter()
            .max_by_key(|pid| {
                let stored = self.packet_store.get(*pid);
                let priority = stored
                    .map(|s| s.packet.kind.default_priority())
                    .unwrap_or(0);
                let hop = stored.map(|s| s.packet.hop_count).unwrap_or(255);
                (priority, std::cmp::Reverse(hop), std::cmp::Reverse(**pid))
            })
            .copied()?;

        let stored = self.packet_store.get(&best_pid)?;
        let relay_pkt = stored.packet.clone_for_relay();

        self.armed.remove(&best_pid);
        self.relayed.insert(best_pid);
        self.relay_ready_dlc.remove(&best_pid);

        Some(relay_pkt)
    }

    /// Rebase ToA offsets so each packet group is filtered relative to its own earliest branch.
    fn normalize_group_toa_offsets(signals: &mut [RxSignal]) {
        if let Some(min_toa) = signals
            .iter()
            .map(|s| s.toa_offset_us)
            .min_by(|a, b| a.total_cmp(b))
        {
            for sig in signals {
                sig.toa_offset_us -= min_toa;
            }
        }
    }

    /// Pick a deterministic decoded representative aligned with strongest branch evidence.
    fn best_signal<'a>(signals: &[&'a RxSignal]) -> Option<&'a RxSignal> {
        let branch_sinr = |s: &RxSignal| {
            if s.other_plus_noise_w > 0.0 {
                s.rx_power_w / s.other_plus_noise_w
            } else {
                0.0
            }
        };
        signals.iter().copied().max_by(|a, b| {
            branch_sinr(a)
                .total_cmp(&branch_sinr(b))
                .then_with(|| a.rx_power_w.total_cmp(&b.rx_power_w))
                .then_with(|| a.sinr_db.total_cmp(&b.sinr_db))
                .then_with(|| b.tx_node_id.cmp(&a.tx_node_id))
        })
    }

    /// Handle a successfully decoded packet.
    fn handle_decoded(
        &mut self,
        node: &mut Node,
        pkt: &Packet,
        sinr_db: f64,
        now: SimTime,
        actions: &mut MacActions,
    ) {
        let pid = pkt.id;

        // Emit Rx metric
        actions.push(MacAction::Emit(MetricEvent::Rx {
            time: now,
            node_id: node.id,
            packet_id: pid,
            source_id: pkt.source_id,
            sinr_db,
            success: true,
        }));

        let first_seen = self.seen.insert(pid);
        let media_meta = pkt.media_meta();
        let is_media_frame = media_meta.is_some() && pkt.payload.is_some();
        let should_deliver =
            (pkt.dest_id == Some(node.id) || (is_media_frame && pkt.dest_id.is_none())) && first_seen;

        // Check delivery
        if should_deliver {
            let latency = now - pkt.creation_time;
            actions.push(MacAction::Emit(MetricEvent::Delivery {
                time: now,
                packet_id: pid,
                source_id: pkt.source_id,
                dest_id: node.id,
                latency,
                hop_count: pkt.hop_count,
                control_class: AccessCategory::from_packet_kind(pkt.kind),
                stream_id: media_meta.map(|m| m.stream_id),
                message_id: media_meta.map(|m| m.message_id).or(pkt.message_id),
                frame_index: media_meta.map(|m| m.frame_index).or(pkt.frame_index),
                fragment_index: media_meta.map(|m| m.fragment_index),
                fragment_count: media_meta.map(|m| m.fragment_count),
                media_kind: media_meta.map(|m| m.media_kind),
                payload_len: pkt.payload.as_ref().map(|p| p.len() as u32),
            }));
            if let (Some(meta), Some(payload)) = (media_meta, pkt.payload.as_ref()) {
                actions.push(MacAction::TrackMediaFrame {
                    source_id: pkt.source_id,
                    dest_id: node.id,
                    media: meta,
                    payload: payload.clone(),
                });
            }
        }

        // Arm for relay if not seen before
        if first_seen && !self.relayed.contains(&pid) {
            let dlc_idx = self.global_dlc_index;
            self.packet_ttl
                .insert(pid, dlc_idx + self.config.hop_diameter as u32);

            if pkt.source_id != node.id && pkt.can_relay() {
                let pipeline = u32::from(self.m_pipeline.max(1));
                let next_class = ((dlc_idx + 1) % pipeline) as u8;
                self.relay_next_slot_class.insert(pid, next_class);
                self.relay_ready_dlc.insert(pid, dlc_idx + 1);
                self.armed.insert(pid);
                self.packet_store.insert(
                    pid,
                    StoredPacket {
                        packet: pkt.clone(),
                        _airbits: AirBits::from_seed(&format!("{}:{}", pid, pkt.source_id)),
                        _sidecar: HopSidecar {
                            hop_count: pkt.hop_count,
                            first_rx_time: Some(now),
                            relayed: false,
                        },
                    },
                );
            }
        }
    }
}

impl Mac for TdmaMac {
    fn on_slot_start(
        &mut self,
        node: &mut Node,
        _frame: u32,
        slot: u16,
        role: SlotRole,
        now: SimTime,
        rng: &mut RngStream,
    ) -> MacActions {
        let mut actions = MacActions::new();
        self.current_slot_role = role;

        match role {
            SlotRole::DLC => {
                let dlc_idx = self.global_dlc_index;
                let pipeline = u32::from(self.m_pipeline.max(1));
                let slot_class = (dlc_idx % pipeline) as u8;

                self.gc_expired(dlc_idx);

                // Try origination
                if self.bac.may_originate(node.id, slot, dlc_idx) {
                    if let Some(pkt) = self.try_originate(node, now, rng) {
                        actions.push(MacAction::Transmit { packet: pkt });
                    }
                }

                // If no origination, try relay
                if actions.is_empty() {
                    if let Some(pkt) = self.try_relay(slot_class, dlc_idx) {
                        actions.push(MacAction::Transmit { packet: pkt });
                    }
                }

                self.global_dlc_index += 1;
            }
            SlotRole::RLC => {
                // Telemetry beacon (future)
            }
            SlotRole::CLC => {
                // Controller schedule (future)
            }
        }

        actions
    }

    fn on_rx_packet(
        &mut self,
        node: &mut Node,
        packet: &Packet,
        _sinr_db: f64,
        _rx_power_w: f64,
        _tx_node_id: NodeId,
        now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        let mut actions = MacActions::new();
        self.handle_decoded(node, packet, _sinr_db, now, &mut actions);
        actions
    }

    fn on_rx_batch(
        &mut self,
        node: &mut Node,
        signals: &[RxSignal],
        now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        let mut actions = MacActions::new();

        // Group signals by packet ID (same original = cooperative)
        let mut groups: HashMap<PacketId, Vec<&RxSignal>> = HashMap::new();
        for sig in signals {
            groups.entry(sig.packet.id).or_default().push(sig);
        }

        for (_pid, sigs) in &groups {
            // Guard-time filtering
            let mut owned_sigs: Vec<RxSignal> = sigs.iter().map(|s| (*s).clone()).collect();
            // Pre-normalization check: ToA offsets here are batch-relative to the earliest
            // signal in this RX batch.
            let all_late_batch_relative = owned_sigs
                .iter()
                .all(|s| s.toa_offset_us > self.config.guard_time_us);
            if all_late_batch_relative
                && matches!(self.config.guard_fallback_mode, GuardFallbackMode::Strict)
            {
                continue;
            }
            Self::normalize_group_toa_offsets(&mut owned_sigs);
            let filtered = combining::filter_guard_time(
                &owned_sigs,
                self.config.guard_time_us,
                self.config.guard_fallback_mode,
            );

            // Cooperative combining
            if let Some(combined_db) =
                combining::combine_signals(&filtered, self.config.combining_mode)
            {
                let threshold = self
                    .config
                    .capture_beta_db
                    .for_role(self.current_slot_role);

                if combined_db >= threshold {
                    if let Some(best) = Self::best_signal(&filtered) {
                        self.handle_decoded(node, &best.packet, combined_db, now, &mut actions);
                    }
                }
            }
        }

        actions
    }

    fn on_timer(
        &mut self,
        _node: &mut Node,
        _timer: TimerKind,
        _now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        // TDMA doesn't use MAC-layer timers
        MacActions::new()
    }

    fn on_cca_result(
        &mut self,
        _node: &mut Node,
        _channel_busy: bool,
        _now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        // TDMA doesn't use carrier sensing
        MacActions::new()
    }

    fn queue_length(&self) -> usize {
        self.tx_queue.len()
    }

    fn enqueue(&mut self, packet: Packet, _priority: u8) {
        if self.tx_queue.len() < self.max_queue {
            self.tx_queue.push_back(packet);
        }
    }

    fn apply_local_action(
        &mut self,
        action: &LocalAction,
        _now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        let _ = action;
        MacActions::new()
    }

    fn queue_length_by_access_category(&self) -> AccessCategoryValues<usize> {
        let mut out = AccessCategoryValues::default();
        for packet in &self.tx_queue {
            if let Some(class) = AccessCategory::from_packet_kind(packet.kind) {
                *out.get_mut(class) += 1;
            }
        }
        out
    }

    fn snapshot_mac_counters(&self) -> MacControlCounters {
        MacControlCounters::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::CaptureBeta;
    use crate::node::Vec2;
    use crate::rng::RngContext;

    fn make_data_packet() -> Packet {
        Packet {
            id: 10,
            source_id: 0,
            dest_id: Some(1),
            kind: PacketKind::Data,
            creation_time: SimTime::ZERO,
            payload_bits: 1024,
            payload: None,
            media: None,
            message_id: None,
            frame_index: None,
            hop_count: 0,
            max_hops: 5,
            delivered: false,
            region_id: None,
        }
    }

    fn make_signal(packet: Packet) -> RxSignal {
        RxSignal {
            packet,
            rx_power_w: 10.0,
            sinr_linear: 10.0,
            sinr_db: 10.0,
            preamble_sinr_db: 10.0,
            tx_node_id: 0,
            other_plus_noise_w: 1.0,
            toa_offset_us: 0.0,
            start_offset_us: 0.0,
            overlap_packet_count: 1,
        }
    }

    fn dlc_slot_indices(cfg: &TdmaConfig) -> Vec<u16> {
        cfg.slot_roles
            .iter()
            .enumerate()
            .filter(|(_, role)| **role == SlotRole::DLC)
            .map(|(i, _)| i as u16)
            .collect()
    }

    #[test]
    fn capture_threshold_uses_current_slot_role() {
        let mut cfg = TdmaConfig::default();
        cfg.source_probability = 0.0;
        cfg.capture_beta_db = CaptureBeta {
            rlc_db: 15.0,
            dlc_db: 5.0,
            clc_db: 5.0,
        };
        let dlc_indices = dlc_slot_indices(&cfg);
        let mut mac = TdmaMac::new(cfg, &dlc_indices, 2, true);
        let mut node = Node::new(1, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(7).stream("tdma_role");
        let signal = make_signal(make_data_packet());

        mac.on_slot_start(&mut node, 0, 0, SlotRole::RLC, SimTime::ZERO, &mut rng);
        let rlc_actions = mac.on_rx_batch(
            &mut node,
            std::slice::from_ref(&signal),
            SimTime::from_us(1.0),
            &mut rng,
        );
        assert!(
            !rlc_actions
                .iter()
                .any(|a| matches!(a, MacAction::Emit(MetricEvent::Delivery { .. }))),
            "RLC threshold should reject this packet"
        );

        mac.on_slot_start(&mut node, 0, 1, SlotRole::DLC, SimTime::ZERO, &mut rng);
        let dlc_actions = mac.on_rx_batch(
            &mut node,
            std::slice::from_ref(&signal),
            SimTime::from_us(2.0),
            &mut rng,
        );
        assert!(
            dlc_actions
                .iter()
                .any(|a| matches!(a, MacAction::Emit(MetricEvent::Delivery { .. }))),
            "DLC threshold should decode this packet"
        );
    }

    #[test]
    fn slot_class_modulo_uses_full_dlc_index() {
        let mut cfg = TdmaConfig::default();
        cfg.source_probability = 0.0;
        cfg.m_pipeline = 10;
        let dlc_indices = dlc_slot_indices(&cfg);
        let mut mac = TdmaMac::new(cfg, &dlc_indices, 2, true);
        let mut node = Node::new(1, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(11).stream("tdma_slot_class_mod");

        let mut pkt = make_data_packet();
        pkt.id = 77;
        mac.packet_store.insert(
            pkt.id,
            StoredPacket {
                packet: pkt.clone(),
                _airbits: AirBits::from_seed("77:0"),
                _sidecar: HopSidecar {
                    hop_count: pkt.hop_count,
                    first_rx_time: Some(SimTime::ZERO),
                    relayed: false,
                },
            },
        );
        mac.armed.insert(pkt.id);
        mac.relay_next_slot_class.insert(pkt.id, 0);
        mac.relay_ready_dlc.insert(pkt.id, 0);
        mac.global_dlc_index = 260;

        let actions = mac.on_slot_start(
            &mut node,
            0,
            dlc_indices[0],
            SlotRole::DLC,
            SimTime::ZERO,
            &mut rng,
        );
        assert!(
            actions
                .iter()
                .any(|a| matches!(a, MacAction::Transmit { packet } if packet.id == 77)),
            "DLC class should be computed from full dlc index (260 % 10 = 0)"
        );
    }

    #[test]
    fn guard_time_filter_normalizes_offsets_per_packet_group() {
        let mut cfg = TdmaConfig::default();
        cfg.source_probability = 0.0;
        cfg.guard_time_us = 5.0;
        cfg.capture_beta_db = CaptureBeta {
            rlc_db: 5.0,
            dlc_db: 5.0,
            clc_db: 5.0,
        };
        let dlc_indices = dlc_slot_indices(&cfg);
        let mut mac = TdmaMac::new(cfg, &dlc_indices, 2, true);
        let mut node = Node::new(1, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(17).stream("tdma_guard_norm");

        let mut pkt = make_data_packet();
        pkt.id = 88;
        let mut s1 = make_signal(pkt.clone());
        s1.rx_power_w = 2.0;
        s1.other_plus_noise_w = 1.0; // 3.01 dB branch
        s1.sinr_linear = 2.0;
        s1.sinr_db = 10.0 * s1.sinr_linear.log10();
        s1.toa_offset_us = 100.0;
        s1.tx_node_id = 3;

        let mut s2 = make_signal(pkt);
        s2.rx_power_w = 2.0;
        s2.other_plus_noise_w = 1.0; // 3.01 dB branch, 6.02 dB combined
        s2.sinr_linear = 2.0;
        s2.sinr_db = 10.0 * s2.sinr_linear.log10();
        s2.toa_offset_us = 101.0;
        s2.tx_node_id = 4;

        let actions = mac.on_rx_batch(
            &mut node,
            &[s1, s2],
            SimTime::from_us(1.0),
            &mut rng,
        );
        assert!(
            actions
                .iter()
                .any(|a| matches!(a, MacAction::Emit(MetricEvent::Delivery { packet_id: 88, .. }))),
            "group-local ToA normalization should preserve both branches for combining"
        );
    }

    #[test]
    fn decoded_representative_uses_best_signal_not_first() {
        let mut cfg = TdmaConfig::default();
        cfg.source_probability = 0.0;
        cfg.guard_time_us = 5.0;
        cfg.capture_beta_db = CaptureBeta {
            rlc_db: 5.0,
            dlc_db: 5.0,
            clc_db: 5.0,
        };
        let dlc_indices = dlc_slot_indices(&cfg);
        let mut mac = TdmaMac::new(cfg, &dlc_indices, 2, true);
        let mut node = Node::new(1, Vec2::new(0.0, 0.0));
        let mut rng = RngContext::new(23).stream("tdma_best_signal");

        let mut weak_pkt = make_data_packet();
        weak_pkt.id = 99;
        weak_pkt.hop_count = 3;
        let mut weak = make_signal(weak_pkt);
        weak.rx_power_w = 1.0;
        weak.other_plus_noise_w = 1.0;
        weak.sinr_linear = 1.0;
        weak.sinr_db = 0.0;
        weak.toa_offset_us = 0.0;
        weak.tx_node_id = 8;

        let mut strong_pkt = make_data_packet();
        strong_pkt.id = 99;
        strong_pkt.hop_count = 1;
        let mut strong = make_signal(strong_pkt);
        strong.rx_power_w = 3.0;
        strong.other_plus_noise_w = 1.0;
        strong.sinr_linear = 3.0;
        strong.sinr_db = 10.0 * strong.sinr_linear.log10();
        strong.toa_offset_us = 1.0;
        strong.tx_node_id = 9;

        // Keep weak first to verify representative is no longer insertion-order based.
        let _ = mac.on_rx_batch(
            &mut node,
            &[weak, strong],
            SimTime::from_us(2.0),
            &mut rng,
        );

        let stored = mac.packet_store.get(&99).expect("packet should be armed");
        assert_eq!(
            stored.packet.hop_count, 1,
            "decoded representative should come from strongest signal evidence"
        );
    }

    #[test]
    fn strict_guard_mode_can_drop_group_that_fallback_accepts() {
        let mut strict_cfg = TdmaConfig::default();
        strict_cfg.source_probability = 0.0;
        strict_cfg.guard_time_us = 5.0;
        strict_cfg.guard_fallback_mode = GuardFallbackMode::Strict;
        strict_cfg.capture_beta_db = CaptureBeta {
            rlc_db: 5.0,
            dlc_db: 5.0,
            clc_db: 5.0,
        };
        let mut fallback_cfg = strict_cfg.clone();
        fallback_cfg.guard_fallback_mode = GuardFallbackMode::StrongestFallback;
        let dlc_indices = dlc_slot_indices(&strict_cfg);
        let mut strict_mac = TdmaMac::new(strict_cfg, &dlc_indices, 2, true);
        let mut fallback_mac = TdmaMac::new(fallback_cfg, &dlc_indices, 2, true);
        let mut strict_node = Node::new(1, Vec2::new(0.0, 0.0));
        let mut fallback_node = Node::new(1, Vec2::new(0.0, 0.0));
        let mut strict_rng = RngContext::new(31).stream("tdma_strict_guard");
        let mut fallback_rng = RngContext::new(31).stream("tdma_fallback_guard");

        let mut pkt = make_data_packet();
        pkt.id = 101;
        let mut s1 = make_signal(pkt.clone());
        s1.rx_power_w = 2.0;
        s1.other_plus_noise_w = 1.0;
        s1.sinr_linear = 2.0;
        s1.sinr_db = 10.0 * s1.sinr_linear.log10();
        s1.toa_offset_us = 100.0;
        s1.tx_node_id = 3;

        let mut s2 = make_signal(pkt);
        s2.rx_power_w = 2.0;
        s2.other_plus_noise_w = 1.0;
        s2.sinr_linear = 2.0;
        s2.sinr_db = 10.0 * s2.sinr_linear.log10();
        s2.toa_offset_us = 101.0;
        s2.tx_node_id = 4;

        let strict_actions = strict_mac.on_rx_batch(
            &mut strict_node,
            &[s1.clone(), s2.clone()],
            SimTime::from_us(1.0),
            &mut strict_rng,
        );
        assert!(
            strict_actions
                .iter()
                .all(|a| !matches!(a, MacAction::Emit(MetricEvent::Delivery { packet_id: 101, .. }))),
            "strict mode should reject packets when all batch-relative ToA offsets exceed guard"
        );

        let fallback_actions = fallback_mac.on_rx_batch(
            &mut fallback_node,
            &[s1, s2],
            SimTime::from_us(1.0),
            &mut fallback_rng,
        );
        assert!(
            fallback_actions
                .iter()
                .any(|a| matches!(a, MacAction::Emit(MetricEvent::Delivery { packet_id: 101, .. }))),
            "strongest_fallback mode should still decode this group"
        );
    }

}
