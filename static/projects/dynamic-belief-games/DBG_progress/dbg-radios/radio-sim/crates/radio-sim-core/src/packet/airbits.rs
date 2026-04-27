use crate::des::SimTime;

/// Hop-invariant on-air bits for FEC combining across relay copies.
/// Two packets with the same `pid()` are copies of the same original
/// and should be cooperatively combined, not treated as collisions.
#[derive(Debug, Clone)]
pub struct AirBits {
    /// Deterministic packet identifier derived from source data.
    pub pid: u32,
}

impl AirBits {
    /// Create AirBits from a seed string (deterministic).
    pub fn from_seed(seed: &str) -> Self {
        let mut hasher = crc32fast::Hasher::new();
        hasher.update(seed.as_bytes());
        AirBits {
            pid: hasher.finalize(),
        }
    }
}

/// Mutable hop-dependent metadata that changes per relay.
#[derive(Debug, Clone, Default)]
pub struct HopSidecar {
    pub hop_count: u8,
    pub first_rx_time: Option<SimTime>,
    pub relayed: bool,
}

impl HopSidecar {
    pub fn increment_hop(&mut self) {
        self.hop_count += 1;
    }
}
