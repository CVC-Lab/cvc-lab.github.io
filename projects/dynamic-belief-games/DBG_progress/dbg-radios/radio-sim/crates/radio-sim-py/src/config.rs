use std::sync::Arc;

use pyo3::prelude::*;
use pyo3::types::{PyBytes, PyDict, PyList};
use radio_sim_core::config::{
    CodecConfig, ConformanceProfile, CsmaConfig, GateStrictness, GuardFallbackMode, MacConfig,
    PathLossModel,
    SimConfig, TdmaConfig, TrafficModel,
};
use radio_sim_core::media::scenario::RawMediaEntry;
use radio_sim_core::packet::MediaKind;

#[pyclass(name = "SimConfig")]
pub struct PySimConfig {
    pub(crate) inner: SimConfig,
}

const TDMA_GUARD_FALLBACK_MODE_ERROR: &str =
    "mode must be one of: strict, strongest_fallback (aliases: fallback, strongest)";

fn parse_tdma_guard_fallback_mode(mode: &str) -> Result<GuardFallbackMode, &'static str> {
    match mode.to_ascii_lowercase().as_str() {
        "strict" => Ok(GuardFallbackMode::Strict),
        "strongest_fallback" | "fallback" | "strongest" => Ok(GuardFallbackMode::StrongestFallback),
        _ => Err(TDMA_GUARD_FALLBACK_MODE_ERROR),
    }
}

#[pymethods]
impl PySimConfig {
    #[new]
    fn new() -> Self {
        PySimConfig {
            inner: SimConfig::default(),
        }
    }

    #[staticmethod]
    fn from_toml(path: &str) -> PyResult<Self> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
        let config: SimConfig = toml::from_str(&content)
            .map_err(|e: toml::de::Error| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;
        config
            .validate()
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;
        Ok(PySimConfig { inner: config })
    }

    fn __repr__(&self) -> String {
        format!("{:?}", self.inner)
    }

    fn set_free_space_path_loss(&mut self) {
        self.inner.phy.path_loss_model = PathLossModel::FreeSpace;
    }

    fn set_scenario_traffic(&mut self, comms_log_path: &str, audio_dir: &str) {
        self.inner.traffic.model = TrafficModel::Scenario {
            comms_log_path: comms_log_path.to_string(),
            audio_dir: audio_dir.to_string(),
        };
    }

    fn set_media_scenario(&mut self, manifest_path: &str) {
        self.inner.traffic.model = TrafficModel::MediaScenario {
            manifest_path: manifest_path.to_string(),
        };
    }

    fn set_voice_codec(
        &mut self,
        sample_rate_hz: u32,
        bits_per_sample: u16,
        channels: u16,
        frame_duration_ms: f64,
    ) {
        self.inner.traffic.codec = CodecConfig {
            sample_rate_hz,
            bits_per_sample,
            channels,
            frame_duration_ms,
        };
    }

    fn set_num_nodes(&mut self, n: u16) {
        self.inner.general.num_nodes = n;
    }

    fn set_sim_duration_s(&mut self, d: f64) {
        self.inner.general.sim_duration_s = d;
    }

    fn set_area_size_m(&mut self, a: f64) {
        self.inner.general.area_size_m = a;
    }

    fn set_control_overlay_enabled(&mut self, enabled: bool) {
        self.inner.control_overlay.enabled = enabled;
    }

    fn set_control_observation_interval_ms(&mut self, interval_ms: f64) {
        self.inner.control_overlay.observation_interval_ms = interval_ms;
    }

    fn set_seed(&mut self, s: u64) {
        self.inner.general.seed = s;
    }

    fn set_csma_mac(&mut self) {
        self.inner.mac = MacConfig::Csma(CsmaConfig::default());
    }

    fn set_tdma_mac(&mut self) {
        self.inner.mac = MacConfig::Tdma(TdmaConfig::default());
    }

    fn set_tx_power_w(&mut self, p: f64) {
        self.inner.phy.tx_power_w = p;
    }

    fn set_csma_queue_size(&mut self, n: u16) -> PyResult<()> {
        if let MacConfig::Csma(ref mut cfg) = self.inner.mac {
            if n == 0 {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    "node_queue_size must be >= 1",
                ));
            }
            cfg.node_queue_size = n;
            Ok(())
        } else {
            Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "set_csma_queue_size requires csma mac",
            ))
        }
    }

    fn set_csma_capture_margin_db(&mut self, margin_db: f64) -> PyResult<()> {
        if let MacConfig::Csma(ref mut cfg) = self.inner.mac {
            if !margin_db.is_finite() || margin_db < 0.0 {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    "capture_margin_db must be finite and >= 0",
                ));
            }
            cfg.capture_margin_db = margin_db;
            Ok(())
        } else {
            Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "set_csma_capture_margin_db requires csma mac",
            ))
        }
    }

    fn set_csma_edca_params(
        &mut self,
        access_category: &str,
        aifsn: u8,
        cw_min_exp: u8,
        cw_max_exp: u8,
        txop_limit_us: f64,
    ) -> PyResult<()> {
        if aifsn == 0 {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "aifsn must be >= 1",
            ));
        }
        if cw_min_exp == 0 {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "cw_min_exp must be >= 1",
            ));
        }
        if cw_max_exp < cw_min_exp {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "cw_max_exp must be >= cw_min_exp",
            ));
        }
        if !txop_limit_us.is_finite() || txop_limit_us < 0.0 {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "txop_limit_us must be finite and >= 0",
            ));
        }
        if let MacConfig::Csma(ref mut cfg) = self.inner.mac {
            let target = match access_category.to_ascii_lowercase().as_str() {
                "vo" | "voice" => &mut cfg.edca.vo,
                "vi" | "video" => &mut cfg.edca.vi,
                "be" | "best_effort" | "besteffort" => &mut cfg.edca.be,
                "bk" | "background" => &mut cfg.edca.bk,
                _ => {
                    return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                        "access_category must be one of: vo, vi, be, bk",
                    ));
                }
            };
            target.aifsn = aifsn;
            target.cw_min_exp = cw_min_exp;
            target.cw_max_exp = cw_max_exp;
            target.txop_limit_us = txop_limit_us;
            Ok(())
        } else {
            Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "set_csma_edca_params requires csma mac",
            ))
        }
    }

    fn set_tdma_guard_fallback_mode(&mut self, mode: &str) -> PyResult<()> {
        if let MacConfig::Tdma(ref mut cfg) = self.inner.mac {
            cfg.guard_fallback_mode = parse_tdma_guard_fallback_mode(mode)
                .map_err(|msg| PyErr::new::<pyo3::exceptions::PyValueError, _>(msg))?;
            Ok(())
        } else {
            Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "set_tdma_guard_fallback_mode requires tdma mac",
            ))
        }
    }

    fn set_traffic_class_mix(&mut self, command: f64, voice: f64, best_effort: f64) {
        self.inner.traffic.class_mix.command = command.max(0.0);
        self.inner.traffic.class_mix.voice = voice.max(0.0);
        self.inner.traffic.class_mix.best_effort = best_effort.max(0.0);
    }

    fn set_conformance_profile(&mut self, profile: &str) -> PyResult<()> {
        self.inner.conformance.profile = match profile.to_ascii_lowercase().as_str() {
            "none" => ConformanceProfile::None,
            "silvus_v1" => ConformanceProfile::SilvusV1,
            "tsm_v1" => ConformanceProfile::TsmV1,
            _ => {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    "profile must be one of: none, silvus_v1, tsm_v1",
                ));
            }
        };
        Ok(())
    }

    fn set_conformance_strictness(&mut self, strictness: &str) -> PyResult<()> {
        self.inner.conformance.strictness = match strictness.to_ascii_lowercase().as_str() {
            "advisory" => GateStrictness::Advisory,
            "tiered" => GateStrictness::Tiered,
            "hard" => GateStrictness::Hard,
            _ => {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    "strictness must be one of: advisory, tiered, hard",
                ));
            }
        };
        Ok(())
    }

    fn set_conformance_baseline_path(&mut self, baseline_path: Option<&str>) {
        self.inner.conformance.baseline_path = baseline_path.map(str::to_string);
    }

    fn set_conformance_require_baseline(&mut self, require_baseline: bool) {
        self.inner.conformance.require_baseline = require_baseline;
    }

    fn set_conformance_scenario_set(&mut self, scenario_set: &str) {
        self.inner.conformance.scenario_set = scenario_set.to_string();
    }

    fn set_media_mtu_bytes(&mut self, mtu_bytes: u16) -> PyResult<()> {
        if mtu_bytes == 0 {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "mtu_bytes must be >= 1",
            ));
        }
        self.inner.traffic.mtu_bytes = mtu_bytes;
        Ok(())
    }

    fn set_media_playout_slack_ms(&mut self, slack_ms: f64) -> PyResult<()> {
        if !slack_ms.is_finite() || slack_ms < 0.0 {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "playout_slack_ms must be finite and >= 0",
            ));
        }
        self.inner.traffic.playout_slack_ms = slack_ms;
        Ok(())
    }

    /// Inject pre-built media frames directly. Each dict carries:
    ///   - time_s: float (frame emit time, seconds)
    ///   - sender_id: int (u16)
    ///   - dest_id: Optional[int] (u16; None = broadcast for media)
    ///   - stream_id: int (u32)
    ///   - message_id: Optional[int] (u32; defaults to stream_id)
    ///   - frame_index: int (u16)
    ///   - payload: bytes
    ///   - media_kind: "audio" | "video"
    ///   - fragment_index: Optional[int] (u16; for explicit fragmentation)
    ///   - fragment_count: Optional[int] (u16; for explicit fragmentation)
    /// MTU and playout slack come from set_media_mtu_bytes / set_media_playout_slack_ms.
    fn set_media_frames(&mut self, frames: &Bound<'_, PyList>) -> PyResult<()> {
        let mut entries = Vec::with_capacity(frames.len());
        for (idx, item) in frames.iter().enumerate() {
            let dict = item.downcast::<PyDict>().map_err(|_| {
                PyErr::new::<pyo3::exceptions::PyTypeError, _>(format!(
                    "frames[{idx}] must be a dict"
                ))
            })?;
            entries.push(parse_media_frame_dict(dict, idx)?);
        }
        self.inner.traffic.model = TrafficModel::MediaInMemory {
            entries: Arc::new(entries),
        };
        Ok(())
    }
}

fn parse_media_frame_dict(dict: &Bound<'_, PyDict>, idx: usize) -> PyResult<RawMediaEntry> {
    let time_s: f64 = required_field(dict, "time_s", idx)?.extract()?;
    let sender_id: u16 = required_field(dict, "sender_id", idx)?.extract()?;
    let dest_id: Option<u16> = optional_field(dict, "dest_id")?
        .map(|v| v.extract::<u16>())
        .transpose()?;
    let stream_id: u32 = required_field(dict, "stream_id", idx)?.extract()?;
    let message_id: Option<u32> = optional_field(dict, "message_id")?
        .map(|v| v.extract::<u32>())
        .transpose()?;
    let frame_index: u16 = required_field(dict, "frame_index", idx)?.extract()?;
    let media_kind_str: String = required_field(dict, "media_kind", idx)?.extract()?;
    let media_kind = match media_kind_str.to_ascii_lowercase().as_str() {
        "audio" => MediaKind::Audio,
        "video" => MediaKind::Video,
        other => {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(format!(
                "frames[{idx}].media_kind must be 'audio' or 'video', got '{other}'"
            )))
        }
    };
    let payload_obj = required_field(dict, "payload", idx)?;
    let payload_bytes = payload_obj
        .downcast::<PyBytes>()
        .map_err(|_| {
            PyErr::new::<pyo3::exceptions::PyTypeError, _>(format!(
                "frames[{idx}].payload must be bytes"
            ))
        })?
        .as_bytes()
        .to_vec();
    let fragment_index: Option<u16> = optional_field(dict, "fragment_index")?
        .map(|v| v.extract::<u16>())
        .transpose()?;
    let fragment_count: Option<u16> = optional_field(dict, "fragment_count")?
        .map(|v| v.extract::<u16>())
        .transpose()?;
    Ok(RawMediaEntry {
        time_s,
        sender_id,
        dest_id,
        stream_id,
        message_id,
        frame_index,
        media_kind,
        payload: Arc::new(payload_bytes),
        fragment_index,
        fragment_count,
    })
}

fn required_field<'py>(
    dict: &Bound<'py, PyDict>,
    name: &str,
    idx: usize,
) -> PyResult<Bound<'py, PyAny>> {
    dict.get_item(name)?.ok_or_else(|| {
        PyErr::new::<pyo3::exceptions::PyValueError, _>(format!(
            "frames[{idx}] missing required field '{name}'"
        ))
    })
}

fn optional_field<'py>(
    dict: &Bound<'py, PyDict>,
    name: &str,
) -> PyResult<Option<Bound<'py, PyAny>>> {
    let value = dict.get_item(name)?;
    Ok(value.filter(|v| !v.is_none()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_tdma_guard_fallback_mode_accepts_canonical_and_alias_inputs() {
        let cases = [
            ("strict", GuardFallbackMode::Strict),
            ("STRICT", GuardFallbackMode::Strict),
            ("strongest_fallback", GuardFallbackMode::StrongestFallback),
            ("fallback", GuardFallbackMode::StrongestFallback),
            ("strongest", GuardFallbackMode::StrongestFallback),
        ];
        for (mode, expected) in cases {
            let parsed = parse_tdma_guard_fallback_mode(mode)
                .expect("accepted mode/alias should parse");
            assert_eq!(parsed, expected);
        }
    }

    #[test]
    fn parse_tdma_guard_fallback_mode_invalid_value_mentions_aliases() {
        let err = parse_tdma_guard_fallback_mode("invalid_mode")
            .expect_err("invalid mode should return an error");
        assert_eq!(err, TDMA_GUARD_FALLBACK_MODE_ERROR);
    }
}
