use std::sync::Arc;

use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes, PyDict, PyList};
use radio_sim_core::control::{AccessCategory, AccessCategoryValues, LocalAction};
use radio_sim_core::des::SimTime;
use radio_sim_core::packet::MediaKind;
use radio_sim_core::sim::Simulation;
use radio_sim_core::voice::codec::reconstruct_audio as reconstruct_pcm;

use crate::config::PySimConfig;

#[pyclass(name = "Simulation", unsendable)]
pub struct PySim {
    sim: Option<Simulation>,
}

#[pymethods]
impl PySim {
    #[new]
    fn new(config: &PySimConfig) -> PyResult<Self> {
        let sim = Simulation::new(config.inner.clone())
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;
        Ok(PySim { sim: Some(sim) })
    }

    fn run<'py>(&mut self, py: Python<'py>) -> PyResult<Bound<'py, PyDict>> {
        let sim = self
            .sim
            .as_mut()
            .ok_or_else(|| {
                PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Simulation already consumed")
            })?;

        sim.run();
        self.summary_dict(py)
    }

    fn run_until_ms(&mut self, until_ms: f64) -> PyResult<()> {
        let sim = self
            .sim
            .as_mut()
            .ok_or_else(|| {
                PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Simulation already consumed")
            })?;
        sim.run_until(SimTime::from_ms(until_ms));
        Ok(())
    }

    fn current_time_ms(&self) -> PyResult<f64> {
        let sim = self
            .sim
            .as_ref()
            .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Simulation unavailable"))?;
        Ok(sim.current_time().as_ms())
    }

    fn is_finished(&self) -> PyResult<bool> {
        let sim = self
            .sim
            .as_ref()
            .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Simulation unavailable"))?;
        Ok(sim.is_finished())
    }

    fn get_local_observations<'py>(&mut self, py: Python<'py>) -> PyResult<Bound<'py, PyList>> {
        let sim = self
            .sim
            .as_mut()
            .ok_or_else(|| {
                PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Simulation already consumed")
            })?;
        if !sim.config.control_overlay.enabled {
            return Ok(PyList::empty(py));
        }
        let observations = sim.take_local_observations();
        let out = PyList::empty(py);
        for obs in observations {
            let item = PyDict::new(py);
            item.set_item("node_id", obs.node_id)?;
            item.set_item("time_ns", obs.time_ns)?;
            item.set_item("queue_len", ac_u32_dict(py, obs.queue_len)?)?;
            item.set_item("head_of_line_age_ns", ac_u64_dict(py, obs.head_of_line_age_ns)?)?;
            item.set_item("retry_count", ac_u32_dict(py, obs.retry_count)?)?;
            item.set_item("backoff_stage", ac_u8_dict(py, obs.backoff_stage)?)?;
            item.set_item("backoff_slots", ac_u32_dict(py, obs.backoff_slots)?)?;
            item.set_item("current_cw_exp", ac_u8_dict(py, obs.current_cw_exp)?)?;
            item.set_item("tx_attempts", ac_u32_dict(py, obs.tx_attempts)?)?;
            item.set_item("tx_success", ac_u32_dict(py, obs.tx_success)?)?;
            item.set_item("retries", ac_u32_dict(py, obs.retries)?)?;
            item.set_item("ack_timeouts", ac_u32_dict(py, obs.ack_timeouts)?)?;
            item.set_item("drops", ac_u32_dict(py, obs.drops)?)?;
            item.set_item("deliveries", ac_u32_dict(py, obs.deliveries)?)?;
            item.set_item("p95_latency_ns", ac_u64_dict(py, obs.p95_latency_ns)?)?;
            item.set_item(
                "internal_collisions",
                ac_u32_dict(py, obs.internal_collisions)?,
            )?;
            item.set_item("txop_grants", ac_u32_dict(py, obs.txop_grants)?)?;
            item.set_item("txop_uses", ac_u32_dict(py, obs.txop_uses)?)?;
            item.set_item("collisions", obs.collisions)?;
            item.set_item("cca_busy_fraction", obs.cca_busy_fraction)?;
            item.set_item("mean_backoff_slots", obs.mean_backoff_slots)?;

            // Action-outcome counters (interval deltas).
            let outcomes = PyDict::new(py);
            outcomes.set_item(
                "purged_oldest",
                ac_u32_dict(py, obs.action_outcomes.purged_oldest)?,
            )?;
            outcomes.set_item(
                "purged_older_than",
                ac_u32_dict(py, obs.action_outcomes.purged_older_than)?,
            )?;
            outcomes.set_item(
                "admission_drops",
                ac_u32_dict(py, obs.action_outcomes.admission_drops)?,
            )?;
            outcomes.set_item(
                "rate_cap_drops",
                ac_u32_dict(py, obs.action_outcomes.rate_cap_drops)?,
            )?;
            outcomes.set_item(
                "stream_paused_drops",
                obs.action_outcomes.stream_paused_drops,
            )?;
            outcomes.set_item(
                "stream_flush_drops",
                obs.action_outcomes.stream_flush_drops,
            )?;
            outcomes.set_item(
                "stream_reclassifications",
                obs.action_outcomes.stream_reclassifications,
            )?;
            item.set_item("action_outcomes", outcomes)?;

            item.set_item("streams_present", obs.streams_present)?;
            out.append(item)?;
        }
        Ok(out)
    }

    fn apply_local_actions(&mut self, actions: &Bound<'_, PyAny>) -> PyResult<()> {
        let sim = self
            .sim
            .as_mut()
            .ok_or_else(|| {
                PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Simulation already consumed")
            })?;
        if !sim.config.control_overlay.enabled {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                "control overlay is disabled in config; cannot apply local actions",
            ));
        }
        let action_list = actions.downcast::<PyList>()?;
        let mut converted = Vec::with_capacity(action_list.len());
        for action in action_list.iter() {
            let action_dict = action.downcast::<PyDict>()?;
            converted.push(parse_local_action(action_dict)?);
        }
        sim.apply_local_actions(&converted);
        Ok(())
    }

    fn reconstruct_audio(&self, frames: Vec<Option<Vec<u8>>>) -> PyResult<Vec<u8>> {
        let sim = self
            .sim
            .as_ref()
            .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Simulation unavailable"))?;
        let config = &sim.config.traffic.codec;
        let converted: Vec<Option<Arc<Vec<u8>>>> =
            frames.into_iter().map(|f| f.map(Arc::new)).collect();
        Ok(reconstruct_pcm(&converted, config))
    }
}

fn ac_u32_dict<'py>(
    py: Python<'py>,
    values: AccessCategoryValues<u32>,
) -> PyResult<Bound<'py, PyDict>> {
    let out = PyDict::new(py);
    out.set_item("vo", values.vo)?;
    out.set_item("vi", values.vi)?;
    out.set_item("be", values.be)?;
    out.set_item("bk", values.bk)?;
    Ok(out)
}

fn ac_u64_dict<'py>(
    py: Python<'py>,
    values: AccessCategoryValues<u64>,
) -> PyResult<Bound<'py, PyDict>> {
    let out = PyDict::new(py);
    out.set_item("vo", values.vo)?;
    out.set_item("vi", values.vi)?;
    out.set_item("be", values.be)?;
    out.set_item("bk", values.bk)?;
    Ok(out)
}

fn ac_u8_dict<'py>(
    py: Python<'py>,
    values: AccessCategoryValues<u8>,
) -> PyResult<Bound<'py, PyDict>> {
    let out = PyDict::new(py);
    out.set_item("vo", values.vo)?;
    out.set_item("vi", values.vi)?;
    out.set_item("be", values.be)?;
    out.set_item("bk", values.bk)?;
    Ok(out)
}

/// Parse a `LocalAction` from a Python dict. Every axis is optional; missing
/// keys leave the corresponding axis at its `LocalAction::default()` no-op
/// value. Lets controllers send only the axes they care about each tick.
fn parse_local_action(dict: &Bound<'_, PyDict>) -> PyResult<LocalAction> {
    let mut action = LocalAction::default();

    if let Some(v) = optional_dict_field(dict, "aifsn_delta")? {
        action.aifsn_delta = parse_ac_number_dict::<i8>(&v)?;
    }
    if let Some(v) = optional_dict_field(dict, "cw_min_exp_delta")? {
        action.cw_min_exp_delta = parse_ac_number_dict::<i8>(&v)?;
    }
    if let Some(v) = optional_dict_field(dict, "cw_max_exp_delta")? {
        action.cw_max_exp_delta = parse_ac_number_dict::<i8>(&v)?;
    }
    if let Some(v) = optional_dict_field(dict, "txop_limit_us_delta")? {
        action.txop_limit_us_delta = parse_ac_number_dict::<i32>(&v)?;
    }
    if let Some(v) = optional_dict_field(dict, "purge_oldest")? {
        action.purge_oldest = parse_ac_number_dict::<u16>(&v)?;
    }
    if let Some(v) = optional_dict_field(dict, "purge_older_than_ms")? {
        action.purge_older_than_ms = parse_ac_number_dict::<u32>(&v)?;
    }
    if let Some(v) = optional_dict_field(dict, "max_queue_len")? {
        action.max_queue_len = parse_ac_optional_dict::<u16>(&v)?;
    }
    if let Some(v) = optional_dict_field(dict, "rate_cap_pps")? {
        action.rate_cap_pps = parse_ac_optional_dict::<f32>(&v)?;
    }
    if let Some(v) = optional_field(dict, "pause_streams")? {
        action.pause_streams = v.extract()?;
    }
    if let Some(v) = optional_field(dict, "resume_streams")? {
        action.resume_streams = v.extract()?;
    }
    if let Some(v) = optional_field(dict, "drop_streams")? {
        action.drop_streams = v.extract()?;
    }
    if let Some(v) = optional_field(dict, "reclassify_streams")? {
        action.reclassify_streams = parse_reclassify_streams(&v)?;
    }

    Ok(action)
}

fn optional_field<'py>(
    dict: &Bound<'py, PyDict>,
    name: &str,
) -> PyResult<Option<Bound<'py, PyAny>>> {
    let value = dict.get_item(name)?;
    Ok(value.filter(|v| !v.is_none()))
}

fn optional_dict_field<'py>(
    dict: &Bound<'py, PyDict>,
    name: &str,
) -> PyResult<Option<Bound<'py, PyDict>>> {
    let Some(value) = optional_field(dict, name)? else {
        return Ok(None);
    };
    let cast = value.downcast_into::<PyDict>().map_err(|_| {
        PyErr::new::<pyo3::exceptions::PyTypeError, _>(format!(
            "action field '{name}' must be a dict keyed by 'vo'/'vi'/'be'/'bk'"
        ))
    })?;
    Ok(Some(cast))
}

fn parse_ac_number_dict<T>(values: &Bound<'_, PyDict>) -> PyResult<AccessCategoryValues<T>>
where
    for<'py> T: FromPyObject<'py> + Default,
{
    Ok(AccessCategoryValues::new(
        extract_number_or_default::<T>(values, "vo")?,
        extract_number_or_default::<T>(values, "vi")?,
        extract_number_or_default::<T>(values, "be")?,
        extract_number_or_default::<T>(values, "bk")?,
    ))
}

fn parse_ac_optional_dict<T>(values: &Bound<'_, PyDict>) -> PyResult<AccessCategoryValues<Option<T>>>
where
    for<'py> T: FromPyObject<'py>,
{
    Ok(AccessCategoryValues::new(
        extract_optional_number::<T>(values, "vo")?,
        extract_optional_number::<T>(values, "vi")?,
        extract_optional_number::<T>(values, "be")?,
        extract_optional_number::<T>(values, "bk")?,
    ))
}

fn extract_number_or_default<T>(values: &Bound<'_, PyDict>, key: &str) -> PyResult<T>
where
    for<'py> T: FromPyObject<'py> + Default,
{
    match optional_field(values, key)? {
        Some(v) => v.extract::<T>(),
        None => Ok(T::default()),
    }
}

fn extract_optional_number<T>(values: &Bound<'_, PyDict>, key: &str) -> PyResult<Option<T>>
where
    for<'py> T: FromPyObject<'py>,
{
    match optional_field(values, key)? {
        Some(v) => Ok(Some(v.extract::<T>()?)),
        None => Ok(None),
    }
}

fn parse_reclassify_streams(value: &Bound<'_, PyAny>) -> PyResult<Vec<(u32, AccessCategory)>> {
    let mut out: Vec<(u32, AccessCategory)> = Vec::new();
    if let Ok(dict) = value.downcast::<PyDict>() {
        for (k, v) in dict.iter() {
            let stream_id: u32 = k.extract()?;
            let ac_str: String = v.extract()?;
            out.push((stream_id, parse_access_category(&ac_str)?));
        }
    } else {
        let list = value.downcast::<PyList>().map_err(|_| {
            PyErr::new::<pyo3::exceptions::PyTypeError, _>(
                "reclassify_streams must be a dict {stream_id: target_ac} or a list of [stream_id, target_ac]",
            )
        })?;
        for item in list.iter() {
            let pair = item.downcast::<PyList>().map_err(|_| {
                PyErr::new::<pyo3::exceptions::PyTypeError, _>(
                    "reclassify_streams entries must be [stream_id, target_ac]",
                )
            })?;
            if pair.len() != 2 {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    "reclassify_streams entries must be [stream_id, target_ac]",
                ));
            }
            let stream_id: u32 = pair.get_item(0)?.extract()?;
            let ac_str: String = pair.get_item(1)?.extract()?;
            out.push((stream_id, parse_access_category(&ac_str)?));
        }
    }
    Ok(out)
}

fn parse_access_category(s: &str) -> PyResult<AccessCategory> {
    match s.to_ascii_lowercase().as_str() {
        "vo" | "voice" => Ok(AccessCategory::Vo),
        "vi" | "video" => Ok(AccessCategory::Vi),
        "be" | "best_effort" | "besteffort" => Ok(AccessCategory::Be),
        "bk" | "background" => Ok(AccessCategory::Bk),
        other => Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(format!(
            "target_ac must be one of: vo, vi, be, bk; got '{other}'"
        ))),
    }
}

impl PySim {
    fn summary_dict<'py>(&self, py: Python<'py>) -> PyResult<Bound<'py, PyDict>> {
        let sim = self
            .sim
            .as_ref()
            .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Simulation unavailable"))?;

        let summary = sim.metrics.summary();
        let dict = PyDict::new(py);
        dict.set_item("packets_sent", summary.packets_sent)?;
        dict.set_item("packets_delivered", summary.packets_delivered)?;
        dict.set_item("packets_dropped", summary.packets_dropped)?;
        dict.set_item("drop_events", summary.drop_events)?;
        dict.set_item("packets_failed", summary.packets_failed)?;
        dict.set_item("pdr", summary.pdr)?;
        dict.set_item("pdr_sender_confirmed", summary.pdr_sender_confirmed)?;
        dict.set_item("pdr_receiver_unique", summary.pdr_receiver_unique)?;
        dict.set_item("pdr_receiver_pairwise", summary.pdr_receiver_pairwise)?;
        dict.set_item("avg_latency_ns", summary.avg_latency_ns)?;
        dict.set_item("median_latency_ns", summary.median_latency_ns)?;
        dict.set_item("p95_latency_ns", summary.p95_latency_ns)?;
        dict.set_item("collisions", summary.collisions)?;
        dict.set_item("events_processed", sim.engine.events_processed())?;

        let media_results = PyList::empty(py);
        for result in sim.metrics.media_results() {
            let item = PyDict::new(py);
            item.set_item("stream_id", result.stream_id)?;
            item.set_item("sender_id", result.sender_id)?;
            item.set_item("receiver_id", result.receiver_id)?;
            item.set_item("frame_indices", result.frame_indices)?;
            item.set_item("total_frames", result.total_frames)?;
            item.set_item("frames_received", result.frames_received)?;
            item.set_item("frames_queue_dropped", result.frames_queue_dropped)?;
            item.set_item("frames_late_dropped", result.frames_late_dropped)?;
            item.set_item("pdr", result.pdr)?;
            let media_kind = match result.media_kind {
                MediaKind::Audio => "audio",
                MediaKind::Video => "video",
            };
            item.set_item("media_kind", media_kind)?;

            let payloads = PyList::empty(py);
            for payload in result.frame_payloads {
                if let Some(bytes) = payload {
                    payloads.append(PyBytes::new(py, bytes.as_ref().as_slice()))?;
                } else {
                    payloads.append(py.None())?;
                }
            }
            item.set_item("frame_payloads", payloads)?;
            media_results.append(item)?;
        }
        dict.set_item("media_results", media_results)?;

        let voice_results = PyList::empty(py);
        for result in sim.metrics.voice_results() {
            let item = PyDict::new(py);
            item.set_item("message_id", result.message_id)?;
            item.set_item("sender_id", result.sender_id)?;
            item.set_item("receiver_id", result.receiver_id)?;
            item.set_item("total_frames", result.total_frames)?;
            item.set_item("frames_received", result.frames_received)?;
            item.set_item("frames_queue_dropped", result.frames_queue_dropped)?;
            item.set_item("frames_late_dropped", result.frames_late_dropped)?;
            item.set_item("pdr", result.pdr)?;

            let payloads = PyList::empty(py);
            for payload in result.frame_payloads {
                if let Some(bytes) = payload {
                    payloads.append(PyBytes::new(py, bytes.as_ref().as_slice()))?;
                } else {
                    payloads.append(py.None())?;
                }
            }
            item.set_item("frame_payloads", payloads)?;
            voice_results.append(item)?;
        }
        dict.set_item("voice_results", voice_results)?;
        Ok(dict)
    }
}
