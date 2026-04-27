use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::control::{AccessCategory, AccessCategoryValues};
use crate::des::SlotRole;
use crate::media::scenario::RawMediaEntry;
pub use crate::voice::codec::CodecConfig;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigError {
    field: &'static str,
    message: &'static str,
}

impl ConfigError {
    fn new(field: &'static str, message: &'static str) -> Self {
        ConfigError { field, message }
    }
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "invalid config {}: {}", self.field, self.message)
    }
}

impl std::error::Error for ConfigError {}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimConfig {
    pub general: GeneralConfig,
    pub phy: PhyConfig,
    pub mac: MacConfig,
    pub traffic: TrafficConfig,
    #[serde(default)]
    pub conformance: ConformanceConfig,
    #[serde(default)]
    pub control_overlay: ControlOverlayConfig,
    #[serde(default)]
    pub experimental: ExperimentalConfig,
}

impl Default for SimConfig {
    fn default() -> Self {
        SimConfig {
            general: GeneralConfig::default(),
            phy: PhyConfig::default(),
            mac: MacConfig::Tdma(TdmaConfig::default()),
            traffic: TrafficConfig::default(),
            conformance: ConformanceConfig::default(),
            control_overlay: ControlOverlayConfig::default(),
            experimental: ExperimentalConfig::default(),
        }
    }
}

impl SimConfig {
    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.general.num_nodes == 0 {
            return Err(ConfigError::new(
                "general.num_nodes",
                "must be >= 1",
            ));
        }
        if !self.general.area_size_m.is_finite() || self.general.area_size_m <= 0.0 {
            return Err(ConfigError::new(
                "general.area_size_m",
                "must be finite and > 0",
            ));
        }
        if !self.general.sim_duration_s.is_finite() || self.general.sim_duration_s <= 0.0 {
            return Err(ConfigError::new(
                "general.sim_duration_s",
                "must be finite and > 0",
            ));
        }
        let baseline_is_nonempty = self
            .conformance
            .baseline_path
            .as_deref()
            .map(|p| !p.trim().is_empty())
            .unwrap_or(false);
        if self.conformance.baseline_path.is_some() && !baseline_is_nonempty {
            return Err(ConfigError::new(
                "conformance.baseline_path",
                "must not be empty when set",
            ));
        }
        if baseline_is_nonempty && self.conformance.profile == ConformanceProfile::None {
            return Err(ConfigError::new(
                "conformance.baseline_path",
                "requires conformance.profile != none",
            ));
        }
        if self.conformance.require_baseline && !baseline_is_nonempty {
            return Err(ConfigError::new(
                "conformance.require_baseline",
                "requires conformance.baseline_path",
            ));
        }
        if matches!(
            self.conformance.strictness,
            GateStrictness::Tiered | GateStrictness::Hard
        ) && !baseline_is_nonempty
        {
            return Err(ConfigError::new(
                "conformance.strictness",
                "tiered/hard requires conformance.baseline_path",
            ));
        }
        if self.conformance.scenario_set.trim().is_empty() {
            return Err(ConfigError::new(
                "conformance.scenario_set",
                "must not be empty",
            ));
        }
        if !self.control_overlay.observation_interval_ms.is_finite()
            || self.control_overlay.observation_interval_ms <= 0.0
        {
            return Err(ConfigError::new(
                "control_overlay.observation_interval_ms",
                "must be finite and > 0",
            ));
        }
        if !self.phy.shadowing_std_db.is_finite() || self.phy.shadowing_std_db < 0.0 {
            return Err(ConfigError::new(
                "phy.shadowing_std_db",
                "must be finite and >= 0",
            ));
        }
        if (self.phy.los_k_factor - PhyConfig::default().los_k_factor).abs() > f64::EPSILON {
            return Err(ConfigError::new(
                "phy.los_k_factor",
                "non-default value is unsupported",
            ));
        }
        if (self.phy.los_threshold_m - PhyConfig::default().los_threshold_m).abs() > f64::EPSILON {
            return Err(ConfigError::new(
                "phy.los_threshold_m",
                "non-default value is unsupported",
            ));
        }
        if (self.phy.snr_threshold_db - PhyConfig::default().snr_threshold_db).abs() > f64::EPSILON {
            return Err(ConfigError::new(
                "phy.snr_threshold_db",
                "non-default value is unsupported",
            ));
        }

        match &self.mac {
            MacConfig::Tdma(cfg) => {
                if cfg.slot_roles.is_empty() {
                    return Err(ConfigError::new(
                        "mac.tdma.slot_roles",
                        "must not be empty",
                    ));
                }
                if !cfg.slot_roles.iter().any(|r| *r == SlotRole::DLC) {
                    return Err(ConfigError::new(
                        "mac.tdma.slot_roles",
                        "must contain at least one DLC slot",
                    ));
                }
                if cfg.slots_per_frame as usize != cfg.slot_roles.len() {
                    return Err(ConfigError::new(
                        "mac.tdma.slots_per_frame",
                        "must equal mac.tdma.slot_roles length",
                    ));
                }
                if !cfg.slot_duration_ms.is_finite() || cfg.slot_duration_ms <= 0.0 {
                    return Err(ConfigError::new(
                        "mac.tdma.slot_duration_ms",
                        "must be finite and > 0",
                    ));
                }
                if cfg.m_pipeline == 0 {
                    return Err(ConfigError::new(
                        "mac.tdma.m_pipeline",
                        "must be >= 1",
                    ));
                }
                if !cfg.guard_time_us.is_finite() || cfg.guard_time_us < 0.0 {
                    return Err(ConfigError::new(
                        "mac.tdma.guard_time_us",
                        "must be finite and >= 0",
                    ));
                }
                if cfg.node_queue_size == 0 {
                    return Err(ConfigError::new(
                        "mac.tdma.node_queue_size",
                        "must be >= 1",
                    ));
                }
                if !(0.0..=1.0).contains(&cfg.source_probability) {
                    return Err(ConfigError::new(
                        "mac.tdma.source_probability",
                        "must be in [0,1]",
                    ));
                }
                if !(0.0..=1.0).contains(&cfg.broadcast_probability) {
                    return Err(ConfigError::new(
                        "mac.tdma.broadcast_probability",
                        "must be in [0,1]",
                    ));
                }
                if cfg.hop_diameter == 0 {
                    return Err(ConfigError::new(
                        "mac.tdma.hop_diameter",
                        "must be >= 1",
                    ));
                }
                if cfg.enable_sic {
                    return Err(ConfigError::new(
                        "mac.tdma.enable_sic",
                        "must be false (unsupported)",
                    ));
                }
            }
            MacConfig::Csma(cfg) => {
                if !cfg.slot_duration_us.is_finite() || cfg.slot_duration_us <= 0.0 {
                    return Err(ConfigError::new(
                        "mac.csma.slot_duration_us",
                        "must be finite and > 0",
                    ));
                }
                if !cfg.sifs_us.is_finite() || cfg.sifs_us < 0.0 {
                    return Err(ConfigError::new(
                        "mac.csma.sifs_us",
                        "must be finite and >= 0",
                    ));
                }
                if !cfg.ack_timeout_us.is_finite() || cfg.ack_timeout_us < 0.0 {
                    return Err(ConfigError::new(
                        "mac.csma.ack_timeout_us",
                        "must be finite and >= 0",
                    ));
                }
                if !cfg.data_rate_bps.is_finite() || cfg.data_rate_bps <= 0.0 {
                    return Err(ConfigError::new(
                        "mac.csma.data_rate_bps",
                        "must be finite and > 0",
                    ));
                }
                if cfg
                    .control_rate_bps
                    .is_some_and(|rate| !rate.is_finite() || rate <= 0.0)
                {
                    return Err(ConfigError::new(
                        "mac.csma.control_rate_bps",
                        "must be finite and > 0 when set",
                    ));
                }
                if !cfg.capture_margin_db.is_finite() || cfg.capture_margin_db < 0.0 {
                    return Err(ConfigError::new(
                        "mac.csma.capture_margin_db",
                        "must be finite and >= 0",
                    ));
                }
                if !cfg.preamble_us.is_finite() || cfg.preamble_us < 0.0 {
                    return Err(ConfigError::new(
                        "mac.csma.preamble_us",
                        "must be finite and >= 0",
                    ));
                }
                if cfg
                    .rx_sensitivity_dbm
                    .is_some_and(|threshold| !threshold.is_finite())
                {
                    return Err(ConfigError::new(
                        "mac.csma.rx_sensitivity_dbm",
                        "must be finite when set",
                    ));
                }
                if cfg
                    .preamble_detect_sinr_db
                    .is_some_and(|threshold| !threshold.is_finite())
                {
                    return Err(ConfigError::new(
                        "mac.csma.preamble_detect_sinr_db",
                        "must be finite when set",
                    ));
                }
                if cfg
                    .payload_decode_sinr_db
                    .is_some_and(|threshold| !threshold.is_finite())
                {
                    return Err(ConfigError::new(
                        "mac.csma.payload_decode_sinr_db",
                        "must be finite when set",
                    ));
                }
                if cfg.node_queue_size == 0 {
                    return Err(ConfigError::new(
                        "mac.csma.node_queue_size",
                        "must be >= 1",
                    ));
                }
                if !(0.0..=1.0).contains(&cfg.source_probability) {
                    return Err(ConfigError::new(
                        "mac.csma.source_probability",
                        "must be in [0,1]",
                    ));
                }
                if !(0.0..=1.0).contains(&cfg.broadcast_probability) {
                    return Err(ConfigError::new(
                        "mac.csma.broadcast_probability",
                        "must be in [0,1]",
                    ));
                }
                if cfg.enable_rts_cts {
                    return Err(ConfigError::new(
                        "mac.csma.enable_rts_cts",
                        "must be false (unsupported)",
                    ));
                }
                for ac in AccessCategory::ALL {
                    let params = &cfg.edca[ac];
                    if params.aifsn == 0 {
                        return Err(ConfigError::new(
                            "mac.csma.edca",
                            "aifsn must be >= 1 for every access category",
                        ));
                    }
                    if params.cw_min_exp == 0 {
                        return Err(ConfigError::new(
                            "mac.csma.edca",
                            "cw_min_exp must be >= 1 for every access category",
                        ));
                    }
                    if params.cw_max_exp < params.cw_min_exp {
                        return Err(ConfigError::new(
                            "mac.csma.edca",
                            "cw_max_exp must be >= cw_min_exp for every access category",
                        ));
                    }
                    if !params.txop_limit_us.is_finite() || params.txop_limit_us < 0.0 {
                        return Err(ConfigError::new(
                            "mac.csma.edca",
                            "txop_limit_us must be finite and >= 0 for every access category",
                        ));
                    }
                }
            }
        }

        match self.conformance.profile {
            ConformanceProfile::None => {}
            ConformanceProfile::SilvusV1 => {
                if !matches!(self.mac, MacConfig::Csma(_)) {
                    return Err(ConfigError::new(
                        "conformance.profile",
                        "silvus_v1 requires mac.csma",
                    ));
                }
            }
            ConformanceProfile::TsmV1 => {
                if !matches!(self.mac, MacConfig::Tdma(_)) {
                    return Err(ConfigError::new(
                        "conformance.profile",
                        "tsm_v1 requires mac.tdma",
                    ));
                }
            }
        }

        let mix = &self.traffic.class_mix;
        if mix.command < 0.0 || mix.voice < 0.0 || mix.best_effort < 0.0 {
            return Err(ConfigError::new(
                "traffic.class_mix",
                "weights must be >= 0",
            ));
        }
        let mix_sum = mix.command + mix.voice + mix.best_effort;
        if !mix_sum.is_finite() || mix_sum <= 0.0 {
            return Err(ConfigError::new(
                "traffic.class_mix",
                "weights must sum to > 0",
            ));
        }
        if self.traffic.mtu_bytes == 0 {
            return Err(ConfigError::new(
                "traffic.mtu_bytes",
                "must be >= 1",
            ));
        }
        if !self.traffic.playout_slack_ms.is_finite() || self.traffic.playout_slack_ms < 0.0 {
            return Err(ConfigError::new(
                "traffic.playout_slack_ms",
                "must be finite and >= 0",
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralConfig {
    pub num_nodes: u16,
    pub area_size_m: f64,
    pub sim_duration_s: f64,
    pub seed: u64,
}

impl Default for GeneralConfig {
    fn default() -> Self {
        GeneralConfig {
            num_nodes: 35,
            area_size_m: 1000.0,
            sim_duration_s: 10.0,
            seed: 42,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControlOverlayConfig {
    pub enabled: bool,
    /// Observation interval in milliseconds.
    pub observation_interval_ms: f64,
}

impl Default for ControlOverlayConfig {
    fn default() -> Self {
        ControlOverlayConfig {
            enabled: false,
            observation_interval_ms: 250.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentalConfig {
    pub csma_v2: bool,
    pub overlay_v2: bool,
    pub metrics_v2: bool,
}

impl Default for ExperimentalConfig {
    fn default() -> Self {
        ExperimentalConfig {
            csma_v2: false,
            overlay_v2: false,
            metrics_v2: false,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConformanceProfile {
    None,
    SilvusV1,
    TsmV1,
}

impl Default for ConformanceProfile {
    fn default() -> Self {
        ConformanceProfile::None
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GateStrictness {
    Advisory,
    Tiered,
    Hard,
}

impl Default for GateStrictness {
    fn default() -> Self {
        GateStrictness::Advisory
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConformanceConfig {
    #[serde(default)]
    pub profile: ConformanceProfile,
    #[serde(default)]
    pub strictness: GateStrictness,
    #[serde(default)]
    pub baseline_path: Option<String>,
    #[serde(default)]
    pub require_baseline: bool,
    #[serde(default = "default_conformance_scenario_set")]
    pub scenario_set: String,
}

impl Default for ConformanceConfig {
    fn default() -> Self {
        ConformanceConfig {
            profile: ConformanceProfile::None,
            strictness: GateStrictness::Advisory,
            baseline_path: None,
            require_baseline: false,
            scenario_set: default_conformance_scenario_set(),
        }
    }
}

fn default_conformance_scenario_set() -> String {
    "core_v1".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhyConfig {
    pub tx_power_w: f64,
    pub carrier_freq_hz: f64,
    pub rx_bandwidth_hz: f64,
    pub noise_figure_db: f64,
    #[serde(default)]
    pub cca_mode: CcaMode,
    pub path_loss_model: PathLossModel,
    pub path_loss_exponent: f64,
    pub reference_distance_m: f64,
    pub tx_antenna_height_m: f64,
    pub rx_antenna_height_m: f64,
    pub shadowing_std_db: f64,
    pub k_factor: f64,
    pub los_k_factor: f64,
    pub los_threshold_m: f64,
    pub snr_threshold_db: f64,
    pub enable_fading: bool,
    pub node_velocity_mps: f64,
}

impl Default for PhyConfig {
    fn default() -> Self {
        PhyConfig {
            tx_power_w: 5.0,
            carrier_freq_hz: 2.4e9,
            rx_bandwidth_hz: 20e6,
            noise_figure_db: 6.0,
            cca_mode: CcaMode::default(),
            path_loss_model: PathLossModel::MultiSlope,
            path_loss_exponent: 2.2,
            reference_distance_m: 1.0,
            tx_antenna_height_m: 1.5,
            rx_antenna_height_m: 1.5,
            shadowing_std_db: 6.0,
            k_factor: 0.0,
            los_k_factor: 6.0,
            los_threshold_m: 50.0,
            snr_threshold_db: 0.0,
            enable_fading: false,
            node_velocity_mps: 0.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PathLossModel {
    LogDistance,
    MultiSlope,
    FreeSpace,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CcaMode {
    StrongestSignal,
    AggregateEnergy,
}

impl Default for CcaMode {
    fn default() -> Self {
        CcaMode::StrongestSignal
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MacConfig {
    Tdma(TdmaConfig),
    Csma(CsmaConfig),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TdmaConfig {
    pub slots_per_frame: u16,
    pub slot_duration_ms: f64,
    pub slot_roles: Vec<SlotRole>,
    pub m_pipeline: u8,
    pub max_hops: u8,
    pub guard_time_us: f64,
    #[serde(default)]
    pub guard_fallback_mode: GuardFallbackMode,
    pub combining_mode: CombiningMode,
    pub capture_beta_db: CaptureBeta,
    pub enable_sic: bool,
    pub drain_slots: u8,
    pub hop_diameter: u8,
    pub source_probability: f64,
    pub broadcast_probability: f64,
    pub node_queue_size: u16,
}

impl Default for TdmaConfig {
    fn default() -> Self {
        TdmaConfig {
            slots_per_frame: 12,
            slot_duration_ms: 2.5,
            slot_roles: vec![
                SlotRole::RLC,
                SlotRole::CLC,
                SlotRole::DLC,
                SlotRole::DLC,
                SlotRole::DLC,
                SlotRole::RLC,
                SlotRole::DLC,
                SlotRole::DLC,
                SlotRole::DLC,
                SlotRole::DLC,
                SlotRole::DLC,
                SlotRole::DLC,
            ],
            m_pipeline: 3,
            max_hops: 5,
            guard_time_us: 5.0,
            guard_fallback_mode: GuardFallbackMode::StrongestFallback,
            combining_mode: CombiningMode::MRC,
            capture_beta_db: CaptureBeta::default(),
            enable_sic: false,
            drain_slots: 2,
            hop_diameter: 8,
            source_probability: 0.2,
            broadcast_probability: 0.3,
            node_queue_size: 10,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsmaConfig {
    pub slot_duration_us: f64,
    pub sifs_us: f64,
    pub cca_threshold_dbm: f64,
    pub edca: AccessCategoryValues<CsmaAccessCategoryConfig>,
    pub ack_timeout_us: f64,
    pub max_retries: u8,
    pub ack_bits: u32,
    pub source_probability: f64,
    pub broadcast_probability: f64,
    pub enable_rts_cts: bool,
    /// Data rate in bits per second for TX duration calculation.
    pub data_rate_bps: f64,
    /// Optional control/ACK rate in bits per second. Defaults to `data_rate_bps`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub control_rate_bps: Option<f64>,
    /// OFDM preamble duration in microseconds.
    pub preamble_us: f64,
    /// Minimum received power required to treat an arrival as a packet candidate.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rx_sensitivity_dbm: Option<f64>,
    /// Minimum preamble-window SINR required to treat an arrival as detected.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub preamble_detect_sinr_db: Option<f64>,
    /// Minimum payload-window SINR required to decode a detected packet.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payload_decode_sinr_db: Option<f64>,
    /// Capture margin required for strongest-signal decode in collisions.
    #[serde(default = "default_capture_margin_db")]
    pub capture_margin_db: f64,
    /// Maximum per-node queue size.
    pub node_queue_size: u16,
}

impl Default for CsmaConfig {
    fn default() -> Self {
        CsmaConfig {
            slot_duration_us: 9.0,
            sifs_us: 16.0,
            cca_threshold_dbm: -82.0,
            edca: AccessCategoryValues::new(
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 2,
                    cw_max_exp: 3,
                    txop_limit_us: 1504.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 3,
                    cw_max_exp: 4,
                    txop_limit_us: 3008.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 3,
                    cw_min_exp: 4,
                    cw_max_exp: 10,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 7,
                    cw_min_exp: 4,
                    cw_max_exp: 10,
                    txop_limit_us: 0.0,
                },
            ),
            ack_timeout_us: 100.0,
            max_retries: 3,
            ack_bits: 112,
            source_probability: 0.2,
            broadcast_probability: 0.3,
            enable_rts_cts: false,
            data_rate_bps: 6e6,  // 6 Mbps (conservative 802.11a)
            control_rate_bps: None,
            preamble_us: 20.0,   // OFDM preamble
            rx_sensitivity_dbm: None,
            preamble_detect_sinr_db: None,
            payload_decode_sinr_db: None,
            capture_margin_db: default_capture_margin_db(),
            node_queue_size: 64,
        }
    }
}

fn default_capture_margin_db() -> f64 {
    6.0
}

impl CsmaConfig {
    pub fn effective_control_rate_bps(&self) -> f64 {
        self.control_rate_bps.unwrap_or(self.data_rate_bps)
    }

    pub fn effective_rx_sensitivity_dbm(&self) -> f64 {
        self.rx_sensitivity_dbm.unwrap_or(self.cca_threshold_dbm)
    }

    pub fn effective_payload_decode_sinr_db(&self) -> f64 {
        self.payload_decode_sinr_db.unwrap_or(4.0)
    }

    pub fn effective_preamble_detect_sinr_db(&self) -> f64 {
        self.preamble_detect_sinr_db
            .unwrap_or_else(|| self.effective_payload_decode_sinr_db())
    }

    pub fn aifs_us(&self, ac: AccessCategory) -> f64 {
        self.sifs_us + self.edca[ac].aifsn as f64 * self.slot_duration_us
    }

    /// Derived EIFS = SIFS + ACK_duration + AIFS(BE).
    pub fn eifs_us(&self) -> f64 {
        let ack_airtime_us =
            self.preamble_us + (self.ack_bits as f64 / self.effective_control_rate_bps()) * 1e6;
        self.sifs_us + ack_airtime_us + self.aifs_us(AccessCategory::Be)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsmaAccessCategoryConfig {
    pub aifsn: u8,
    pub cw_min_exp: u8,
    pub cw_max_exp: u8,
    pub txop_limit_us: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum CombiningMode {
    MRC,
    EGC,
    SC,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GuardFallbackMode {
    Strict,
    StrongestFallback,
}

impl Default for GuardFallbackMode {
    fn default() -> Self {
        GuardFallbackMode::StrongestFallback
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureBeta {
    pub rlc_db: f64,
    pub dlc_db: f64,
    pub clc_db: f64,
}

impl Default for CaptureBeta {
    fn default() -> Self {
        CaptureBeta {
            rlc_db: 4.0,
            dlc_db: 8.0,
            clc_db: 10.0,
        }
    }
}

impl CaptureBeta {
    pub fn for_role(&self, role: SlotRole) -> f64 {
        match role {
            SlotRole::DLC => self.dlc_db,
            SlotRole::RLC => self.rlc_db,
            SlotRole::CLC => self.clc_db,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficConfig {
    pub model: TrafficModel,
    pub packet_bits: u32,
    #[serde(default = "default_mtu_bytes")]
    pub mtu_bytes: u16,
    #[serde(default = "default_playout_slack_ms")]
    pub playout_slack_ms: f64,
    #[serde(default)]
    pub codec: CodecConfig,
    #[serde(default)]
    pub class_mix: TrafficClassMix,
}

impl Default for TrafficConfig {
    fn default() -> Self {
        TrafficConfig {
            model: TrafficModel::Bernoulli,
            packet_bits: 1024,
            mtu_bytes: default_mtu_bytes(),
            playout_slack_ms: default_playout_slack_ms(),
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
        }
    }
}

fn default_mtu_bytes() -> u16 {
    1200
}

fn default_playout_slack_ms() -> f64 {
    50.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficClassMix {
    pub command: f64,
    pub voice: f64,
    pub best_effort: f64,
}

impl Default for TrafficClassMix {
    fn default() -> Self {
        TrafficClassMix {
            command: 0.2,
            voice: 0.3,
            best_effort: 0.5,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TrafficModel {
    Bernoulli,
    Poisson { rate_per_slot: f64 },
    Scenario {
        comms_log_path: String,
        audio_dir: String,
    },
    MediaScenario {
        manifest_path: String,
    },
    /// Inject pre-built media frames (e.g., real Opus voice) directly without a
    /// manifest file. Skipped from serde so it can never be loaded from TOML;
    /// constructed at runtime via the Python `set_media_frames` binding or by
    /// directly mutating `SimConfig` in Rust. Reuses `TrafficConfig::mtu_bytes`
    /// and `TrafficConfig::playout_slack_ms`.
    #[serde(skip)]
    MediaInMemory { entries: Arc<Vec<RawMediaEntry>> },
    // OnOff and Periodic removed — will be replaced by codec-driven application sources.
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eifs_uses_ack_airtime() {
        let cfg = CsmaConfig {
            sifs_us: 10.0,
            slot_duration_us: 10.0,
            edca: AccessCategoryValues::new(
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 2,
                    cw_max_exp: 3,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 3,
                    cw_max_exp: 4,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 4,
                    cw_max_exp: 10,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 7,
                    cw_min_exp: 4,
                    cw_max_exp: 10,
                    txop_limit_us: 0.0,
                },
            ),
            ack_bits: 200,
            data_rate_bps: 2e6,
            control_rate_bps: Some(1e6),
            preamble_us: 20.0,
            ..CsmaConfig::default()
        };
        let ack_airtime = 20.0 + (200.0 / 1e6) * 1e6; // 220us
        let expected = 10.0 + ack_airtime + 30.0;
        assert!((cfg.eifs_us() - expected).abs() < 1e-9);
    }

    #[test]
    fn csma_validation_rejects_non_positive_control_rate() {
        let cfg = SimConfig {
            mac: MacConfig::Csma(CsmaConfig {
                control_rate_bps: Some(0.0),
                ..CsmaConfig::default()
            }),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("control_rate_bps=0 must fail validation");
        assert!(format!("{err}").contains("mac.csma.control_rate_bps"));
    }

    #[test]
    fn tdma_validation_rejects_empty_slot_roles() {
        let cfg = SimConfig {
            mac: MacConfig::Tdma(TdmaConfig {
                slot_roles: Vec::new(),
                ..TdmaConfig::default()
            }),
            ..SimConfig::default()
        };
        assert!(cfg.validate().is_err());
    }

    #[test]
    fn tdma_validation_rejects_zero_pipeline() {
        let cfg = SimConfig {
            mac: MacConfig::Tdma(TdmaConfig {
                m_pipeline: 0,
                ..TdmaConfig::default()
            }),
            ..SimConfig::default()
        };
        assert!(cfg.validate().is_err());
    }

    #[test]
    fn tdma_validation_rejects_non_positive_slot_duration() {
        let cfg = SimConfig {
            mac: MacConfig::Tdma(TdmaConfig {
                slot_duration_ms: 0.0,
                ..TdmaConfig::default()
            }),
            ..SimConfig::default()
        };
        assert!(cfg.validate().is_err());
    }

    #[test]
    fn general_validation_rejects_zero_nodes() {
        let cfg = SimConfig {
            general: GeneralConfig {
                num_nodes: 0,
                ..GeneralConfig::default()
            },
            ..SimConfig::default()
        };
        let err = cfg.validate().expect_err("zero nodes must fail");
        assert!(format!("{err}").contains("general.num_nodes"));
    }

    #[test]
    fn general_validation_rejects_non_positive_area() {
        let cfg = SimConfig {
            general: GeneralConfig {
                area_size_m: 0.0,
                ..GeneralConfig::default()
            },
            ..SimConfig::default()
        };
        let err = cfg.validate().expect_err("zero area must fail");
        assert!(format!("{err}").contains("general.area_size_m"));
    }

    #[test]
    fn general_validation_rejects_non_finite_area() {
        let cfg = SimConfig {
            general: GeneralConfig {
                area_size_m: f64::NAN,
                ..GeneralConfig::default()
            },
            ..SimConfig::default()
        };
        let err = cfg.validate().expect_err("non-finite area must fail");
        assert!(format!("{err}").contains("general.area_size_m"));
    }

    #[test]
    fn tdma_validation_rejects_slots_per_frame_mismatch() {
        let cfg = SimConfig {
            mac: MacConfig::Tdma(TdmaConfig {
                slots_per_frame: 1,
                ..TdmaConfig::default()
            }),
            ..SimConfig::default()
        };
        let err = cfg.validate().expect_err("slots_per_frame mismatch must fail");
        assert!(format!("{err}").contains("mac.tdma.slots_per_frame"));
    }

    #[test]
    fn tdma_validation_rejects_enable_sic() {
        let cfg = SimConfig {
            mac: MacConfig::Tdma(TdmaConfig {
                enable_sic: true,
                ..TdmaConfig::default()
            }),
            ..SimConfig::default()
        };
        let err = cfg.validate().expect_err("enable_sic=true must fail");
        assert!(format!("{err}").contains("mac.tdma.enable_sic"));
    }

    #[test]
    fn csma_validation_rejects_enable_rts_cts() {
        let cfg = SimConfig {
            mac: MacConfig::Csma(CsmaConfig {
                enable_rts_cts: true,
                ..CsmaConfig::default()
            }),
            ..SimConfig::default()
        };
        let err = cfg.validate().expect_err("enable_rts_cts=true must fail");
        assert!(format!("{err}").contains("mac.csma.enable_rts_cts"));
    }

    #[test]
    fn phy_validation_rejects_negative_shadowing_std() {
        let cfg = SimConfig {
            phy: PhyConfig {
                shadowing_std_db: -1.0,
                ..PhyConfig::default()
            },
            ..SimConfig::default()
        };
        assert!(cfg.validate().is_err());
    }

    #[test]
    fn overlay_validation_rejects_non_positive_interval() {
        let cfg = SimConfig {
            control_overlay: ControlOverlayConfig {
                enabled: true,
                observation_interval_ms: 0.0,
            },
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("control overlay interval must be > 0");
        assert!(format!("{err}").contains("control_overlay.observation_interval_ms"));
    }

    #[test]
    fn csma_validation_rejects_non_positive_slot_duration_us() {
        let cfg = SimConfig {
            mac: MacConfig::Csma(CsmaConfig {
                slot_duration_us: 0.0,
                ..CsmaConfig::default()
            }),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("slot_duration_us must be > 0");
        assert!(format!("{err}").contains("mac.csma.slot_duration_us"));
    }

    #[test]
    fn phy_validation_rejects_non_default_los_k_factor() {
        let cfg = SimConfig {
            phy: PhyConfig {
                los_k_factor: 7.0,
                ..PhyConfig::default()
            },
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("non-default los_k_factor should be rejected");
        assert!(format!("{err}").contains("phy.los_k_factor"));
    }

    #[test]
    fn cca_mode_default_is_strongest_signal() {
        assert!(matches!(CcaMode::default(), CcaMode::StrongestSignal));
        assert!(matches!(
            PhyConfig::default().cca_mode,
            CcaMode::StrongestSignal
        ));
    }

    #[test]
    fn conformance_silvus_requires_csma() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::SilvusV1,
                ..ConformanceConfig::default()
            },
            mac: MacConfig::Tdma(TdmaConfig::default()),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("silvus profile should reject tdma config");
        assert!(format!("{err}").contains("conformance.profile"));
    }

    #[test]
    fn conformance_tsm_requires_tdma() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::TsmV1,
                ..ConformanceConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig::default()),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("tsm profile should reject csma config");
        assert!(format!("{err}").contains("conformance.profile"));
    }

    #[test]
    fn conformance_baseline_requires_profile() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::None,
                baseline_path: Some("baseline.json".into()),
                ..ConformanceConfig::default()
            },
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("baseline_path should require profile");
        assert!(format!("{err}").contains("conformance.baseline_path"));
    }

    #[test]
    fn conformance_rejects_blank_baseline_path() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::SilvusV1,
                baseline_path: Some("   ".into()),
                ..ConformanceConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig::default()),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("blank baseline path should be rejected");
        assert!(format!("{err}").contains("conformance.baseline_path"));
    }

    #[test]
    fn conformance_require_baseline_requires_path() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::SilvusV1,
                require_baseline: true,
                baseline_path: None,
                ..ConformanceConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig::default()),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("require_baseline should require baseline_path");
        assert!(format!("{err}").contains("conformance.require_baseline"));
    }

    #[test]
    fn conformance_tiered_requires_baseline_path() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::SilvusV1,
                strictness: GateStrictness::Tiered,
                baseline_path: None,
                require_baseline: false,
                ..ConformanceConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig::default()),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("tiered strictness should require baseline_path");
        assert!(format!("{err}").contains("conformance.strictness"));
    }

    #[test]
    fn conformance_hard_requires_baseline_path() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::SilvusV1,
                strictness: GateStrictness::Hard,
                baseline_path: None,
                require_baseline: false,
                ..ConformanceConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig::default()),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("hard strictness should require baseline_path");
        assert!(format!("{err}").contains("conformance.strictness"));
    }

    #[test]
    fn conformance_advisory_without_baseline_is_allowed() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::SilvusV1,
                strictness: GateStrictness::Advisory,
                baseline_path: None,
                require_baseline: false,
                ..ConformanceConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig::default()),
            ..SimConfig::default()
        };
        cfg.validate()
            .expect("advisory strictness should allow missing baseline_path");
    }

    #[test]
    fn conformance_tiered_with_baseline_path_is_allowed() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                profile: ConformanceProfile::SilvusV1,
                strictness: GateStrictness::Tiered,
                baseline_path: Some("baseline.json".into()),
                require_baseline: false,
                ..ConformanceConfig::default()
            },
            mac: MacConfig::Csma(CsmaConfig::default()),
            ..SimConfig::default()
        };
        cfg.validate()
            .expect("tiered strictness should allow non-empty baseline_path");
    }

    #[test]
    fn conformance_rejects_empty_scenario_set() {
        let cfg = SimConfig {
            conformance: ConformanceConfig {
                scenario_set: "   ".into(),
                ..ConformanceConfig::default()
            },
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("scenario_set should not accept empty values");
        assert!(format!("{err}").contains("conformance.scenario_set"));
    }

    #[test]
    fn csma_validation_rejects_negative_capture_margin() {
        let cfg = SimConfig {
            mac: MacConfig::Csma(CsmaConfig {
                capture_margin_db: -1.0,
                ..CsmaConfig::default()
            }),
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("capture_margin_db must be >= 0");
        assert!(format!("{err}").contains("mac.csma.capture_margin_db"));
    }

    #[test]
    fn traffic_validation_rejects_invalid_mtu_and_playout_slack() {
        let cfg = SimConfig {
            traffic: TrafficConfig {
                mtu_bytes: 0,
                ..TrafficConfig::default()
            },
            ..SimConfig::default()
        };
        let err = cfg.validate().expect_err("mtu_bytes=0 should fail");
        assert!(format!("{err}").contains("traffic.mtu_bytes"));

        let cfg = SimConfig {
            traffic: TrafficConfig {
                playout_slack_ms: f64::NAN,
                ..TrafficConfig::default()
            },
            ..SimConfig::default()
        };
        let err = cfg
            .validate()
            .expect_err("non-finite playout_slack_ms should fail");
        assert!(format!("{err}").contains("traffic.playout_slack_ms"));
    }
}
