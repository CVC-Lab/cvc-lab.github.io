use std::sync::Arc;

use hashbrown::HashMap;

use crate::des::NodeId;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum VoiceDropReason {
    QueueFull,
    Late,
}

#[derive(Debug, Clone)]
pub struct VoiceMessageResult {
    pub message_id: u32,
    pub sender_id: NodeId,
    pub receiver_id: NodeId,
    pub total_frames: u16,
    pub frames_received: Vec<bool>,
    pub frame_payloads: Vec<Option<Arc<Vec<u8>>>>,
    pub frames_queue_dropped: u16,
    pub frames_late_dropped: u16,
    pub pdr: f64,
}

#[derive(Debug, Default)]
pub struct VoiceTracker {
    num_nodes: Option<u16>,
    expected_frames: HashMap<(NodeId, u32), ExpectedMessage>,
    received_payloads: HashMap<(NodeId, NodeId, u32, u16), Arc<Vec<u8>>>,
    queue_drops: HashMap<(NodeId, u32), u16>,
    late_drops: HashMap<(NodeId, NodeId, u32), u16>,
}

#[derive(Debug, Clone, Copy)]
struct ExpectedMessage {
    total_frames: u16,
    window_end_ns: u64,
}

impl VoiceTracker {
    pub fn set_num_nodes(&mut self, num_nodes: u16) {
        self.num_nodes = Some(num_nodes);
    }

    pub fn seed_message(
        &mut self,
        sender_id: NodeId,
        message_id: u32,
        total_frames: u16,
        window_end_ns: u64,
    ) {
        self.expected_frames
            .insert((sender_id, message_id), ExpectedMessage { total_frames, window_end_ns });
    }

    pub fn seed_messages(&mut self, entries: &[(NodeId, u32, u16, u64)]) {
        for (sender_id, message_id, total_frames, window_end_ns) in entries {
            self.seed_message(*sender_id, *message_id, *total_frames, *window_end_ns);
        }
    }

    pub fn record_delivery(
        &mut self,
        sender_id: NodeId,
        receiver_id: NodeId,
        message_id: u32,
        frame_index: u16,
        payload: Arc<Vec<u8>>,
        delivery_time_ns: u64,
    ) {
        if let Some(expected) = self.expected_frames.get(&(sender_id, message_id)) {
            if delivery_time_ns > expected.window_end_ns {
                *self
                    .late_drops
                    .entry((receiver_id, sender_id, message_id))
                    .or_insert(0) += 1;
                return;
            }
        }
        self.received_payloads
            .entry((receiver_id, sender_id, message_id, frame_index))
            .or_insert(payload);
    }

    pub fn record_drop(
        &mut self,
        sender_id: NodeId,
        receiver_id: Option<NodeId>,
        message_id: u32,
        reason: VoiceDropReason,
    ) {
        let map = match reason {
            VoiceDropReason::QueueFull => &mut self.queue_drops,
            VoiceDropReason::Late => {
                if let Some(receiver_id) = receiver_id {
                    *self
                        .late_drops
                        .entry((receiver_id, sender_id, message_id))
                        .or_insert(0) += 1;
                }
                return;
            }
        };
        *map.entry((sender_id, message_id)).or_insert(0) += 1;
    }

    pub fn results(&self) -> Vec<VoiceMessageResult> {
        let mut out = Vec::new();
        for (&(sender_id, message_id), expected) in &self.expected_frames {
            let total_frames = expected.total_frames;
            let receivers: Vec<NodeId> = if let Some(num_nodes) = self.num_nodes {
                (0..num_nodes).filter(|id| *id != sender_id).collect()
            } else {
                let mut recv: Vec<NodeId> = self
                    .received_payloads
                    .keys()
                    .filter_map(|(receiver_id, s, m, _)| {
                        if *s == sender_id && *m == message_id {
                            Some(*receiver_id)
                        } else {
                            None
                        }
                    })
                    .collect();
                recv.sort_unstable();
                recv.dedup();
                recv
            };

            for receiver_id in receivers {
                let mut frames_received = vec![false; total_frames as usize];
                let mut frame_payloads = vec![None; total_frames as usize];
                for frame in 0..total_frames {
                    if let Some(payload) = self
                        .received_payloads
                        .get(&(receiver_id, sender_id, message_id, frame))
                    {
                        frames_received[frame as usize] = true;
                        frame_payloads[frame as usize] = Some(payload.clone());
                    }
                }
                let received_count = frames_received.iter().filter(|r| **r).count() as u16;
                let pdr = if total_frames > 0 {
                    received_count as f64 / total_frames as f64
                } else {
                    0.0
                };
                out.push(VoiceMessageResult {
                    message_id,
                    sender_id,
                    receiver_id,
                    total_frames,
                    frames_received,
                    frame_payloads,
                    frames_queue_dropped: *self.queue_drops.get(&(sender_id, message_id)).unwrap_or(&0),
                    frames_late_dropped: *self
                        .late_drops
                        .get(&(receiver_id, sender_id, message_id))
                        .unwrap_or(&0),
                    pdr,
                });
            }
        }
        out.sort_by_key(|r| (r.sender_id, r.message_id, r.receiver_id));
        out
    }
}
