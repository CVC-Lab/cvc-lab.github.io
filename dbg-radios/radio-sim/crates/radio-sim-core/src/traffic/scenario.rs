use std::collections::VecDeque;

use crate::des::{NodeId, PacketId, SimTime};
use crate::packet::{MediaMeta, Packet, PacketKind};
use crate::rng::RngStream;
use crate::voice::scenario::ScheduledVoiceFrame;

use super::generators::TrafficGenerator;

#[derive(Debug, Clone)]
struct PendingFrame {
    emit_time: SimTime,
    sender_id: NodeId,
    dest_id: Option<NodeId>,
    kind: PacketKind,
    media: MediaMeta,
    message_id: u32,
    frame_index: u16,
    payload: std::sync::Arc<Vec<u8>>,
}

/// Scenario-driven traffic generator that emits precomputed voice frames.
#[derive(Debug)]
pub struct ScenarioTraffic {
    pending: VecDeque<PendingFrame>,
    max_hops: u8,
}

impl ScenarioTraffic {
    pub fn new(mut frames: Vec<ScheduledVoiceFrame>, max_hops: u8) -> Self {
        frames.sort_by_key(|f| {
            (
                f.emit_time,
                f.stream_id,
                f.frame_index,
                f.fragment_index,
                f.sender_id,
            )
        });
        let pending = frames
            .into_iter()
            .map(|f| PendingFrame {
                emit_time: f.emit_time,
                sender_id: f.sender_id,
                dest_id: f.dest_id,
                kind: f.kind,
                media: MediaMeta {
                    stream_id: f.stream_id,
                    message_id: f.message_id,
                    frame_index: f.frame_index,
                    fragment_index: f.fragment_index,
                    fragment_count: f.fragment_count,
                    media_kind: f.media_kind,
                },
                message_id: f.message_id,
                frame_index: f.frame_index,
                payload: f.payload,
            })
            .collect();
        ScenarioTraffic { pending, max_hops }
    }
}

impl TrafficGenerator for ScenarioTraffic {
    fn generate(
        &mut self,
        node_id: NodeId,
        now: SimTime,
        next_packet_id: &mut PacketId,
        _num_nodes: u16,
        _rng: &mut RngStream,
    ) -> Option<Packet> {
        let front = self.pending.front()?;
        if now < front.emit_time {
            return None;
        }
        let frame = self.pending.pop_front()?;
        debug_assert_eq!(
            frame.sender_id, node_id,
            "scenario frame scheduled on wrong node"
        );

        let id = *next_packet_id;
        *next_packet_id += 1;
        let payload_bits = (frame.payload.len() * 8) as u32;
        Some(Packet {
            id,
            source_id: frame.sender_id,
            dest_id: frame.dest_id,
            kind: frame.kind,
            creation_time: now,
            payload_bits,
            payload: Some(frame.payload),
            media: Some(frame.media),
            message_id: Some(frame.message_id),
            frame_index: Some(frame.frame_index),
            hop_count: 0,
            max_hops: self.max_hops,
            delivered: false,
            region_id: None,
        })
    }

    fn pending_times(&self) -> Vec<SimTime> {
        self.pending.iter().map(|f| f.emit_time).collect()
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use crate::rng::RngContext;

    use super::*;

    #[test]
    fn emits_frames_in_time_order() {
        let frames = vec![
            ScheduledVoiceFrame {
                emit_time: SimTime::from_ms(40.0),
                sender_id: 0,
                dest_id: None,
                kind: PacketKind::Voice,
                stream_id: 1,
                media_kind: crate::packet::MediaKind::Audio,
                message_id: 1,
                frame_index: 2,
                fragment_index: 0,
                fragment_count: 1,
                payload: Arc::new(vec![2; 8]),
            },
            ScheduledVoiceFrame {
                emit_time: SimTime::from_ms(0.0),
                sender_id: 0,
                dest_id: None,
                kind: PacketKind::Voice,
                stream_id: 1,
                media_kind: crate::packet::MediaKind::Audio,
                message_id: 1,
                frame_index: 0,
                fragment_index: 0,
                fragment_count: 1,
                payload: Arc::new(vec![0; 8]),
            },
            ScheduledVoiceFrame {
                emit_time: SimTime::from_ms(20.0),
                sender_id: 0,
                dest_id: None,
                kind: PacketKind::Voice,
                stream_id: 1,
                media_kind: crate::packet::MediaKind::Audio,
                message_id: 1,
                frame_index: 1,
                fragment_index: 0,
                fragment_count: 1,
                payload: Arc::new(vec![1; 8]),
            },
        ];
        let mut gen = ScenarioTraffic::new(frames, 1);
        let mut next_id = 1;
        let mut rng = RngContext::new(1).stream("scenario_gen_test");

        let t0 = gen.generate(0, SimTime::from_ms(0.0), &mut next_id, 2, &mut rng).unwrap();
        let t1 = gen.generate(0, SimTime::from_ms(20.0), &mut next_id, 2, &mut rng).unwrap();
        let t2 = gen.generate(0, SimTime::from_ms(40.0), &mut next_id, 2, &mut rng).unwrap();
        assert_eq!(t0.frame_index, Some(0));
        assert_eq!(t1.frame_index, Some(1));
        assert_eq!(t2.frame_index, Some(2));
    }
}
