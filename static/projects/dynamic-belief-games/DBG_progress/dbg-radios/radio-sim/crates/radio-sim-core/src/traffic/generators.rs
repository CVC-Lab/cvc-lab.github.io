use crate::config::TrafficClassMix;
use crate::des::{NodeId, PacketId, SimTime};
use crate::packet::{Packet, PacketKind};
use crate::rng::RngStream;

/// Traffic generator that produces packets at each slot opportunity.
pub trait TrafficGenerator: std::fmt::Debug + Send + Sync {
    /// Attempt to generate a packet at the current time.
    fn generate(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        next_packet_id: &mut PacketId,
        num_nodes: u16,
        rng: &mut RngStream,
    ) -> Option<Packet>;

    /// Optional exact emission times used by scenario-based traffic.
    fn pending_times(&self) -> Vec<SimTime> {
        Vec::new()
    }
}

/// Bernoulli traffic: each slot has independent probability of generating a packet.
#[derive(Debug)]
pub struct BernoulliTraffic {
    pub source_probability: f64,
    pub broadcast_probability: f64,
    pub packet_bits: u32,
    pub max_hops: u8,
    pub class_mix: TrafficClassMix,
}

impl TrafficGenerator for BernoulliTraffic {
    fn generate(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        next_packet_id: &mut PacketId,
        num_nodes: u16,
        rng: &mut RngStream,
    ) -> Option<Packet> {
        if !rng.gen_bool(self.source_probability) {
            return None;
        }

        let dest = if rng.gen_bool(self.broadcast_probability) {
            None
        } else {
            // Pick random destination excluding self
            let candidates: Vec<NodeId> = (0..num_nodes).filter(|&n| n != node_id).collect();
            rng.choice(&candidates)
        };

        let id = *next_packet_id;
        *next_packet_id += 1;
        let kind = sample_packet_kind(&self.class_mix, rng);

        Some(Packet {
            id,
            source_id: node_id,
            dest_id: dest,
            kind,
            creation_time: now,
            payload_bits: self.packet_bits,
            payload: None,
            media: None,
            message_id: None,
            frame_index: None,
            hop_count: 0,
            max_hops: self.max_hops,
            delivered: false,
            region_id: None,
        })
    }
}

/// Poisson traffic: average rate packets per slot.
#[derive(Debug)]
pub struct PoissonTraffic {
    pub rate_per_slot: f64,
    pub broadcast_probability: f64,
    pub packet_bits: u32,
    pub max_hops: u8,
    pub class_mix: TrafficClassMix,
}

impl TrafficGenerator for PoissonTraffic {
    fn generate(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        next_packet_id: &mut PacketId,
        num_nodes: u16,
        rng: &mut RngStream,
    ) -> Option<Packet> {
        // Poisson with small rate approximated as Bernoulli per slot
        if !rng.gen_bool(self.rate_per_slot.min(1.0)) {
            return None;
        }

        let dest = if rng.gen_bool(self.broadcast_probability) {
            None
        } else {
            let candidates: Vec<NodeId> = (0..num_nodes).filter(|&n| n != node_id).collect();
            rng.choice(&candidates)
        };

        let id = *next_packet_id;
        *next_packet_id += 1;
        let kind = sample_packet_kind(&self.class_mix, rng);

        Some(Packet {
            id,
            source_id: node_id,
            dest_id: dest,
            kind,
            creation_time: now,
            payload_bits: self.packet_bits,
            payload: None,
            media: None,
            message_id: None,
            frame_index: None,
            hop_count: 0,
            max_hops: self.max_hops,
            delivered: false,
            region_id: None,
        })
    }
}

fn sample_packet_kind(class_mix: &TrafficClassMix, rng: &mut RngStream) -> PacketKind {
    let command = class_mix.command.max(0.0);
    let voice = class_mix.voice.max(0.0);
    let best = class_mix.best_effort.max(0.0);
    let total = command + voice + best;
    if total <= 0.0 {
        return PacketKind::Data;
    }
    let u = rng.gen_float() * total;
    if u < command {
        PacketKind::Command
    } else if u < command + voice {
        PacketKind::Voice
    } else {
        PacketKind::Data
    }
}
