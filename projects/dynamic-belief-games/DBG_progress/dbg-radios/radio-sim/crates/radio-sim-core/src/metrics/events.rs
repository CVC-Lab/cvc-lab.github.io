use serde::Serialize;

use crate::des::{NodeId, PacketId};
use crate::packet::MediaKind;

/// Telemetry event recorded during simulation.
#[derive(Debug, Clone, Serialize)]
pub enum SimEvent {
    TxStart {
        time_ns: u64,
        node_id: NodeId,
        packet_id: PacketId,
        kind: String,
        hop_count: u8,
        payload_bits: u32,
    },
    TxEnd {
        time_ns: u64,
        node_id: NodeId,
        packet_id: PacketId,
        success: bool,
    },
    Rx {
        time_ns: u64,
        node_id: NodeId,
        packet_id: PacketId,
        source_id: NodeId,
        sinr_db: f64,
    },
    Delivery {
        time_ns: u64,
        packet_id: PacketId,
        source_id: NodeId,
        dest_id: NodeId,
        latency_ns: u64,
        hop_count: u8,
        stream_id: Option<u32>,
        message_id: Option<u32>,
        frame_index: Option<u16>,
        fragment_index: Option<u16>,
        fragment_count: Option<u16>,
        media_kind: Option<MediaKind>,
        payload_len: Option<u32>,
    },
    Drop {
        time_ns: u64,
        node_id: NodeId,
        packet_id: PacketId,
        reason: String,
    },
    Collision {
        time_ns: u64,
        node_id: NodeId,
    },
}
