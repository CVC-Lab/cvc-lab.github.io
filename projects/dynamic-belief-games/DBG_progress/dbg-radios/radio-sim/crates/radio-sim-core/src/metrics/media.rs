use std::sync::Arc;

use hashbrown::{HashMap, HashSet};

use crate::des::NodeId;
use crate::packet::{MediaKind, MediaMeta};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum MediaDropReason {
    QueueFull,
    Late,
}

#[derive(Debug, Clone)]
pub struct MediaStreamResult {
    pub stream_id: u32,
    pub media_kind: MediaKind,
    pub sender_id: NodeId,
    pub receiver_id: NodeId,
    pub frame_indices: Vec<u16>,
    pub total_frames: u16,
    pub frames_received: Vec<bool>,
    pub frame_payloads: Vec<Option<Arc<Vec<u8>>>>,
    pub frames_queue_dropped: u16,
    pub frames_late_dropped: u16,
    pub pdr: f64,
}

#[derive(Debug, Default)]
pub struct MediaTracker {
    num_nodes: Option<u16>,
    expected_frames: HashMap<(NodeId, u32, MediaKind), ExpectedStream>,
    frame_deadlines_ns: HashMap<(NodeId, u32, MediaKind, u16), u64>,
    received_fragments: HashMap<(NodeId, NodeId, u32, MediaKind, u16), FrameAssembly>,
    queue_drop_frames: HashSet<(NodeId, u32, MediaKind, u16)>,
    queue_drop_unknown: HashMap<(NodeId, u32, MediaKind), u16>,
    late_drop_frames: HashSet<(NodeId, NodeId, u32, MediaKind, u16)>,
}

#[derive(Debug, Clone)]
struct ExpectedStream {
    frame_indices: Vec<u16>,
    window_end_ns: u64,
}

#[derive(Debug, Default, Clone)]
struct FrameAssembly {
    expected_fragments: u16,
    fragments: HashMap<u16, Arc<Vec<u8>>>,
}

impl FrameAssembly {
    fn record_fragment(&mut self, fragment_index: u16, fragment_count: u16, payload: Arc<Vec<u8>>) {
        let fragment_count = fragment_count.max(1);
        self.expected_fragments = self.expected_fragments.max(fragment_count);
        self.fragments.entry(fragment_index).or_insert(payload);
    }

    fn is_complete(&self) -> bool {
        self.expected_fragments > 0 && self.fragments.len() == self.expected_fragments as usize
    }

    fn reassemble_payload(&self) -> Option<Arc<Vec<u8>>> {
        if !self.is_complete() {
            return None;
        }
        let mut payload = Vec::new();
        for frag_idx in 0..self.expected_fragments {
            let part = self.fragments.get(&frag_idx)?;
            payload.extend_from_slice(part.as_slice());
        }
        Some(Arc::new(payload))
    }
}

impl MediaTracker {
    pub fn set_num_nodes(&mut self, num_nodes: u16) {
        self.num_nodes = Some(num_nodes);
    }

    pub fn seed_stream(
        &mut self,
        sender_id: NodeId,
        stream_id: u32,
        media_kind: MediaKind,
        total_frames: u16,
        window_end_ns: u64,
    ) {
        let frame_indices = (0..total_frames).collect::<Vec<_>>();
        self.seed_stream_with_indices(sender_id, stream_id, media_kind, frame_indices, window_end_ns);
    }

    pub fn seed_stream_with_indices(
        &mut self,
        sender_id: NodeId,
        stream_id: u32,
        media_kind: MediaKind,
        frame_indices: Vec<u16>,
        window_end_ns: u64,
    ) {
        assert!(
            frame_indices.len() <= u16::MAX as usize,
            "frame_indices length must fit in u16"
        );
        self.expected_frames.insert(
            (sender_id, stream_id, media_kind),
            ExpectedStream {
                frame_indices,
                window_end_ns,
            },
        );
    }

    pub fn seed_streams(&mut self, entries: &[(NodeId, u32, MediaKind, u16, u64)]) {
        for (sender_id, stream_id, media_kind, total_frames, window_end_ns) in entries {
            self.seed_stream(
                *sender_id,
                *stream_id,
                *media_kind,
                *total_frames,
                *window_end_ns,
            );
        }
    }

    pub fn seed_streams_with_indices(
        &mut self,
        entries: &[(NodeId, u32, MediaKind, Vec<u16>, u64)],
    ) {
        for (sender_id, stream_id, media_kind, frame_indices, window_end_ns) in entries {
            self.seed_stream_with_indices(
                *sender_id,
                *stream_id,
                *media_kind,
                frame_indices.clone(),
                *window_end_ns,
            );
        }
    }

    pub fn seed_frame_deadlines(&mut self, entries: &[(NodeId, u32, MediaKind, u16, u64)]) {
        for (sender_id, stream_id, media_kind, frame_index, deadline_ns) in entries {
            self.frame_deadlines_ns.insert(
                (*sender_id, *stream_id, *media_kind, *frame_index),
                *deadline_ns,
            );
        }
    }

    pub fn record_delivery(
        &mut self,
        sender_id: NodeId,
        receiver_id: NodeId,
        meta: MediaMeta,
        payload: Arc<Vec<u8>>,
        delivery_time_ns: u64,
    ) {
        if let Some(deadline_ns) = self.frame_deadlines_ns.get(&(
            sender_id,
            meta.stream_id,
            meta.media_kind,
            meta.frame_index,
        )) {
            if delivery_time_ns > *deadline_ns {
                self.late_drop_frames.insert((
                    receiver_id,
                    sender_id,
                    meta.stream_id,
                    meta.media_kind,
                    meta.frame_index,
                ));
                return;
            }
        } else if let Some(expected) = self
            .expected_frames
            .get(&(sender_id, meta.stream_id, meta.media_kind))
        {
            if delivery_time_ns > expected.window_end_ns {
                self.late_drop_frames.insert((
                    receiver_id,
                    sender_id,
                    meta.stream_id,
                    meta.media_kind,
                    meta.frame_index,
                ));
                return;
            }
        }
        self.received_fragments
            .entry((
                receiver_id,
                sender_id,
                meta.stream_id,
                meta.media_kind,
                meta.frame_index,
            ))
            .or_default()
            .record_fragment(meta.fragment_index, meta.fragment_count, payload);
    }

    pub fn record_drop(
        &mut self,
        sender_id: NodeId,
        receiver_id: Option<NodeId>,
        stream_id: u32,
        media_kind: MediaKind,
        frame_index: Option<u16>,
        reason: MediaDropReason,
    ) {
        match reason {
            MediaDropReason::QueueFull => {
                if let Some(frame_index) = frame_index {
                    self.queue_drop_frames
                        .insert((sender_id, stream_id, media_kind, frame_index));
                } else {
                    *self
                        .queue_drop_unknown
                        .entry((sender_id, stream_id, media_kind))
                        .or_insert(0) += 1;
                }
            }
            MediaDropReason::Late => {
                if let (Some(receiver_id), Some(frame_index)) = (receiver_id, frame_index) {
                    self.late_drop_frames.insert((
                        receiver_id,
                        sender_id,
                        stream_id,
                        media_kind,
                        frame_index,
                    ));
                }
            }
        }
    }

    pub fn results(&self) -> Vec<MediaStreamResult> {
        let mut out = Vec::new();
        for (&(sender_id, stream_id, media_kind), expected) in &self.expected_frames {
            let total_frames =
                u16::try_from(expected.frame_indices.len()).expect("frame count exceeds u16::MAX");
            let receivers: Vec<NodeId> = if let Some(num_nodes) = self.num_nodes {
                (0..num_nodes).filter(|id| *id != sender_id).collect()
            } else {
                let mut recv: Vec<NodeId> = self
                    .received_fragments
                    .keys()
                    .filter_map(|(receiver_id, s, stream, kind, _)| {
                        if *s == sender_id && *stream == stream_id && *kind == media_kind {
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
                let mut frame_payloads: Vec<Option<Arc<Vec<u8>>>> =
                    vec![None; total_frames as usize];
                for (idx, frame_id) in expected.frame_indices.iter().enumerate() {
                    if let Some(assembly) = self.received_fragments.get(&(
                        receiver_id,
                        sender_id,
                        stream_id,
                        media_kind,
                        *frame_id,
                    )) {
                        if let Some(payload) = assembly.reassemble_payload() {
                            frames_received[idx] = true;
                            frame_payloads[idx] = Some(payload);
                        }
                    }
                }
                let received_count = frames_received.iter().filter(|r| **r).count() as u16;
                let pdr = if total_frames > 0 {
                    received_count as f64 / total_frames as f64
                } else {
                    0.0
                };
                let queue_drop_frames = self
                    .queue_drop_frames
                    .iter()
                    .filter(|(s, stream, kind, _)| {
                        *s == sender_id && *stream == stream_id && *kind == media_kind
                    })
                    .count();
                let queue_drop_unknown = *self
                    .queue_drop_unknown
                    .get(&(sender_id, stream_id, media_kind))
                    .unwrap_or(&0) as usize;
                let late_drop_frames = self
                    .late_drop_frames
                    .iter()
                    .filter(|(receiver, s, stream, kind, _)| {
                        *receiver == receiver_id
                            && *s == sender_id
                            && *stream == stream_id
                            && *kind == media_kind
                    })
                    .count();
                out.push(MediaStreamResult {
                    stream_id,
                    media_kind,
                    sender_id,
                    receiver_id,
                    frame_indices: expected.frame_indices.clone(),
                    total_frames,
                    frames_received,
                    frame_payloads,
                    frames_queue_dropped: (queue_drop_frames + queue_drop_unknown)
                        .min(u16::MAX as usize) as u16,
                    frames_late_dropped: late_drop_frames.min(u16::MAX as usize) as u16,
                    pdr,
                });
            }
        }
        out.sort_by_key(|r| (r.sender_id, r.stream_id, r.receiver_id, r.media_kind as u8));
        out
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use super::*;

    #[test]
    fn frame_is_only_marked_received_when_all_fragments_arrive() {
        let mut tracker = MediaTracker::default();
        tracker.set_num_nodes(2);
        tracker.seed_stream(0, 10, MediaKind::Video, 1, u64::MAX);

        tracker.record_delivery(
            0,
            1,
            MediaMeta {
                stream_id: 10,
                message_id: 10,
                frame_index: 0,
                fragment_index: 0,
                fragment_count: 2,
                media_kind: MediaKind::Video,
            },
            Arc::new(vec![1, 2]),
            1,
        );
        let partial = tracker.results();
        assert_eq!(partial.len(), 1);
        assert_eq!(partial[0].frame_indices, vec![0]);
        assert_eq!(partial[0].frames_received, vec![false]);

        tracker.record_delivery(
            0,
            1,
            MediaMeta {
                stream_id: 10,
                message_id: 10,
                frame_index: 0,
                fragment_index: 1,
                fragment_count: 2,
                media_kind: MediaKind::Video,
            },
            Arc::new(vec![3, 4]),
            2,
        );
        let complete = tracker.results();
        assert_eq!(complete[0].frames_received, vec![true]);
        assert_eq!(
            complete[0].frame_payloads[0].as_ref().unwrap().as_slice(),
            &[1, 2, 3, 4]
        );
    }

    #[test]
    fn queue_drops_dedupe_by_frame_index() {
        let mut tracker = MediaTracker::default();
        tracker.set_num_nodes(2);
        tracker.seed_stream(0, 55, MediaKind::Video, 2, u64::MAX);

        tracker.record_drop(0, None, 55, MediaKind::Video, Some(1), MediaDropReason::QueueFull);
        tracker.record_drop(0, None, 55, MediaKind::Video, Some(1), MediaDropReason::QueueFull);

        let result = tracker
            .results()
            .into_iter()
            .find(|r| r.sender_id == 0 && r.receiver_id == 1 && r.stream_id == 55)
            .expect("result for receiver should exist");
        assert_eq!(result.frames_queue_dropped, 1);
    }

    #[test]
    fn frame_deadline_is_enforced_per_frame_not_stream() {
        let mut tracker = MediaTracker::default();
        tracker.set_num_nodes(2);
        tracker.seed_stream_with_indices(0, 77, MediaKind::Video, vec![0, 1], 10_000);
        tracker.seed_frame_deadlines(&[
            (0, 77, MediaKind::Video, 0, 100),
            (0, 77, MediaKind::Video, 1, 200),
        ]);

        tracker.record_delivery(
            0,
            1,
            MediaMeta {
                stream_id: 77,
                message_id: 77,
                frame_index: 0,
                fragment_index: 0,
                fragment_count: 1,
                media_kind: MediaKind::Video,
            },
            Arc::new(vec![9]),
            150,
        );
        tracker.record_delivery(
            0,
            1,
            MediaMeta {
                stream_id: 77,
                message_id: 77,
                frame_index: 1,
                fragment_index: 0,
                fragment_count: 1,
                media_kind: MediaKind::Video,
            },
            Arc::new(vec![8]),
            190,
        );

        let result = tracker
            .results()
            .into_iter()
            .find(|r| r.sender_id == 0 && r.receiver_id == 1 && r.stream_id == 77)
            .expect("result for receiver should exist");
        assert_eq!(result.frame_indices, vec![0, 1]);
        assert_eq!(result.frames_received, vec![false, true]);
        assert_eq!(result.frames_late_dropped, 1);
    }

    #[test]
    fn sparse_stream_results_include_frame_indices() {
        let mut tracker = MediaTracker::default();
        tracker.set_num_nodes(2);
        tracker.seed_stream_with_indices(0, 88, MediaKind::Video, vec![4, 10], u64::MAX);

        tracker.record_delivery(
            0,
            1,
            MediaMeta {
                stream_id: 88,
                message_id: 88,
                frame_index: 10,
                fragment_index: 0,
                fragment_count: 1,
                media_kind: MediaKind::Video,
            },
            Arc::new(vec![1]),
            1,
        );

        let result = tracker
            .results()
            .into_iter()
            .find(|r| r.sender_id == 0 && r.receiver_id == 1 && r.stream_id == 88)
            .expect("result for receiver should exist");
        assert_eq!(result.frame_indices, vec![4, 10]);
        assert_eq!(result.frames_received, vec![false, true]);
    }
}
