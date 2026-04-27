use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::des::{NodeId, PacketId, SimTime};

/// Packet types in the simulation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PacketKind {
    Data,
    Ack,
    Telemetry,
    Voice,
    Video,
    Command,
    Bulk,
    // CBR control
    Brq,
    Bex,
    Bsc,
}

impl PacketKind {
    pub fn is_control(&self) -> bool {
        matches!(self, PacketKind::Brq | PacketKind::Bex | PacketKind::Bsc)
    }

    pub fn default_priority(&self) -> u8 {
        match self {
            PacketKind::Ack => 5,
            PacketKind::Command => 4,
            PacketKind::Voice | PacketKind::Brq | PacketKind::Bex | PacketKind::Bsc => 3,
            PacketKind::Video => 2,
            PacketKind::Telemetry | PacketKind::Data => 1,
            PacketKind::Bulk => 0,
        }
    }
}

/// Media classification used by application-level framing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MediaKind {
    Audio,
    Video,
}

/// Optional media metadata for frame/fragment-aware delivery tracking.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct MediaMeta {
    pub stream_id: u32,
    pub message_id: u32,
    pub frame_index: u16,
    pub fragment_index: u16,
    pub fragment_count: u16,
    pub media_kind: MediaKind,
}

/// A network packet.
#[derive(Debug, Clone)]
pub struct Packet {
    pub id: PacketId,
    pub source_id: NodeId,
    /// None = broadcast.
    pub dest_id: Option<NodeId>,
    pub kind: PacketKind,
    pub creation_time: SimTime,
    pub payload_bits: u32,
    /// Optional frame payload bytes.
    pub payload: Option<Arc<Vec<u8>>>,
    /// Optional media metadata (audio/video frame/fragment identity).
    pub media: Option<MediaMeta>,
    /// Optional voice/message grouping identifier.
    pub message_id: Option<u32>,
    /// Optional frame index within a message.
    pub frame_index: Option<u16>,
    pub hop_count: u8,
    pub max_hops: u8,
    pub delivered: bool,
    /// CBR region ID if applicable.
    pub region_id: Option<u32>,
}

impl Packet {
    pub fn is_broadcast(&self) -> bool {
        self.dest_id.is_none()
    }

    pub fn can_relay(&self) -> bool {
        self.hop_count < self.max_hops
    }

    /// Create a copy for relaying with incremented hop count.
    pub fn clone_for_relay(&self) -> Self {
        let mut cloned = self.clone();
        cloned.hop_count += 1;
        cloned
    }

    /// Resolve media metadata from explicit media field or legacy voice fields.
    pub fn media_meta(&self) -> Option<MediaMeta> {
        if let Some(meta) = self.media {
            return Some(meta);
        }
        let message_id = self.message_id?;
        let frame_index = self.frame_index?;
        let media_kind = match self.kind {
            PacketKind::Voice => MediaKind::Audio,
            PacketKind::Video => MediaKind::Video,
            _ => return None,
        };
        Some(MediaMeta {
            stream_id: message_id,
            message_id,
            frame_index,
            fragment_index: 0,
            fragment_count: 1,
            media_kind,
        })
    }

    pub fn acked_packet_id(&self) -> Option<PacketId> {
        if self.kind != PacketKind::Ack {
            return None;
        }
        let payload = self.payload.as_ref()?;
        if payload.len() != std::mem::size_of::<PacketId>() {
            return None;
        }
        let mut bytes = [0u8; std::mem::size_of::<PacketId>()];
        bytes.copy_from_slice(payload.as_ref());
        Some(u64::from_le_bytes(bytes))
    }

    /// Create an ACK packet.
    pub fn new_ack(
        source_id: NodeId,
        dest_id: NodeId,
        acked_packet_id: PacketId,
        now: SimTime,
        ack_bits: u32,
    ) -> Self {
        Packet {
            id: 0, // will be assigned by simulation
            source_id,
            dest_id: Some(dest_id),
            kind: PacketKind::Ack,
            creation_time: now,
            payload_bits: ack_bits,
            payload: Some(Arc::new(acked_packet_id.to_le_bytes().to_vec())),
            media: None,
            message_id: None,
            frame_index: None,
            hop_count: 0,
            max_hops: 1,
            delivered: false,
            region_id: None,
        }
    }
}
