use std::fmt::{Display, Formatter};
use std::path::Path;
use std::sync::Arc;

use hashbrown::{HashMap, HashSet};
use serde::Deserialize;

use crate::des::{NodeId, SimTime};
use crate::node::Vec2;
use crate::packet::{MediaKind, PacketKind};
use crate::voice::scenario::ScheduledVoiceFrame;

/// One in-memory media frame entry, ready for scheduling and fragmentation.
///
/// Mirrors the manifest schema but carries an opaque `Arc<Vec<u8>>` payload so
/// callers can inject real codec output (e.g., Opus frames from Python) instead
/// of the deterministic-fill bytes the JSON manifest produces.
#[derive(Debug, Clone)]
pub struct RawMediaEntry {
    pub time_s: f64,
    pub sender_id: NodeId,
    pub dest_id: Option<NodeId>,
    pub stream_id: u32,
    pub message_id: Option<u32>,
    pub frame_index: u16,
    pub media_kind: MediaKind,
    pub payload: Arc<Vec<u8>>,
    pub fragment_index: Option<u16>,
    pub fragment_count: Option<u16>,
}

#[derive(Debug, Clone)]
pub struct MediaScenario {
    frames: Vec<ScheduledVoiceFrame>,
    expected_streams: Vec<(NodeId, u32, MediaKind, Vec<u16>, u64)>,
    expected_frame_deadlines: Vec<(NodeId, u32, MediaKind, u16, u64)>,
    pub node_positions: Option<Vec<Vec2>>,
}

impl MediaScenario {
    pub fn load(
        manifest_path: impl AsRef<Path>,
        num_nodes: u16,
        mtu_bytes: u16,
        playout_slack_ms: f64,
    ) -> Result<Self, MediaScenarioError> {
        let json = std::fs::read_to_string(manifest_path.as_ref()).map_err(|e| {
            MediaScenarioError::Io(format!(
                "failed to read media manifest {}: {e}",
                manifest_path.as_ref().display()
            ))
        })?;
        let raw: MediaScenarioFile = serde_json::from_str(&json).map_err(|e| {
            MediaScenarioError::Json(format!(
                "failed to parse media manifest {}: {e}",
                manifest_path.as_ref().display()
            ))
        })?;

        let entries: Vec<RawMediaEntry> = raw.frames.into_iter().map(MediaFrameEntry::into_raw).collect();
        let node_positions = raw.positions.map(positions_from_manifest);
        Self::from_raw_entries(entries, num_nodes, mtu_bytes, playout_slack_ms, node_positions)
    }

    /// Build a `MediaScenario` from in-memory entries, bypassing the JSON manifest.
    /// Use this to inject real codec payloads (e.g., Opus voice frames) at runtime.
    pub fn from_in_memory(
        entries: Vec<RawMediaEntry>,
        num_nodes: u16,
        mtu_bytes: u16,
        playout_slack_ms: f64,
        node_positions: Option<Vec<Vec2>>,
    ) -> Result<Self, MediaScenarioError> {
        Self::from_raw_entries(entries, num_nodes, mtu_bytes, playout_slack_ms, node_positions)
    }

    fn from_raw_entries(
        entries: Vec<RawMediaEntry>,
        num_nodes: u16,
        mtu_bytes: u16,
        playout_slack_ms: f64,
        node_positions: Option<Vec<Vec2>>,
    ) -> Result<Self, MediaScenarioError> {
        let (frames, expected_streams, expected_frame_deadlines) =
            build_scheduled_frames(entries, num_nodes, mtu_bytes, playout_slack_ms)?;
        Ok(MediaScenario {
            frames,
            expected_streams,
            expected_frame_deadlines,
            node_positions,
        })
    }
}

/// Shared logic that turns a flat list of `RawMediaEntry`s into scheduled frames
/// (with auto- or explicit-fragmentation), per-stream expectations, and per-frame
/// playout deadlines. Used by both manifest loading and in-memory injection.
fn build_scheduled_frames(
    entries: Vec<RawMediaEntry>,
    num_nodes: u16,
    mtu_bytes: u16,
    playout_slack_ms: f64,
) -> Result<
    (
        Vec<ScheduledVoiceFrame>,
        Vec<(NodeId, u32, MediaKind, Vec<u16>, u64)>,
        Vec<(NodeId, u32, MediaKind, u16, u64)>,
    ),
    MediaScenarioError,
> {
    let mut frames = Vec::with_capacity(entries.len());
    let mut stream_stats: HashMap<(NodeId, u32, MediaKind), (HashSet<u16>, u64)> = HashMap::new();
    let mut frame_deadlines: HashMap<(NodeId, u32, MediaKind, u16), u64> = HashMap::new();
    #[derive(Clone, Copy, PartialEq, Eq)]
    enum FrameSpecMode {
        Auto,
        Explicit,
    }
    struct ExplicitFragmentState {
        fragment_count: u16,
        seen_indices: HashSet<u16>,
    }
    let mut frame_spec_mode: HashMap<(NodeId, u32, MediaKind, u16), FrameSpecMode> = HashMap::new();
    let mut explicit_fragment_state: HashMap<(NodeId, u32, MediaKind, u16), ExplicitFragmentState> =
        HashMap::new();
    let mtu_bytes = mtu_bytes.max(1) as usize;
    let playout_slack_ns = SimTime::from_ms(playout_slack_ms).as_ns();

    for entry in entries {
        if entry.sender_id >= num_nodes {
            return Err(MediaScenarioError::InvalidSender {
                sender_id: entry.sender_id,
                num_nodes,
            });
        }
        if let Some(dest_id) = entry.dest_id {
            if dest_id >= num_nodes {
                return Err(MediaScenarioError::InvalidDest {
                    dest_id,
                    num_nodes,
                });
            }
        }
        let payload_arc = entry.payload.clone();
        let payload_bytes = payload_arc.len().max(1);

        let kind = match entry.media_kind {
            MediaKind::Audio => PacketKind::Voice,
            MediaKind::Video => PacketKind::Video,
        };

        let emit_time = SimTime::from_s(entry.time_s);
        let message_id = entry.message_id.unwrap_or(entry.stream_id);
        let frame_key = (
            entry.sender_id,
            entry.stream_id,
            entry.media_kind,
            entry.frame_index,
        );
        let explicit_fragments = entry.fragment_count.is_some() || entry.fragment_index.is_some();
        if explicit_fragments {
            match frame_spec_mode.get(&frame_key) {
                Some(FrameSpecMode::Auto) => {
                    return Err(MediaScenarioError::MixedFragmentSpecification {
                        sender_id: entry.sender_id,
                        stream_id: entry.stream_id,
                        frame_index: entry.frame_index,
                        media_kind: entry.media_kind,
                    })
                }
                _ => {
                    frame_spec_mode.insert(frame_key, FrameSpecMode::Explicit);
                }
            }
            let fragment_count = entry
                .fragment_count
                .unwrap_or_else(|| entry.fragment_index.map(|idx| idx.saturating_add(1)).unwrap_or(1))
                .max(1);
            let fragment_index = entry.fragment_index.unwrap_or(0);
            if fragment_index >= fragment_count {
                return Err(MediaScenarioError::FragmentIndexOutOfRange {
                    sender_id: entry.sender_id,
                    stream_id: entry.stream_id,
                    frame_index: entry.frame_index,
                    fragment_index,
                    fragment_count,
                });
            }
            let state = explicit_fragment_state
                .entry(frame_key)
                .or_insert_with(|| ExplicitFragmentState {
                    fragment_count,
                    seen_indices: HashSet::new(),
                });
            if state.fragment_count != fragment_count {
                return Err(MediaScenarioError::InconsistentFragmentCount {
                    sender_id: entry.sender_id,
                    stream_id: entry.stream_id,
                    frame_index: entry.frame_index,
                    expected_count: state.fragment_count,
                    observed_count: fragment_count,
                });
            }
            if !state.seen_indices.insert(fragment_index) {
                return Err(MediaScenarioError::DuplicateFragmentIndex {
                    sender_id: entry.sender_id,
                    stream_id: entry.stream_id,
                    frame_index: entry.frame_index,
                    fragment_index,
                });
            }
            frames.push(ScheduledVoiceFrame {
                emit_time,
                sender_id: entry.sender_id,
                dest_id: entry.dest_id,
                kind,
                stream_id: entry.stream_id,
                media_kind: entry.media_kind,
                message_id,
                frame_index: entry.frame_index,
                fragment_index,
                fragment_count,
                payload: payload_arc.clone(),
            });
        } else {
            match frame_spec_mode.get(&frame_key) {
                Some(FrameSpecMode::Explicit) => {
                    return Err(MediaScenarioError::MixedFragmentSpecification {
                        sender_id: entry.sender_id,
                        stream_id: entry.stream_id,
                        frame_index: entry.frame_index,
                        media_kind: entry.media_kind,
                    })
                }
                Some(FrameSpecMode::Auto) => {
                    return Err(MediaScenarioError::DuplicateFrameEntry {
                        sender_id: entry.sender_id,
                        stream_id: entry.stream_id,
                        frame_index: entry.frame_index,
                        media_kind: entry.media_kind,
                    })
                }
                None => {
                    frame_spec_mode.insert(frame_key, FrameSpecMode::Auto);
                }
            }
            let fragment_count_usize = ((payload_bytes + mtu_bytes - 1) / mtu_bytes).max(1);
            let fragment_count = u16::try_from(fragment_count_usize).map_err(|_| {
                MediaScenarioError::FragmentCountTooLarge {
                    sender_id: entry.sender_id,
                    stream_id: entry.stream_id,
                    frame_index: entry.frame_index,
                    fragment_count: fragment_count_usize,
                }
            })?;
            for fragment_index in 0..fragment_count {
                let start = fragment_index as usize * mtu_bytes;
                let end = ((fragment_index as usize + 1) * mtu_bytes).min(payload_arc.len());
                let payload = if payload_arc.is_empty() {
                    Vec::new()
                } else {
                    payload_arc[start..end].to_vec()
                };
                frames.push(ScheduledVoiceFrame {
                    emit_time,
                    sender_id: entry.sender_id,
                    dest_id: entry.dest_id,
                    kind,
                    stream_id: entry.stream_id,
                    media_kind: entry.media_kind,
                    message_id,
                    frame_index: entry.frame_index,
                    fragment_index,
                    fragment_count,
                    payload: Arc::new(payload),
                });
            }
        }

        let key = (entry.sender_id, entry.stream_id, entry.media_kind);
        let stats = stream_stats.entry(key).or_insert((HashSet::new(), 0));
        stats.0.insert(entry.frame_index);
        stats.1 = stats
            .1
            .max(emit_time.as_ns().saturating_add(playout_slack_ns));
        let deadline_ns = emit_time.as_ns().saturating_add(playout_slack_ns);
        frame_deadlines
            .entry(frame_key)
            .and_modify(|existing| {
                *existing = (*existing).min(deadline_ns);
            })
            .or_insert(deadline_ns);
    }

    for ((sender_id, stream_id, media_kind, frame_index), state) in &explicit_fragment_state {
        let missing: Vec<u16> = (0..state.fragment_count)
            .filter(|idx| !state.seen_indices.contains(idx))
            .collect();
        if !missing.is_empty() {
            return Err(MediaScenarioError::MissingExplicitFragments {
                sender_id: *sender_id,
                stream_id: *stream_id,
                frame_index: *frame_index,
                media_kind: *media_kind,
                fragment_count: state.fragment_count,
                missing_indices: missing,
            });
        }
    }

    frames.sort_by_key(|f| {
        (
            f.sender_id,
            f.emit_time,
            f.stream_id,
            f.frame_index,
            f.fragment_index,
        )
    });

    let mut expected_streams = Vec::with_capacity(stream_stats.len());
    for ((sender_id, stream_id, media_kind), (frame_ids, window_end_ns)) in stream_stats {
        let mut frame_indices: Vec<u16> = frame_ids.into_iter().collect();
        frame_indices.sort_unstable();
        if frame_indices.len() > u16::MAX as usize {
            return Err(MediaScenarioError::TooManyFramesInStream {
                sender_id,
                stream_id,
                media_kind,
                frame_count: frame_indices.len(),
            });
        }
        expected_streams.push((
            sender_id,
            stream_id,
            media_kind,
            frame_indices,
            window_end_ns,
        ));
    }
    expected_streams.sort_by_key(|(sender, stream_id, kind, _, _)| {
        (*sender as u64, *stream_id as u64, *kind as u8 as u64)
    });
    let mut expected_frame_deadlines: Vec<(NodeId, u32, MediaKind, u16, u64)> = frame_deadlines
        .into_iter()
        .map(|((sender_id, stream_id, media_kind, frame_index), deadline_ns)| {
            (sender_id, stream_id, media_kind, frame_index, deadline_ns)
        })
        .collect();
    expected_frame_deadlines.sort_by_key(|(sender, stream_id, kind, frame_index, _)| {
        (
            *sender as u64,
            *stream_id as u64,
            *kind as u8 as u64,
            *frame_index as u64,
        )
    });

    Ok((frames, expected_streams, expected_frame_deadlines))
}

fn positions_from_manifest(pos_data: MediaScenarioPositions) -> Vec<Vec2> {
    let mut positions = Vec::with_capacity(pos_data.positions.len());
    for soldier_positions in pos_data.positions {
        if soldier_positions.is_empty() {
            positions.push(Vec2::ZERO);
        } else {
            let p = &soldier_positions[0];
            positions.push(Vec2::new(
                if !p.is_empty() { p[0] } else { 0.0 },
                if p.len() > 1 { p[1] } else { 0.0 },
            ));
        }
    }
    positions
}

impl MediaScenario {
    pub fn frames_for_sender(&self, sender_id: NodeId) -> Vec<ScheduledVoiceFrame> {
        self.frames
            .iter()
            .filter(|f| f.sender_id == sender_id)
            .cloned()
            .collect()
    }

    pub fn expected_streams(&self) -> &[(NodeId, u32, MediaKind, Vec<u16>, u64)] {
        &self.expected_streams
    }

    pub fn expected_frame_deadlines(&self) -> &[(NodeId, u32, MediaKind, u16, u64)] {
        &self.expected_frame_deadlines
    }
}

#[derive(Debug)]
pub enum MediaScenarioError {
    Io(String),
    Json(String),
    InvalidSender { sender_id: u16, num_nodes: u16 },
    InvalidDest { dest_id: u16, num_nodes: u16 },
    FragmentCountTooLarge {
        sender_id: u16,
        stream_id: u32,
        frame_index: u16,
        fragment_count: usize,
    },
    FragmentIndexOutOfRange {
        sender_id: u16,
        stream_id: u32,
        frame_index: u16,
        fragment_index: u16,
        fragment_count: u16,
    },
    InconsistentFragmentCount {
        sender_id: u16,
        stream_id: u32,
        frame_index: u16,
        expected_count: u16,
        observed_count: u16,
    },
    DuplicateFragmentIndex {
        sender_id: u16,
        stream_id: u32,
        frame_index: u16,
        fragment_index: u16,
    },
    MissingExplicitFragments {
        sender_id: u16,
        stream_id: u32,
        frame_index: u16,
        media_kind: MediaKind,
        fragment_count: u16,
        missing_indices: Vec<u16>,
    },
    MixedFragmentSpecification {
        sender_id: u16,
        stream_id: u32,
        frame_index: u16,
        media_kind: MediaKind,
    },
    DuplicateFrameEntry {
        sender_id: u16,
        stream_id: u32,
        frame_index: u16,
        media_kind: MediaKind,
    },
    TooManyFramesInStream {
        sender_id: u16,
        stream_id: u32,
        media_kind: MediaKind,
        frame_count: usize,
    },
}

impl Display for MediaScenarioError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            MediaScenarioError::Io(msg) => write!(f, "{msg}"),
            MediaScenarioError::Json(msg) => write!(f, "{msg}"),
            MediaScenarioError::InvalidSender {
                sender_id,
                num_nodes,
            } => {
                write!(
                    f,
                    "invalid sender_id {sender_id}; must be < num_nodes ({num_nodes})"
                )
            }
            MediaScenarioError::InvalidDest { dest_id, num_nodes } => {
                write!(
                    f,
                    "invalid dest_id {dest_id}; must be < num_nodes ({num_nodes})"
                )
            }
            MediaScenarioError::FragmentCountTooLarge {
                sender_id,
                stream_id,
                frame_index,
                fragment_count,
            } => {
                write!(
                    f,
                    "sender {sender_id} stream {stream_id} frame {frame_index} produced {fragment_count} fragments; exceeds u16::MAX"
                )
            }
            MediaScenarioError::FragmentIndexOutOfRange {
                sender_id,
                stream_id,
                frame_index,
                fragment_index,
                fragment_count,
            } => {
                write!(
                    f,
                    "sender {sender_id} stream {stream_id} frame {frame_index} has fragment_index {fragment_index} outside 0..{fragment_count}"
                )
            }
            MediaScenarioError::InconsistentFragmentCount {
                sender_id,
                stream_id,
                frame_index,
                expected_count,
                observed_count,
            } => {
                write!(
                    f,
                    "sender {sender_id} stream {stream_id} frame {frame_index} has inconsistent fragment_count: expected {expected_count}, observed {observed_count}"
                )
            }
            MediaScenarioError::DuplicateFragmentIndex {
                sender_id,
                stream_id,
                frame_index,
                fragment_index,
            } => {
                write!(
                    f,
                    "sender {sender_id} stream {stream_id} frame {frame_index} has duplicate fragment_index {fragment_index}"
                )
            }
            MediaScenarioError::MissingExplicitFragments {
                sender_id,
                stream_id,
                frame_index,
                media_kind,
                fragment_count,
                missing_indices,
            } => {
                write!(
                    f,
                    "sender {sender_id} stream {stream_id} frame {frame_index} ({media_kind:?}) declares {fragment_count} fragments but is missing indices {missing_indices:?}"
                )
            }
            MediaScenarioError::MixedFragmentSpecification {
                sender_id,
                stream_id,
                frame_index,
                media_kind,
            } => {
                write!(
                    f,
                    "sender {sender_id} stream {stream_id} frame {frame_index} ({media_kind:?}) mixes explicit and implicit fragmentation entries"
                )
            }
            MediaScenarioError::DuplicateFrameEntry {
                sender_id,
                stream_id,
                frame_index,
                media_kind,
            } => {
                write!(
                    f,
                    "sender {sender_id} stream {stream_id} frame {frame_index} ({media_kind:?}) appears multiple times without explicit fragment indexing"
                )
            }
            MediaScenarioError::TooManyFramesInStream {
                sender_id,
                stream_id,
                media_kind,
                frame_count,
            } => {
                write!(
                    f,
                    "sender {sender_id} stream {stream_id} ({media_kind:?}) has {frame_count} unique frames; max supported is {}",
                    u16::MAX
                )
            }
        }
    }
}

impl std::error::Error for MediaScenarioError {}

#[derive(Debug, Deserialize)]
struct MediaScenarioFile {
    frames: Vec<MediaFrameEntry>,
    positions: Option<MediaScenarioPositions>,
}

#[derive(Debug, Deserialize)]
struct MediaFrameEntry {
    time_s: f64,
    sender_id: u16,
    #[serde(default)]
    dest_id: Option<u16>,
    stream_id: u32,
    #[serde(default)]
    message_id: Option<u32>,
    frame_index: u16,
    payload_bytes: usize,
    media_kind: MediaKind,
    #[serde(default)]
    fragment_index: Option<u16>,
    #[serde(default)]
    fragment_count: Option<u16>,
}

impl MediaFrameEntry {
    /// Convert a deserialized manifest row into a `RawMediaEntry`. Generates the
    /// per-frame payload bytes deterministically from `(stream_id, frame_index)`
    /// to preserve the historical manifest behaviour for backward compatibility.
    fn into_raw(self) -> RawMediaEntry {
        let bytes = self.payload_bytes.max(1);
        let mut payload = vec![0u8; bytes];
        for (idx, b) in payload.iter_mut().enumerate() {
            *b = ((self.stream_id as usize + self.frame_index as usize + idx) & 0xff) as u8;
        }
        RawMediaEntry {
            time_s: self.time_s,
            sender_id: self.sender_id,
            dest_id: self.dest_id,
            stream_id: self.stream_id,
            message_id: self.message_id,
            frame_index: self.frame_index,
            media_kind: self.media_kind,
            payload: Arc::new(payload),
            fragment_index: self.fragment_index,
            fragment_count: self.fragment_count,
        }
    }
}

#[derive(Debug, Deserialize)]
struct MediaScenarioPositions {
    positions: Vec<Vec<Vec<f64>>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn load_media_manifest() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("media_manifest_{}.json", std::process::id()));
        let manifest = r#"{
            "frames": [
                {"time_s":0.0,"sender_id":0,"stream_id":10,"frame_index":0,"payload_bytes":8,"media_kind":"audio"},
                {"time_s":0.1,"sender_id":0,"stream_id":10,"frame_index":1,"payload_bytes":8,"media_kind":"audio"},
                {"time_s":0.0,"sender_id":1,"stream_id":22,"frame_index":0,"payload_bytes":16,"media_kind":"video"}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let scenario = MediaScenario::load(&path, 4, 1200, 50.0).unwrap();
        assert_eq!(scenario.frames_for_sender(0).len(), 2);
        assert_eq!(scenario.frames_for_sender(1).len(), 1);
        assert_eq!(scenario.expected_streams().len(), 2);
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn auto_fragmentation_uses_mtu_and_counts_frames_not_fragments() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("media_manifest_frag_{}.json", std::process::id()));
        let manifest = r#"{
            "frames": [
                {"time_s":0.0,"sender_id":0,"stream_id":10,"frame_index":0,"payload_bytes":2500,"media_kind":"video"},
                {"time_s":0.1,"sender_id":0,"stream_id":10,"frame_index":1,"payload_bytes":2500,"media_kind":"video"}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let scenario = MediaScenario::load(&path, 4, 1000, 40.0).unwrap();
        let frames = scenario.frames_for_sender(0);
        assert_eq!(frames.len(), 6, "two frames should be split into three fragments each");
        assert!(frames.iter().all(|f| f.fragment_count == 3));
        let stream = scenario
            .expected_streams()
            .iter()
            .find(|(sender, stream_id, kind, _, _)| {
                *sender == 0 && *stream_id == 10 && *kind == MediaKind::Video
            })
            .expect("stream should be tracked");
        assert_eq!(stream.3.len(), 2, "expected frame count should remain frame-based");
        assert_eq!(stream.3, vec![0, 1]);
        assert_eq!(
            scenario
                .expected_frame_deadlines()
                .iter()
                .filter(|(sender, stream_id, kind, _, _)| {
                    *sender == 0 && *stream_id == 10 && *kind == MediaKind::Video
                })
                .count(),
            2
        );
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn sparse_frame_indices_are_tracked_without_max_plus_one_inflation() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("media_manifest_sparse_{}.json", std::process::id()));
        let manifest = r#"{
            "frames": [
                {"time_s":0.01,"sender_id":0,"stream_id":7,"frame_index":4,"payload_bytes":64,"media_kind":"video"},
                {"time_s":0.02,"sender_id":0,"stream_id":7,"frame_index":10,"payload_bytes":64,"media_kind":"video"}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let scenario = MediaScenario::load(&path, 4, 1200, 5.0).unwrap();
        let stream = scenario
            .expected_streams()
            .iter()
            .find(|(sender, stream_id, kind, _, _)| {
                *sender == 0 && *stream_id == 7 && *kind == MediaKind::Video
            })
            .expect("stream should be tracked");
        assert_eq!(stream.3, vec![4, 10]);
        assert_eq!(
            scenario
                .expected_frame_deadlines()
                .iter()
                .filter(|(sender, stream_id, kind, _, _)| {
                    *sender == 0 && *stream_id == 7 && *kind == MediaKind::Video
                })
                .count(),
            2
        );
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn explicit_fragment_rows_must_cover_all_indices() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("media_manifest_missing_frag_{}.json", std::process::id()));
        let manifest = r#"{
            "frames": [
                {"time_s":0.0,"sender_id":0,"stream_id":10,"frame_index":0,"payload_bytes":100,"media_kind":"video","fragment_index":0,"fragment_count":2}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let err = MediaScenario::load(&path, 4, 1200, 50.0).expect_err("missing explicit fragments should fail");
        assert!(format!("{err}").contains("missing indices"));
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn duplicate_explicit_fragment_index_is_rejected() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!(
            "media_manifest_duplicate_frag_idx_{}.json",
            std::process::id()
        ));
        let manifest = r#"{
            "frames": [
                {"time_s":0.0,"sender_id":0,"stream_id":10,"frame_index":0,"payload_bytes":100,"media_kind":"video","fragment_index":0,"fragment_count":2},
                {"time_s":0.1,"sender_id":0,"stream_id":10,"frame_index":0,"payload_bytes":100,"media_kind":"video","fragment_index":0,"fragment_count":2}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let err = MediaScenario::load(&path, 4, 1200, 50.0)
            .expect_err("duplicate explicit fragment indices should fail");
        assert!(matches!(
            err,
            MediaScenarioError::DuplicateFragmentIndex {
                sender_id: 0,
                stream_id: 10,
                frame_index: 0,
                fragment_index: 0
            }
        ));
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn mixed_explicit_then_auto_fragment_is_rejected() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!(
            "media_manifest_mixed_explicit_then_auto_{}.json",
            std::process::id()
        ));
        let manifest = r#"{
            "frames": [
                {"time_s":0.0,"sender_id":0,"stream_id":12,"frame_index":2,"payload_bytes":64,"media_kind":"video","fragment_index":0,"fragment_count":1},
                {"time_s":0.1,"sender_id":0,"stream_id":12,"frame_index":2,"payload_bytes":64,"media_kind":"video"}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let err = MediaScenario::load(&path, 4, 1200, 50.0)
            .expect_err("mixing explicit then implicit fragmentation should fail");
        assert!(matches!(
            err,
            MediaScenarioError::MixedFragmentSpecification {
                sender_id: 0,
                stream_id: 12,
                frame_index: 2,
                media_kind: MediaKind::Video
            }
        ));
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn mixed_auto_then_explicit_fragment_is_rejected() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!(
            "media_manifest_mixed_auto_then_explicit_{}.json",
            std::process::id()
        ));
        let manifest = r#"{
            "frames": [
                {"time_s":0.0,"sender_id":0,"stream_id":11,"frame_index":1,"payload_bytes":64,"media_kind":"video"},
                {"time_s":0.1,"sender_id":0,"stream_id":11,"frame_index":1,"payload_bytes":64,"media_kind":"video","fragment_index":0,"fragment_count":1}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let err = MediaScenario::load(&path, 4, 1200, 50.0)
            .expect_err("mixing implicit then explicit fragmentation should fail");
        assert!(matches!(
            err,
            MediaScenarioError::MixedFragmentSpecification {
                sender_id: 0,
                stream_id: 11,
                frame_index: 1,
                media_kind: MediaKind::Video
            }
        ));
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn inconsistent_explicit_fragment_count_is_rejected() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!(
            "media_manifest_inconsistent_frag_count_{}.json",
            std::process::id()
        ));
        let manifest = r#"{
            "frames": [
                {"time_s":0.0,"sender_id":0,"stream_id":13,"frame_index":0,"payload_bytes":64,"media_kind":"video","fragment_index":0,"fragment_count":2},
                {"time_s":0.1,"sender_id":0,"stream_id":13,"frame_index":0,"payload_bytes":64,"media_kind":"video","fragment_index":1,"fragment_count":3}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let err = MediaScenario::load(&path, 4, 1200, 50.0)
            .expect_err("inconsistent explicit fragment_count should fail");
        assert!(matches!(
            err,
            MediaScenarioError::InconsistentFragmentCount {
                sender_id: 0,
                stream_id: 13,
                frame_index: 0,
                expected_count: 2,
                observed_count: 3
            }
        ));
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn duplicate_non_explicit_frame_rows_are_rejected() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("media_manifest_dupe_frame_{}.json", std::process::id()));
        let manifest = r#"{
            "frames": [
                {"time_s":0.0,"sender_id":0,"stream_id":7,"frame_index":1,"payload_bytes":64,"media_kind":"video"},
                {"time_s":0.1,"sender_id":0,"stream_id":7,"frame_index":1,"payload_bytes":64,"media_kind":"video"}
            ]
        }"#;
        std::fs::write(&path, manifest).unwrap();
        let err = MediaScenario::load(&path, 4, 1200, 50.0).expect_err("duplicate frame rows should fail");
        assert!(format!("{err}").contains("appears multiple times"));
        let _ = std::fs::remove_file(path);
    }
}
