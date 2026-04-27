use std::fmt::{Display, Formatter};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde::Deserialize;

use crate::des::{NodeId, SimTime};
use crate::node::Vec2;
use crate::packet::{MediaKind, PacketKind};

use super::codec::{chunk_pcm_frames, CodecConfig};

#[derive(Debug, Clone, Deserialize)]
pub struct ScenarioMessage {
    pub message_id: u32,
    pub time_s: f64,
    pub sender_id: u16,
    pub channel_id: String,
    pub audio_file: String,
}

#[derive(Debug, Clone)]
pub struct PreparedFrame {
    pub emit_time: SimTime,
    pub frame_index: u16,
    pub payload: Arc<Vec<u8>>,
}

#[derive(Debug, Clone)]
pub struct PreparedMessage {
    pub message_id: u32,
    pub sender_id: NodeId,
    pub channel_id: String,
    pub frame_duration: SimTime,
    pub total_frames: u16,
    pub frames: Vec<PreparedFrame>,
}

#[derive(Debug, Clone)]
pub struct ScheduledVoiceFrame {
    pub emit_time: SimTime,
    pub sender_id: NodeId,
    pub dest_id: Option<NodeId>,
    pub kind: PacketKind,
    pub stream_id: u32,
    pub media_kind: MediaKind,
    pub message_id: u32,
    pub frame_index: u16,
    pub fragment_index: u16,
    pub fragment_count: u16,
    pub payload: Arc<Vec<u8>>,
}

#[derive(Debug, Clone)]
pub struct Scenario {
    pub prepared_messages: Vec<PreparedMessage>,
    pub node_positions: Option<Vec<Vec2>>,
}

impl Scenario {
    pub fn load(
        comms_log_path: impl AsRef<Path>,
        audio_dir: impl AsRef<Path>,
        codec: &CodecConfig,
        num_nodes: u16,
    ) -> Result<Self, ScenarioError> {
        let json = std::fs::read_to_string(comms_log_path.as_ref())
            .map_err(|e| ScenarioError::Io(format!("failed to read comms log: {e}")))?;
        let raw: ScenarioFile = serde_json::from_str(&json)
            .map_err(|e| ScenarioError::Json(format!("failed to parse comms log json: {e}")))?;

        let mut prepared_messages = Vec::with_capacity(raw.messages.len());
        for msg in raw.messages {
            if msg.sender_id >= num_nodes {
                return Err(ScenarioError::InvalidSender {
                    sender_id: msg.sender_id,
                    num_nodes,
                });
            }
            let wav_path = audio_dir.as_ref().join(&msg.audio_file);
            let pcm = read_wav_pcm_bytes(&wav_path, codec)?;
            let frames = chunk_pcm_frames(&pcm, codec);
            let total_frames = u16::try_from(frames.len()).map_err(|_| {
                ScenarioError::FrameCountTooLarge {
                    message_id: msg.message_id,
                    frame_count: frames.len(),
                }
            })?;

            let start = SimTime::from_s(msg.time_s);
            let prepared_frames: Vec<PreparedFrame> = frames
                .into_iter()
                .enumerate()
                .map(|(i, payload)| PreparedFrame {
                    emit_time: start + SimTime::from_ms(codec.frame_duration_ms * i as f64),
                    frame_index: i as u16,
                    payload,
                })
                .collect();

            prepared_messages.push(PreparedMessage {
                message_id: msg.message_id,
                sender_id: msg.sender_id,
                channel_id: msg.channel_id,
                frame_duration: SimTime::from_ms(codec.frame_duration_ms),
                total_frames,
                frames: prepared_frames,
            });
        }

        // Extract node positions from timestep 0 if present
        let node_positions = if let Some(pos_data) = &raw.positions {
            let mut positions = Vec::with_capacity(pos_data.positions.len());
            for soldier_positions in &pos_data.positions {
                if soldier_positions.is_empty() {
                    positions.push(Vec2::ZERO);
                } else {
                    let p = &soldier_positions[0]; // timestep 0
                    positions.push(Vec2::new(
                        if p.len() > 0 { p[0] } else { 0.0 },
                        if p.len() > 1 { p[1] } else { 0.0 },
                    ));
                }
            }
            Some(positions)
        } else {
            None
        };

        Ok(Scenario {
            prepared_messages,
            node_positions,
        })
    }

    pub fn frames_for_sender(&self, sender_id: NodeId) -> Vec<ScheduledVoiceFrame> {
        let mut frames = Vec::new();
        for msg in &self.prepared_messages {
            if msg.sender_id != sender_id {
                continue;
            }
            for frame in &msg.frames {
                frames.push(ScheduledVoiceFrame {
                    emit_time: frame.emit_time,
                    sender_id: msg.sender_id,
                    dest_id: None,
                    kind: PacketKind::Voice,
                    stream_id: msg.message_id,
                    media_kind: MediaKind::Audio,
                    message_id: msg.message_id,
                    frame_index: frame.frame_index,
                    fragment_index: 0,
                    fragment_count: 1,
                    payload: frame.payload.clone(),
                });
            }
        }
        frames.sort_by_key(|f| (f.emit_time, f.frame_index));
        frames
    }

    pub fn expected_messages(&self) -> Vec<(NodeId, u32, u16, u64)> {
        self.prepared_messages
            .iter()
            .map(|m| {
                let start = m
                    .frames
                    .first()
                    .map(|f| f.emit_time)
                    .unwrap_or(SimTime::ZERO);
                let duration_ns = m
                    .frame_duration
                    .as_ns()
                    .saturating_mul(m.total_frames as u64);
                let window_end = start + SimTime(duration_ns);
                (m.sender_id, m.message_id, m.total_frames, window_end.as_ns())
            })
            .collect()
    }
}

#[derive(Debug)]
pub enum ScenarioError {
    Io(String),
    Json(String),
    Wav(String),
    InvalidSender {
        sender_id: u16,
        num_nodes: u16,
    },
    InvalidWavFormat {
        path: PathBuf,
        sample_rate_hz: u32,
        bits_per_sample: u16,
        channels: u16,
    },
    FrameCountTooLarge {
        message_id: u32,
        frame_count: usize,
    },
}

impl Display for ScenarioError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ScenarioError::Io(msg) => write!(f, "{msg}"),
            ScenarioError::Json(msg) => write!(f, "{msg}"),
            ScenarioError::Wav(msg) => write!(f, "{msg}"),
            ScenarioError::InvalidSender {
                sender_id,
                num_nodes,
            } => write!(
                f,
                "invalid sender_id {sender_id}; must be < num_nodes ({num_nodes})"
            ),
            ScenarioError::InvalidWavFormat {
                path,
                sample_rate_hz,
                bits_per_sample,
                channels,
            } => write!(
                f,
                "invalid wav format for {}: expected 24kHz/16-bit/mono, got {}Hz/{}-bit/{}ch",
                path.display(),
                sample_rate_hz,
                bits_per_sample,
                channels
            ),
            ScenarioError::FrameCountTooLarge {
                message_id,
                frame_count,
            } => write!(
                f,
                "message {message_id} produced {frame_count} frames, exceeds u16::MAX"
            ),
        }
    }
}

impl std::error::Error for ScenarioError {}

#[derive(Debug, Deserialize)]
struct ScenarioFile {
    messages: Vec<ScenarioMessage>,
    positions: Option<ScenarioPositions>,
}

#[derive(Debug, Deserialize)]
struct ScenarioPositions {
    positions: Vec<Vec<Vec<f64>>>, // [soldier][timestep][x,y,z]
    #[allow(dead_code)]
    timesteps: Option<Vec<f64>>,
    #[allow(dead_code)]
    squad_assignments: Option<Vec<u32>>,
}

fn read_wav_pcm_bytes(path: &Path, codec: &CodecConfig) -> Result<Vec<u8>, ScenarioError> {
    let bytes = std::fs::read(path)
        .map_err(|e| ScenarioError::Wav(format!("failed to read wav {}: {e}", path.display())))?;
    if bytes.len() < 44 || &bytes[..4] != b"RIFF" || &bytes[8..12] != b"WAVE" {
        return Err(ScenarioError::Wav(format!(
            "invalid wav header in {}",
            path.display()
        )));
    }

    let mut offset = 12usize;
    let mut sample_rate_hz = 0u32;
    let mut bits_per_sample = 0u16;
    let mut channels = 0u16;
    let mut data_range: Option<(usize, usize)> = None;

    while offset + 8 <= bytes.len() {
        let chunk_id = &bytes[offset..offset + 4];
        let chunk_size = u32::from_le_bytes(bytes[offset + 4..offset + 8].try_into().unwrap()) as usize;
        offset += 8;
        if offset + chunk_size > bytes.len() {
            return Err(ScenarioError::Wav(format!(
                "truncated wav chunk in {}",
                path.display()
            )));
        }

        match chunk_id {
            b"fmt " => {
                if chunk_size < 16 {
                    return Err(ScenarioError::Wav(format!(
                        "invalid fmt chunk in {}",
                        path.display()
                    )));
                }
                let audio_format =
                    u16::from_le_bytes(bytes[offset..offset + 2].try_into().unwrap());
                channels = u16::from_le_bytes(bytes[offset + 2..offset + 4].try_into().unwrap());
                sample_rate_hz =
                    u32::from_le_bytes(bytes[offset + 4..offset + 8].try_into().unwrap());
                bits_per_sample =
                    u16::from_le_bytes(bytes[offset + 14..offset + 16].try_into().unwrap());
                if audio_format != 1 {
                    return Err(ScenarioError::Wav(format!(
                        "unsupported wav format {} in {} (pcm only)",
                        audio_format,
                        path.display()
                    )));
                }
            }
            b"data" => {
                data_range = Some((offset, offset + chunk_size));
            }
            _ => {}
        }

        offset += chunk_size;
        if chunk_size % 2 == 1 {
            offset += 1;
        }
    }

    if sample_rate_hz != codec.sample_rate_hz
        || bits_per_sample != codec.bits_per_sample
        || channels != codec.channels
    {
        return Err(ScenarioError::InvalidWavFormat {
            path: path.to_path_buf(),
            sample_rate_hz,
            bits_per_sample,
            channels,
        });
    }

    let (start, end) = data_range.ok_or_else(|| {
        ScenarioError::Wav(format!("missing data chunk in {}", path.display()))
    })?;
    Ok(bytes[start..end].to_vec())
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::*;

    fn tmp_dir(prefix: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("{prefix}_{nanos}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn write_wav(path: &Path, sample_rate: u32, bits: u16, channels: u16, samples: usize) {
        let bytes_per_sample = (bits / 8) as usize;
        let data_size = samples * channels as usize * bytes_per_sample;
        let block_align = channels * (bits / 8);
        let byte_rate = sample_rate * block_align as u32;
        let chunk_size = 36 + data_size as u32;

        let mut out = Vec::with_capacity(44 + data_size);
        out.extend_from_slice(b"RIFF");
        out.extend_from_slice(&chunk_size.to_le_bytes());
        out.extend_from_slice(b"WAVE");
        out.extend_from_slice(b"fmt ");
        out.extend_from_slice(&16u32.to_le_bytes()); // PCM fmt chunk size
        out.extend_from_slice(&1u16.to_le_bytes()); // PCM format
        out.extend_from_slice(&channels.to_le_bytes());
        out.extend_from_slice(&sample_rate.to_le_bytes());
        out.extend_from_slice(&byte_rate.to_le_bytes());
        out.extend_from_slice(&block_align.to_le_bytes());
        out.extend_from_slice(&bits.to_le_bytes());
        out.extend_from_slice(b"data");
        out.extend_from_slice(&(data_size as u32).to_le_bytes());
        out.resize(44 + data_size, 0u8);

        fs::write(path, out).unwrap();
    }

    #[test]
    fn rejects_bad_wav_format() {
        let dir = tmp_dir("scenario_bad_wav");
        let audio_dir = dir.join("audio");
        fs::create_dir_all(&audio_dir).unwrap();
        write_wav(&audio_dir.join("msg_0.wav"), 8_000, 16, 1, 80);

        let json = r#"{
            "messages": [
                {
                    "message_id": 0,
                    "time_s": 0.0,
                    "sender_id": 0,
                    "channel_id": "sq0",
                    "audio_file": "msg_0.wav"
                }
            ]
        }"#;
        let comms = dir.join("comms_log.json");
        fs::write(&comms, json).unwrap();

        let err = Scenario::load(&comms, &audio_dir, &CodecConfig::default(), 2).unwrap_err();
        assert!(
            matches!(err, ScenarioError::InvalidWavFormat { .. }),
            "expected InvalidWavFormat, got {err}"
        );
    }
}
