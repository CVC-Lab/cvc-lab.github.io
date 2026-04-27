use std::sync::Arc;

use hashbrown::HashSet;
use serde::Serialize;

use crate::des::SimTime;
use crate::des::PacketId;
use crate::mac::MetricEvent;
use crate::packet::{MediaKind, MediaMeta};

use super::events::SimEvent;
use super::media::{MediaDropReason, MediaStreamResult, MediaTracker};
use super::voice::{VoiceDropReason, VoiceMessageResult, VoiceTracker};

/// Collects metrics during a simulation run.
#[derive(Debug)]
pub struct MetricsCollector {
    events: Vec<SimEvent>,
    packets_sent: u64,
    packets_delivered: u64,
    delivery_events: u64,
    packets_dropped: u64,
    collisions: u64,
    latencies_ns: Vec<u64>,
    sent_ids: HashSet<PacketId>,
    delivered_ids: HashSet<PacketId>,
    media: MediaTracker,
    voice: VoiceTracker,
}

impl MetricsCollector {
    pub fn new() -> Self {
        MetricsCollector {
            events: Vec::new(),
            packets_sent: 0,
            packets_delivered: 0,
            delivery_events: 0,
            packets_dropped: 0,
            collisions: 0,
            latencies_ns: Vec::new(),
            sent_ids: HashSet::new(),
            delivered_ids: HashSet::new(),
            media: MediaTracker::default(),
            voice: VoiceTracker::default(),
        }
    }

    /// Record a metric event from a MAC handler.
    pub fn record(&mut self, event: MetricEvent) {
        match &event {
            MetricEvent::TxStart {
                time,
                node_id,
                packet_id,
                kind,
                hop_count,
                payload_bits,
            } => {
                if *kind != "ack" && self.sent_ids.insert(*packet_id) {
                    self.packets_sent += 1;
                }
                self.events.push(SimEvent::TxStart {
                    time_ns: time.as_ns(),
                    node_id: *node_id,
                    packet_id: *packet_id,
                    kind: kind.to_string(),
                    hop_count: *hop_count,
                    payload_bits: *payload_bits,
                });
            }
            MetricEvent::TxEnd {
                time,
                node_id,
                packet_id,
                success,
            } => {
                self.events.push(SimEvent::TxEnd {
                    time_ns: time.as_ns(),
                    node_id: *node_id,
                    packet_id: *packet_id,
                    success: *success,
                });
            }
            MetricEvent::Rx {
                time,
                node_id,
                packet_id,
                source_id,
                sinr_db,
                ..
            } => {
                self.events.push(SimEvent::Rx {
                    time_ns: time.as_ns(),
                    node_id: *node_id,
                    packet_id: *packet_id,
                    source_id: *source_id,
                    sinr_db: *sinr_db,
                });
            }
            MetricEvent::Delivery {
                time,
                packet_id,
                source_id,
                dest_id,
                latency,
                hop_count,
                control_class: _,
                stream_id,
                message_id,
                frame_index,
                fragment_index,
                fragment_count,
                media_kind,
                payload_len,
            } => {
                self.delivery_events += 1;
                if self.delivered_ids.insert(*packet_id) {
                    self.packets_delivered += 1;
                    self.latencies_ns.push(latency.as_ns());
                }
                self.events.push(SimEvent::Delivery {
                    time_ns: time.as_ns(),
                    packet_id: *packet_id,
                    source_id: *source_id,
                    dest_id: *dest_id,
                    latency_ns: latency.as_ns(),
                    hop_count: *hop_count,
                    stream_id: *stream_id,
                    message_id: *message_id,
                    frame_index: *frame_index,
                    fragment_index: *fragment_index,
                    fragment_count: *fragment_count,
                    media_kind: *media_kind,
                    payload_len: *payload_len,
                });
            }
            MetricEvent::Drop {
                time,
                node_id,
                packet_id,
                reason,
            } => {
                self.packets_dropped += 1;
                self.events.push(SimEvent::Drop {
                    time_ns: time.as_ns(),
                    node_id: *node_id,
                    packet_id: *packet_id,
                    reason: reason.to_string(),
                });
            }
            MetricEvent::Collision { time, node_id } => {
                self.collisions += 1;
                self.events.push(SimEvent::Collision {
                    time_ns: time.as_ns(),
                    node_id: *node_id,
                });
            }
        }
    }

    /// Compute summary statistics.
    pub fn summary(&self) -> SimSummary {
        let mut sorted = self.latencies_ns.clone();
        sorted.sort_unstable();

        let avg = if sorted.is_empty() {
            0.0
        } else {
            sorted.iter().sum::<u64>() as f64 / sorted.len() as f64
        };

        let median = if sorted.is_empty() {
            0.0
        } else {
            sorted[sorted.len() / 2] as f64
        };

        let p95 = if sorted.is_empty() {
            0.0
        } else {
            sorted[((sorted.len() as f64 * 0.95) as usize).min(sorted.len() - 1)] as f64
        };

        // Sender-confirmed semantics: any packet with at least one receiver Delivery
        // is considered confirmed, even if a prior retransmission emitted Drop.
        let sender_confirmed = self.delivered_ids.len() as u64;
        let packets_failed = (self.sent_ids.len() as u64).saturating_sub(sender_confirmed);
        let pdr_sender_confirmed = if self.packets_sent > 0 {
            sender_confirmed as f64 / self.packets_sent as f64
        } else {
            0.0
        };
        let pdr_receiver_unique = if self.packets_sent > 0 {
            self.packets_delivered as f64 / self.packets_sent as f64
        } else {
            0.0
        };
        let pdr_receiver_pairwise = if self.packets_sent > 0 {
            self.delivery_events as f64 / self.packets_sent as f64
        } else {
            0.0
        };

        SimSummary {
            packets_sent: self.packets_sent,
            packets_delivered: self.packets_delivered,
            packets_dropped: self.packets_dropped,
            drop_events: self.packets_dropped,
            packets_failed,
            pdr: pdr_sender_confirmed,
            pdr_sender_confirmed,
            pdr_receiver_unique,
            pdr_receiver_pairwise,
            avg_latency_ns: avg,
            median_latency_ns: median,
            p95_latency_ns: p95,
            collisions: self.collisions,
        }
    }

    pub fn events(&self) -> &[SimEvent] {
        &self.events
    }

    pub fn latencies_ns(&self) -> &[u64] {
        &self.latencies_ns
    }

    pub fn set_num_nodes(&mut self, num_nodes: u16) {
        self.media.set_num_nodes(num_nodes);
        self.voice.set_num_nodes(num_nodes);
    }

    pub fn seed_voice_messages(&mut self, entries: &[(u16, u32, u16, u64)]) {
        self.voice.seed_messages(entries);
        let media_entries: Vec<(u16, u32, MediaKind, u16, u64)> = entries
            .iter()
            .map(|(sender, message_id, total_frames, window_end_ns)| {
                (
                    *sender,
                    *message_id,
                    MediaKind::Audio,
                    *total_frames,
                    *window_end_ns,
                )
            })
            .collect();
        self.media.seed_streams(&media_entries);
    }

    pub fn seed_media_streams(&mut self, entries: &[(u16, u32, MediaKind, Vec<u16>, u64)]) {
        self.media.seed_streams_with_indices(entries);
    }

    pub fn seed_media_frame_deadlines(
        &mut self,
        entries: &[(u16, u32, MediaKind, u16, u64)],
    ) {
        self.media.seed_frame_deadlines(entries);
    }

    pub fn record_voice_frame(
        &mut self,
        sender_id: u16,
        receiver_id: u16,
        message_id: u32,
        frame_index: u16,
        payload: Arc<Vec<u8>>,
        delivery_time: SimTime,
    ) {
        let payload_for_voice = payload.clone();
        self.voice.record_delivery(
            sender_id,
            receiver_id,
            message_id,
            frame_index,
            payload_for_voice,
            delivery_time.as_ns(),
        );
        self.media.record_delivery(
            sender_id,
            receiver_id,
            MediaMeta {
                stream_id: message_id,
                message_id,
                frame_index,
                fragment_index: 0,
                fragment_count: 1,
                media_kind: MediaKind::Audio,
            },
            payload,
            delivery_time.as_ns(),
        );
    }

    pub fn record_media_frame(
        &mut self,
        sender_id: u16,
        receiver_id: u16,
        media: MediaMeta,
        payload: Arc<Vec<u8>>,
        delivery_time: SimTime,
    ) {
        self.media
            .record_delivery(sender_id, receiver_id, media, payload.clone(), delivery_time.as_ns());
        if media.media_kind == MediaKind::Audio {
            self.voice.record_delivery(
                sender_id,
                receiver_id,
                media.message_id,
                media.frame_index,
                payload,
                delivery_time.as_ns(),
            );
        }
    }

    pub fn record_voice_drop(
        &mut self,
        sender_id: u16,
        message_id: u32,
        frame_index: Option<u16>,
        reason: VoiceDropReason,
    ) {
        self.voice.record_drop(sender_id, None, message_id, reason);
        let media_reason = match reason {
            VoiceDropReason::QueueFull => MediaDropReason::QueueFull,
            VoiceDropReason::Late => MediaDropReason::Late,
        };
        self.media.record_drop(
            sender_id,
            None,
            message_id,
            MediaKind::Audio,
            frame_index,
            media_reason,
        );
    }

    pub fn record_media_drop(
        &mut self,
        sender_id: u16,
        stream_id: u32,
        media_kind: MediaKind,
        frame_index: Option<u16>,
        reason: MediaDropReason,
    ) {
        self.media
            .record_drop(sender_id, None, stream_id, media_kind, frame_index, reason);
        if media_kind == MediaKind::Audio {
            let voice_reason = match reason {
                MediaDropReason::QueueFull => VoiceDropReason::QueueFull,
                MediaDropReason::Late => VoiceDropReason::Late,
            };
            self.voice.record_drop(sender_id, None, stream_id, voice_reason);
        }
    }

    pub fn voice_results(&self) -> Vec<VoiceMessageResult> {
        self.voice.results()
    }

    pub fn media_results(&self) -> Vec<MediaStreamResult> {
        self.media.results()
    }
}

impl Default for MetricsCollector {
    fn default() -> Self {
        Self::new()
    }
}

/// Summary statistics from a simulation run.
#[derive(Debug, Clone, Serialize)]
pub struct SimSummary {
    /// Unique non-ACK packet IDs with at least one TxStart event.
    pub packets_sent: u64,
    /// Unique packet IDs with at least one Delivery event.
    pub packets_delivered: u64,
    /// Total Drop events (includes retries and packets that later delivered).
    pub packets_dropped: u64,
    /// Same as packets_dropped (alias for clarity).
    pub drop_events: u64,
    /// Unique packets that are not sender-confirmed.
    /// Sender-confirmed = delivered at least once.
    pub packets_failed: u64,
    /// Sender-confirmed delivery ratio = confirmed / packets_sent.
    pub pdr: f64,
    /// Sender-confirmed delivery ratio = confirmed / packets_sent.
    pub pdr_sender_confirmed: f64,
    /// Unique receiver-side delivery ratio = unique delivered packet IDs / packets_sent.
    pub pdr_receiver_unique: f64,
    /// Pairwise delivery ratio = total Delivery events / packets_sent.
    /// This may exceed 1.0 for broadcast or multicast fanout.
    pub pdr_receiver_pairwise: f64,
    pub avg_latency_ns: f64,
    pub median_latency_ns: f64,
    pub p95_latency_ns: f64,
    pub collisions: u64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::des::SimTime;
    use crate::mac::MetricEvent;

    fn tx_start(packet_id: PacketId) -> MetricEvent {
        MetricEvent::TxStart {
            time: SimTime::ZERO,
            node_id: 0,
            packet_id,
            kind: "data",
            hop_count: 0,
            payload_bits: 1024,
        }
    }

    fn delivery(packet_id: PacketId) -> MetricEvent {
        MetricEvent::Delivery {
            time: SimTime::from_us(100.0),
            packet_id,
            source_id: 0,
            dest_id: 1,
            latency: SimTime::from_us(100.0),
            hop_count: 1,
            control_class: None,
            stream_id: None,
            message_id: None,
            frame_index: None,
            fragment_index: None,
            fragment_count: None,
            media_kind: None,
            payload_len: None,
        }
    }

    fn drop(packet_id: PacketId) -> MetricEvent {
        MetricEvent::Drop {
            time: SimTime::from_us(50.0),
            node_id: 0,
            packet_id,
            reason: "ack_timeout",
        }
    }

    #[test]
    fn sender_confirmed_semantics_count_delivered_even_with_prior_drop() {
        let mut metrics = MetricsCollector::new();
        metrics.record(tx_start(1));
        metrics.record(delivery(1));
        metrics.record(drop(1));
        metrics.record(tx_start(2));
        metrics.record(delivery(2));

        let summary = metrics.summary();
        assert_eq!(summary.packets_sent, 2);
        assert_eq!(summary.packets_delivered, 2);
        assert_eq!(summary.packets_dropped, 1);
        assert_eq!(summary.drop_events, 1);
        assert_eq!(summary.packets_failed, 0);
        assert!(
            (summary.pdr - 1.0).abs() < 1e-12,
            "sender-confirmed pdr should be 1.0 when all packets eventually deliver, got {}",
            summary.pdr
        );
        assert!((summary.pdr_sender_confirmed - summary.pdr).abs() < 1e-12);
    }
}
