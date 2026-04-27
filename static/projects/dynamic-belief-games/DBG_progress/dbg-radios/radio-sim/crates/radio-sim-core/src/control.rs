use serde::{Deserialize, Serialize};

use crate::packet::PacketKind;

pub const NUM_ACCESS_CATEGORIES: usize = 4;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AccessCategory {
    Vo = 0,
    Vi = 1,
    Be = 2,
    Bk = 3,
}

impl AccessCategory {
    pub const ALL: [Self; NUM_ACCESS_CATEGORIES] =
        [AccessCategory::Vo, AccessCategory::Vi, AccessCategory::Be, AccessCategory::Bk];

    pub fn index(self) -> usize {
        self as usize
    }

    pub fn short_name(self) -> &'static str {
        match self {
            AccessCategory::Vo => "vo",
            AccessCategory::Vi => "vi",
            AccessCategory::Be => "be",
            AccessCategory::Bk => "bk",
        }
    }

    pub fn from_packet_kind(kind: PacketKind) -> Option<Self> {
        match kind {
            PacketKind::Ack => None,
            PacketKind::Voice
            | PacketKind::Command
            | PacketKind::Brq
            | PacketKind::Bex
            | PacketKind::Bsc => Some(AccessCategory::Vo),
            PacketKind::Video => Some(AccessCategory::Vi),
            PacketKind::Telemetry | PacketKind::Data => Some(AccessCategory::Be),
            PacketKind::Bulk => Some(AccessCategory::Bk),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct AccessCategoryValues<T> {
    pub vo: T,
    pub vi: T,
    pub be: T,
    pub bk: T,
}

impl<T: Default> Default for AccessCategoryValues<T> {
    fn default() -> Self {
        AccessCategoryValues {
            vo: T::default(),
            vi: T::default(),
            be: T::default(),
            bk: T::default(),
        }
    }
}

impl<T> AccessCategoryValues<T> {
    pub fn new(vo: T, vi: T, be: T, bk: T) -> Self {
        AccessCategoryValues { vo, vi, be, bk }
    }

    pub fn get(&self, ac: AccessCategory) -> &T {
        match ac {
            AccessCategory::Vo => &self.vo,
            AccessCategory::Vi => &self.vi,
            AccessCategory::Be => &self.be,
            AccessCategory::Bk => &self.bk,
        }
    }

    pub fn get_mut(&mut self, ac: AccessCategory) -> &mut T {
        match ac {
            AccessCategory::Vo => &mut self.vo,
            AccessCategory::Vi => &mut self.vi,
            AccessCategory::Be => &mut self.be,
            AccessCategory::Bk => &mut self.bk,
        }
    }

    pub fn map<U, F>(self, mut f: F) -> AccessCategoryValues<U>
    where
        F: FnMut(T) -> U,
    {
        AccessCategoryValues {
            vo: f(self.vo),
            vi: f(self.vi),
            be: f(self.be),
            bk: f(self.bk),
        }
    }

    pub fn map_ref<U, F>(&self, mut f: F) -> AccessCategoryValues<U>
    where
        F: FnMut(&T) -> U,
    {
        AccessCategoryValues {
            vo: f(&self.vo),
            vi: f(&self.vi),
            be: f(&self.be),
            bk: f(&self.bk),
        }
    }
}

impl<T> std::ops::Index<AccessCategory> for AccessCategoryValues<T> {
    type Output = T;

    fn index(&self, index: AccessCategory) -> &Self::Output {
        self.get(index)
    }
}

impl<T> std::ops::IndexMut<AccessCategory> for AccessCategoryValues<T> {
    fn index_mut(&mut self, index: AccessCategory) -> &mut Self::Output {
        self.get_mut(index)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalAction {
    // ---- Axis 1: EDCA tuning (per AC, deltas around configured baseline) ----
    /// Per-AC AIFSN delta around the configured baseline.
    pub aifsn_delta: AccessCategoryValues<i8>,
    /// Per-AC CWmin exponent delta around the configured baseline.
    pub cw_min_exp_delta: AccessCategoryValues<i8>,
    /// Per-AC CWmax exponent delta around the configured baseline.
    pub cw_max_exp_delta: AccessCategoryValues<i8>,
    /// Per-AC TXOP limit delta in microseconds around the configured baseline.
    pub txop_limit_us_delta: AccessCategoryValues<i32>,

    // ---- Axis 2: Queue management (per AC, imperative, applied this tick) ----
    /// Drop the N oldest packets from this AC's queue. 0 = no-op.
    #[serde(default)]
    pub purge_oldest: AccessCategoryValues<u16>,
    /// Drop packets whose head-of-line age (now - creation_time) exceeds the
    /// threshold in milliseconds. 0 = no-op.
    #[serde(default)]
    pub purge_older_than_ms: AccessCategoryValues<u32>,

    // ---- Axis 3: Admission control (per AC, persistent until next change) ----
    /// Per-AC runtime queue cap that overrides the global `node_queue_size`.
    /// `None` keeps the global cap.
    #[serde(default)]
    pub max_queue_len: AccessCategoryValues<Option<u16>>,
    /// Per-AC token-bucket emit-rate ceiling in packets per second for new
    /// arrivals. `None` removes the cap.
    #[serde(default)]
    pub rate_cap_pps: AccessCategoryValues<Option<f32>>,

    // ---- Axis 4: Stream-level controls (cross-cuts AC, persistent) ----
    /// Stream IDs to add to the paused set. Subsequent enqueues for those
    /// streams are silently dropped at admission.
    #[serde(default)]
    pub pause_streams: Vec<u32>,
    /// Stream IDs to remove from the paused set.
    #[serde(default)]
    pub resume_streams: Vec<u32>,
    /// Stream IDs whose currently-queued packets should be flushed this tick.
    #[serde(default)]
    pub drop_streams: Vec<u32>,
    /// Reclassify subsequent enqueues for these `stream_id`s into the target
    /// access category, overriding the packet-kind classifier.
    #[serde(default)]
    pub reclassify_streams: Vec<(u32, AccessCategory)>,
}

impl Default for LocalAction {
    fn default() -> Self {
        LocalAction {
            aifsn_delta: AccessCategoryValues::default(),
            cw_min_exp_delta: AccessCategoryValues::default(),
            cw_max_exp_delta: AccessCategoryValues::default(),
            txop_limit_us_delta: AccessCategoryValues::default(),
            purge_oldest: AccessCategoryValues::default(),
            purge_older_than_ms: AccessCategoryValues::default(),
            max_queue_len: AccessCategoryValues::new(None, None, None, None),
            rate_cap_pps: AccessCategoryValues::new(None, None, None, None),
            pause_streams: Vec::new(),
            resume_streams: Vec::new(),
            drop_streams: Vec::new(),
            reclassify_streams: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObservationWindowConfig {
    /// Control/observation interval in milliseconds.
    pub interval_ms: f64,
}

impl Default for ObservationWindowConfig {
    fn default() -> Self {
        ObservationWindowConfig { interval_ms: 250.0 }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MacControlCounters {
    pub tx_attempts: AccessCategoryValues<u64>,
    pub tx_success: AccessCategoryValues<u64>,
    pub retries: AccessCategoryValues<u64>,
    pub ack_timeouts: AccessCategoryValues<u64>,
    pub drops: AccessCategoryValues<u64>,
    pub internal_collisions: AccessCategoryValues<u64>,
    pub txop_grants: AccessCategoryValues<u64>,
    pub txop_uses: AccessCategoryValues<u64>,
    pub collisions: u64,
    pub cca_busy_samples: u64,
    pub cca_total_samples: u64,
    pub backoff_counter_sum: u64,
    pub backoff_sample_count: u64,
}

impl MacControlCounters {
    pub fn saturating_sub(&self, prev: &Self) -> Self {
        MacControlCounters {
            tx_attempts: AccessCategoryValues::new(
                self.tx_attempts.vo.saturating_sub(prev.tx_attempts.vo),
                self.tx_attempts.vi.saturating_sub(prev.tx_attempts.vi),
                self.tx_attempts.be.saturating_sub(prev.tx_attempts.be),
                self.tx_attempts.bk.saturating_sub(prev.tx_attempts.bk),
            ),
            tx_success: AccessCategoryValues::new(
                self.tx_success.vo.saturating_sub(prev.tx_success.vo),
                self.tx_success.vi.saturating_sub(prev.tx_success.vi),
                self.tx_success.be.saturating_sub(prev.tx_success.be),
                self.tx_success.bk.saturating_sub(prev.tx_success.bk),
            ),
            retries: AccessCategoryValues::new(
                self.retries.vo.saturating_sub(prev.retries.vo),
                self.retries.vi.saturating_sub(prev.retries.vi),
                self.retries.be.saturating_sub(prev.retries.be),
                self.retries.bk.saturating_sub(prev.retries.bk),
            ),
            ack_timeouts: AccessCategoryValues::new(
                self.ack_timeouts.vo.saturating_sub(prev.ack_timeouts.vo),
                self.ack_timeouts.vi.saturating_sub(prev.ack_timeouts.vi),
                self.ack_timeouts.be.saturating_sub(prev.ack_timeouts.be),
                self.ack_timeouts.bk.saturating_sub(prev.ack_timeouts.bk),
            ),
            drops: AccessCategoryValues::new(
                self.drops.vo.saturating_sub(prev.drops.vo),
                self.drops.vi.saturating_sub(prev.drops.vi),
                self.drops.be.saturating_sub(prev.drops.be),
                self.drops.bk.saturating_sub(prev.drops.bk),
            ),
            internal_collisions: AccessCategoryValues::new(
                self.internal_collisions
                    .vo
                    .saturating_sub(prev.internal_collisions.vo),
                self.internal_collisions
                    .vi
                    .saturating_sub(prev.internal_collisions.vi),
                self.internal_collisions
                    .be
                    .saturating_sub(prev.internal_collisions.be),
                self.internal_collisions
                    .bk
                    .saturating_sub(prev.internal_collisions.bk),
            ),
            txop_grants: AccessCategoryValues::new(
                self.txop_grants.vo.saturating_sub(prev.txop_grants.vo),
                self.txop_grants.vi.saturating_sub(prev.txop_grants.vi),
                self.txop_grants.be.saturating_sub(prev.txop_grants.be),
                self.txop_grants.bk.saturating_sub(prev.txop_grants.bk),
            ),
            txop_uses: AccessCategoryValues::new(
                self.txop_uses.vo.saturating_sub(prev.txop_uses.vo),
                self.txop_uses.vi.saturating_sub(prev.txop_uses.vi),
                self.txop_uses.be.saturating_sub(prev.txop_uses.be),
                self.txop_uses.bk.saturating_sub(prev.txop_uses.bk),
            ),
            collisions: self.collisions.saturating_sub(prev.collisions),
            cca_busy_samples: self
                .cca_busy_samples
                .saturating_sub(prev.cca_busy_samples),
            cca_total_samples: self
                .cca_total_samples
                .saturating_sub(prev.cca_total_samples),
            backoff_counter_sum: self
                .backoff_counter_sum
                .saturating_sub(prev.backoff_counter_sum),
            backoff_sample_count: self
                .backoff_sample_count
                .saturating_sub(prev.backoff_sample_count),
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AccessCategoryRuntimeSnapshot {
    pub queue_len: AccessCategoryValues<u32>,
    pub head_of_line_age_ns: AccessCategoryValues<u64>,
    pub retry_count: AccessCategoryValues<u32>,
    pub backoff_stage: AccessCategoryValues<u8>,
    pub backoff_slots: AccessCategoryValues<u32>,
    pub current_cw_exp: AccessCategoryValues<u8>,
}

/// Interval-aggregated counts of how many times each control-action axis
/// took effect since the last observation. Lets the agent verify that the
/// actions it sent actually applied (and how many packets each touched).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ActionOutcomeCounters {
    /// Packets actually purged by `purge_oldest` per AC.
    pub purged_oldest: AccessCategoryValues<u32>,
    /// Packets actually purged by `purge_older_than_ms` per AC.
    pub purged_older_than: AccessCategoryValues<u32>,
    /// Enqueues rejected by per-AC `max_queue_len` runtime override.
    pub admission_drops: AccessCategoryValues<u32>,
    /// Enqueues rejected by per-AC `rate_cap_pps` token bucket.
    pub rate_cap_drops: AccessCategoryValues<u32>,
    /// Enqueues silently dropped because the stream is in the paused set.
    pub stream_paused_drops: u32,
    /// Packets flushed by `drop_streams` action this interval.
    pub stream_flush_drops: u32,
    /// Enqueues whose AC mapping was overridden by `reclassify_streams`.
    pub stream_reclassifications: u32,
}

impl ActionOutcomeCounters {
    pub fn saturating_sub(&self, prev: &Self) -> Self {
        ActionOutcomeCounters {
            purged_oldest: AccessCategoryValues::new(
                self.purged_oldest.vo.saturating_sub(prev.purged_oldest.vo),
                self.purged_oldest.vi.saturating_sub(prev.purged_oldest.vi),
                self.purged_oldest.be.saturating_sub(prev.purged_oldest.be),
                self.purged_oldest.bk.saturating_sub(prev.purged_oldest.bk),
            ),
            purged_older_than: AccessCategoryValues::new(
                self.purged_older_than.vo.saturating_sub(prev.purged_older_than.vo),
                self.purged_older_than.vi.saturating_sub(prev.purged_older_than.vi),
                self.purged_older_than.be.saturating_sub(prev.purged_older_than.be),
                self.purged_older_than.bk.saturating_sub(prev.purged_older_than.bk),
            ),
            admission_drops: AccessCategoryValues::new(
                self.admission_drops.vo.saturating_sub(prev.admission_drops.vo),
                self.admission_drops.vi.saturating_sub(prev.admission_drops.vi),
                self.admission_drops.be.saturating_sub(prev.admission_drops.be),
                self.admission_drops.bk.saturating_sub(prev.admission_drops.bk),
            ),
            rate_cap_drops: AccessCategoryValues::new(
                self.rate_cap_drops.vo.saturating_sub(prev.rate_cap_drops.vo),
                self.rate_cap_drops.vi.saturating_sub(prev.rate_cap_drops.vi),
                self.rate_cap_drops.be.saturating_sub(prev.rate_cap_drops.be),
                self.rate_cap_drops.bk.saturating_sub(prev.rate_cap_drops.bk),
            ),
            stream_paused_drops: self.stream_paused_drops.saturating_sub(prev.stream_paused_drops),
            stream_flush_drops: self.stream_flush_drops.saturating_sub(prev.stream_flush_drops),
            stream_reclassifications: self
                .stream_reclassifications
                .saturating_sub(prev.stream_reclassifications),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalObservation {
    pub node_id: u16,
    pub time_ns: u64,
    pub queue_len: AccessCategoryValues<u32>,
    pub head_of_line_age_ns: AccessCategoryValues<u64>,
    pub retry_count: AccessCategoryValues<u32>,
    pub backoff_stage: AccessCategoryValues<u8>,
    pub backoff_slots: AccessCategoryValues<u32>,
    pub current_cw_exp: AccessCategoryValues<u8>,
    pub tx_attempts: AccessCategoryValues<u32>,
    pub tx_success: AccessCategoryValues<u32>,
    pub retries: AccessCategoryValues<u32>,
    pub ack_timeouts: AccessCategoryValues<u32>,
    pub drops: AccessCategoryValues<u32>,
    pub deliveries: AccessCategoryValues<u32>,
    pub p95_latency_ns: AccessCategoryValues<u64>,
    pub internal_collisions: AccessCategoryValues<u32>,
    pub txop_grants: AccessCategoryValues<u32>,
    pub txop_uses: AccessCategoryValues<u32>,
    pub collisions: u32,
    pub cca_busy_fraction: f64,
    pub mean_backoff_slots: f64,
    /// Counts of how many times each control axis actually fired this interval.
    /// All zero when the overlay was silent.
    #[serde(default)]
    pub action_outcomes: ActionOutcomeCounters,
    /// Stream IDs that currently have queued packets at this node. Lets the
    /// agent target stream-level actions without scanning every packet.
    #[serde(default)]
    pub streams_present: Vec<u32>,
}
