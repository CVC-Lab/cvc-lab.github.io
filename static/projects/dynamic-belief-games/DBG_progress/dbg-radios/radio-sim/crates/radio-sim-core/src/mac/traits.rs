use std::sync::Arc;

use smallvec::SmallVec;

use crate::control::{
    AccessCategory, AccessCategoryRuntimeSnapshot, AccessCategoryValues, ActionOutcomeCounters,
    LocalAction, MacControlCounters,
};
use crate::des::{EventKind, NodeId, PacketId, SimTime, SlotRole};
use crate::node::Node;
use crate::packet::{MediaKind, MediaMeta, Packet};
use crate::phy::channel::RxSignal;
use crate::rng::RngStream;

/// Metric events emitted by MAC layer handlers.
#[derive(Debug, Clone)]
pub enum MetricEvent {
    TxStart {
        time: SimTime,
        node_id: NodeId,
        packet_id: PacketId,
        kind: &'static str,
        hop_count: u8,
        payload_bits: u32,
    },
    TxEnd {
        time: SimTime,
        node_id: NodeId,
        packet_id: PacketId,
        success: bool,
    },
    Rx {
        time: SimTime,
        node_id: NodeId,
        packet_id: PacketId,
        source_id: NodeId,
        sinr_db: f64,
        success: bool,
    },
    Delivery {
        time: SimTime,
        packet_id: PacketId,
        source_id: NodeId,
        dest_id: NodeId,
        latency: SimTime,
        hop_count: u8,
        control_class: Option<AccessCategory>,
        stream_id: Option<u32>,
        message_id: Option<u32>,
        frame_index: Option<u16>,
        fragment_index: Option<u16>,
        fragment_count: Option<u16>,
        media_kind: Option<MediaKind>,
        payload_len: Option<u32>,
    },
    Drop {
        time: SimTime,
        node_id: NodeId,
        packet_id: PacketId,
        reason: &'static str,
    },
    Collision {
        time: SimTime,
        node_id: NodeId,
    },
}

/// Actions a MAC handler can request from the simulation engine.
#[derive(Debug)]
pub enum MacAction {
    /// Transmit a packet now.
    Transmit { packet: Packet },
    /// Schedule a future event.
    ScheduleEvent {
        delay: SimTime,
        priority: i8,
        kind: EventKind,
    },
    /// Cancel pending events matching a node + type.
    CancelAckTimeout { node_id: NodeId },
    /// Record a metric.
    Emit(MetricEvent),
    /// Track delivered media payload bytes outside the event stream.
    TrackMediaFrame {
        source_id: NodeId,
        dest_id: NodeId,
        media: MediaMeta,
        payload: Arc<Vec<u8>>,
    },
}

/// Collected actions from a single MAC event handler invocation.
pub type MacActions = SmallVec<[MacAction; 4]>;

/// Timer kinds for the MAC layer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TimerKind {
    DifsExpired,
    SifsExpired,
    BackoffTick,
    AckTimeout { packet_id: PacketId },
    TxComplete {
        packet_id: PacketId,
        ack_timeout_delay: Option<SimTime>,
    },
}

/// The MAC protocol trait. Both TDMA and CSMA implement this.
pub trait Mac: std::fmt::Debug + Send + Sync {
    /// Handle a TDMA slot boundary.
    fn on_slot_start(
        &mut self,
        node: &mut Node,
        frame: u32,
        slot: u16,
        role: SlotRole,
        now: SimTime,
        rng: &mut RngStream,
    ) -> MacActions;

    /// Handle a single received packet from PHY.
    fn on_rx_packet(
        &mut self,
        node: &mut Node,
        packet: &Packet,
        sinr_db: f64,
        rx_power_w: f64,
        tx_node_id: NodeId,
        now: SimTime,
        rng: &mut RngStream,
    ) -> MacActions;

    /// Handle a batch of simultaneous receptions (for combining/collision detection).
    fn on_rx_batch(
        &mut self,
        node: &mut Node,
        signals: &[RxSignal],
        now: SimTime,
        rng: &mut RngStream,
    ) -> MacActions;

    /// Handle a MAC-layer timer expiration.
    fn on_timer(
        &mut self,
        node: &mut Node,
        timer: TimerKind,
        now: SimTime,
        rng: &mut RngStream,
    ) -> MacActions;

    /// Handle carrier sense result (CSMA).
    fn on_cca_result(
        &mut self,
        node: &mut Node,
        channel_busy: bool,
        now: SimTime,
        rng: &mut RngStream,
    ) -> MacActions;

    /// Handle an instantaneous medium state transition without sampling telemetry.
    fn on_medium_state_change(
        &mut self,
        _node: &mut Node,
        _channel_busy: bool,
        _now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        MacActions::new()
    }

    /// Handle a newly enqueued packet entering the MAC at runtime.
    fn on_enqueue(
        &mut self,
        _node: &mut Node,
        _now: SimTime,
        _channel_busy: bool,
        _rng: &mut RngStream,
    ) -> MacActions {
        MacActions::new()
    }

    /// Number of packets queued for transmission.
    fn queue_length(&self) -> usize;

    /// Enqueue a packet from the upper layer.
    fn enqueue(&mut self, packet: Packet, priority: u8);

    /// Apply local PIN-agent action on this node's MAC behavior. May mutate
    /// per-AC parameters, manipulate the queue, or update admission/stream
    /// state. Returns any metric events to emit (e.g., drops from purges).
    fn apply_local_action(
        &mut self,
        _action: &LocalAction,
        _now: SimTime,
        _rng: &mut RngStream,
    ) -> MacActions {
        MacActions::new()
    }

    /// Queue length split by access category [vo, vi, be, bk].
    fn queue_length_by_access_category(&self) -> AccessCategoryValues<usize> {
        AccessCategoryValues::new(0, 0, self.queue_length(), 0)
    }

    /// Instantaneous EDCA state for overlay observations.
    fn snapshot_access_state(&self, _now: SimTime) -> AccessCategoryRuntimeSnapshot {
        AccessCategoryRuntimeSnapshot::default()
    }

    /// Cumulative counters for local PIN observations.
    fn snapshot_mac_counters(&self) -> MacControlCounters {
        MacControlCounters::default()
    }

    /// Cumulative counts of how many times each control-action axis has fired
    /// since the MAC was created. The runner takes interval deltas of this
    /// snapshot for the agent's per-step `action_outcomes` observation.
    fn snapshot_action_outcomes(&self) -> ActionOutcomeCounters {
        ActionOutcomeCounters::default()
    }

    /// Stream IDs that currently have at least one queued packet at this node.
    fn snapshot_streams_present(&self) -> Vec<u32> {
        Vec::new()
    }
}
