use std::sync::Arc;

use serde::{Deserialize, Serialize};

/// Voice framing parameters for PCM payload chunking.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodecConfig {
    pub sample_rate_hz: u32,
    pub bits_per_sample: u16,
    pub channels: u16,
    pub frame_duration_ms: f64,
}

impl Default for CodecConfig {
    fn default() -> Self {
        CodecConfig {
            sample_rate_hz: 24_000,
            bits_per_sample: 16,
            channels: 1,
            frame_duration_ms: 20.0,
        }
    }
}

impl CodecConfig {
    pub fn bytes_per_sample(&self) -> usize {
        (self.bits_per_sample as usize).saturating_div(8).max(1)
    }

    pub fn frame_bytes(&self) -> usize {
        let samples_per_frame =
            ((self.sample_rate_hz as f64) * (self.frame_duration_ms / 1000.0)).round() as usize;
        samples_per_frame * self.bytes_per_sample() * self.channels as usize
    }
}

/// Split raw PCM bytes into fixed-size codec frames.
pub fn chunk_pcm_frames(pcm_data: &[u8], config: &CodecConfig) -> Vec<Arc<Vec<u8>>> {
    let frame_bytes = config.frame_bytes();
    if frame_bytes == 0 || pcm_data.is_empty() {
        return Vec::new();
    }

    let mut frames = Vec::new();
    let mut offset = 0usize;
    while offset < pcm_data.len() {
        let end = (offset + frame_bytes).min(pcm_data.len());
        let mut frame = vec![0u8; frame_bytes];
        frame[..(end - offset)].copy_from_slice(&pcm_data[offset..end]);
        frames.push(Arc::new(frame));
        offset = end;
    }
    frames
}

/// Reconstruct PCM audio from optional frames; missing frames become silence.
pub fn reconstruct_audio(frames: &[Option<Arc<Vec<u8>>>], config: &CodecConfig) -> Vec<u8> {
    let frame_bytes = config.frame_bytes();
    if frame_bytes == 0 || frames.is_empty() {
        return Vec::new();
    }

    let mut out = Vec::with_capacity(frames.len() * frame_bytes);
    for frame in frames {
        let mut dst = vec![0u8; frame_bytes];
        if let Some(payload) = frame {
            let n = payload.len().min(frame_bytes);
            dst[..n].copy_from_slice(&payload[..n]);
        }
        out.extend_from_slice(&dst);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chunks_expected_frame_count_and_size() {
        let cfg = CodecConfig::default();
        let frame_bytes = cfg.frame_bytes();
        let input = vec![1u8; frame_bytes * 2 + frame_bytes / 2];
        let frames = chunk_pcm_frames(&input, &cfg);
        assert_eq!(frames.len(), 3);
        assert!(frames.iter().all(|f| f.len() == frame_bytes));
    }

    #[test]
    fn reconstruct_inserts_silence_for_missing_frames() {
        let cfg = CodecConfig::default();
        let frame_bytes = cfg.frame_bytes();
        let frames = vec![Some(Arc::new(vec![7u8; frame_bytes])), None];
        let out = reconstruct_audio(&frames, &cfg);
        assert_eq!(out.len(), frame_bytes * 2);
        assert!(out[..frame_bytes].iter().all(|b| *b == 7));
        assert!(out[frame_bytes..].iter().all(|b| *b == 0));
    }
}
