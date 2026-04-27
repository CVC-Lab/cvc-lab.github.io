use hashbrown::HashMap;

use crate::config::{CcaMode, PathLossModel, PhyConfig};
use crate::des::{NodeId, SimTime};
use crate::node::Vec2;
use crate::packet::Packet;
use crate::rng::{RngContext, RngStream};
use crate::units::thermal_noise_w;

use super::fading::JakesFader;
use super::path_loss;

/// Received signal descriptor for one TX->RX pair.
#[derive(Debug, Clone)]
pub struct RxSignal {
    pub packet: Packet,
    pub rx_power_w: f64,
    pub sinr_linear: f64,
    pub sinr_db: f64,
    /// Preamble/acquisition-window SINR in dB.
    pub preamble_sinr_db: f64,
    pub tx_node_id: NodeId,
    /// Denominator for cooperative combining, excluding same-packet copies.
    pub other_plus_noise_w: f64,
    /// Time-of-arrival offset relative to earliest arrival (microseconds).
    pub toa_offset_us: f64,
    /// Actual frame-start offset relative to earliest overlapping arrival (microseconds).
    pub start_offset_us: f64,
    /// Number of distinct packet IDs present in the overlap set for this summary.
    pub overlap_packet_count: u16,
}

/// Channel model: path loss, shadowing, fading, SINR computation.
pub struct Channel {
    config: PhyConfig,
    noise_floor_w: f64,
    /// Per-link shadowing cache: (min(a,b), max(a,b)) -> dB offset.
    shadowing_cache: HashMap<(NodeId, NodeId), f64>,
    /// Per-link fading generators.
    faders: HashMap<(NodeId, NodeId), JakesFader>,
    rng: RngStream,
}

impl Channel {
    pub fn new(config: &PhyConfig, rng_ctx: &RngContext) -> Self {
        let noise_floor_w = thermal_noise_w(config.rx_bandwidth_hz, config.noise_figure_db);
        Channel {
            config: config.clone(),
            noise_floor_w,
            shadowing_cache: HashMap::new(),
            faders: HashMap::new(),
            rng: rng_ctx.stream("channel"),
        }
    }

    pub fn noise_floor_w(&self) -> f64 {
        self.noise_floor_w
    }

    pub fn propagation_delay_us(tx_pos: Vec2, rx_pos: Vec2) -> f64 {
        tx_pos.distance_to(&rx_pos) / 299_792_458.0 * 1e6
    }

    /// Calculate received power for a single TX->RX pair.
    pub fn received_power_w(
        &mut self,
        tx_pos: Vec2,
        rx_pos: Vec2,
        tx_id: NodeId,
        rx_id: NodeId,
        now: SimTime,
    ) -> f64 {
        let distance = tx_pos.distance_to(&rx_pos);
        let d = distance.max(self.config.reference_distance_m);

        let pl_db = path_loss::path_loss_db(&self.config, d);
        let (shadow_db, fading_gain) = if matches!(&self.config.path_loss_model, PathLossModel::FreeSpace) {
            (0.0, 1.0)
        } else {
            let shadow_db = self.get_shadowing(tx_id, rx_id);
            let fading_gain = if self.config.enable_fading {
                self.get_fading_gain(tx_id, rx_id, self.doppler_time(now))
            } else {
                1.0
            };
            (shadow_db, fading_gain)
        };

        let total_loss_db = pl_db + shadow_db;
        let path_gain = 10.0f64.powf(-total_loss_db / 10.0);

        self.config.tx_power_w * path_gain * fading_gain
    }

    fn doppler_time(&self, now: SimTime) -> f64 {
        let lambda = 3e8 / self.config.carrier_freq_hz;
        if !lambda.is_finite() || lambda <= 0.0 {
            return 0.0;
        }
        let fd_hz = self.config.node_velocity_mps.abs() / lambda;
        if !fd_hz.is_finite() || fd_hz <= 0.0 {
            return 0.0;
        }
        fd_hz * now.as_s()
    }

    /// Get or generate shadowing for a link (symmetric, cached).
    fn get_shadowing(&mut self, a: NodeId, b: NodeId) -> f64 {
        if self.config.shadowing_std_db <= 0.0 {
            return 0.0;
        }
        let key = if a < b { (a, b) } else { (b, a) };
        *self
            .shadowing_cache
            .entry(key)
            .or_insert_with(|| self.rng.gauss(0.0, self.config.shadowing_std_db))
    }

    /// Get fading gain for a link.
    fn get_fading_gain(&mut self, a: NodeId, b: NodeId, fd_t: f64) -> f64 {
        let key = if a < b { (a, b) } else { (b, a) };
        if !self.faders.contains_key(&key) {
            let k = if self.config.k_factor > 0.0 {
                self.config.k_factor
            } else {
                0.0
            };
            let mut fader_rng = self.rng.sub_stream(&format!("fader:{key:?}"));
            let fader = JakesFader::new(k, &mut fader_rng);
            self.faders.insert(key, fader);
        }
        self.faders[&key].sample(fd_t)
    }

    /// Compute received signals for all transmissions arriving at one receiver.
    /// Returns per-signal SINR based on all concurrent transmissions.
    pub fn compute_rx_signals(
        &mut self,
        rx_id: NodeId,
        rx_pos: Vec2,
        transmissions: &[(NodeId, Vec2, Packet)],
        now: SimTime,
    ) -> Vec<RxSignal> {
        let mut signals: Vec<RxSignal> = Vec::with_capacity(transmissions.len());

        // First pass: compute received power for each
        for (tx_id, tx_pos, pkt) in transmissions {
            if *tx_id == rx_id {
                continue;
            }
            let rx_power = self.received_power_w(*tx_pos, rx_pos, *tx_id, rx_id, now);
            signals.push(RxSignal {
                packet: pkt.clone(),
                rx_power_w: rx_power,
                sinr_linear: 0.0,
                sinr_db: f64::NEG_INFINITY,
                preamble_sinr_db: f64::NEG_INFINITY,
                tx_node_id: *tx_id,
                other_plus_noise_w: 0.0,
                toa_offset_us: 0.0,
                start_offset_us: 0.0,
                overlap_packet_count: 0,
            });
        }

        // Second pass: compute SINR for each signal
        let total_power: f64 = signals.iter().map(|s| s.rx_power_w).sum();
        let mut power_by_packet: HashMap<u64, f64> = HashMap::new();
        for sig in &signals {
            *power_by_packet.entry(sig.packet.id).or_insert(0.0) += sig.rx_power_w;
        }
        for sig in &mut signals {
            let interference = total_power - sig.rx_power_w;
            let denom = interference + self.noise_floor_w;
            if denom > 0.0 && sig.rx_power_w > 0.0 {
                sig.sinr_linear = sig.rx_power_w / denom;
                sig.sinr_db = 10.0 * sig.sinr_linear.log10();
            }
            sig.preamble_sinr_db = sig.sinr_db;
            let same_packet_power = *power_by_packet.get(&sig.packet.id).unwrap_or(&sig.rx_power_w);
            let other_interference = (total_power - same_packet_power).max(0.0);
            sig.other_plus_noise_w = other_interference + self.noise_floor_w;
            sig.overlap_packet_count = power_by_packet.len() as u16;
        }

        // Third pass: compute ToA offsets for guard-time filtering
        if !signals.is_empty() {
            let c_mps = 299_792_458.0f64;
            let min_dist: f64 = transmissions
                .iter()
                .filter(|(id, _, _)| *id != rx_id)
                .map(|(_, pos, _)| pos.distance_to(&rx_pos))
                .fold(f64::INFINITY, f64::min);

            for sig in signals.iter_mut() {
                let tx_pos = transmissions
                    .iter()
                    .find(|(id, _, _)| *id == sig.tx_node_id)
                    .map(|(_, pos, _)| *pos)
                    .unwrap_or(rx_pos);
                let d = tx_pos.distance_to(&rx_pos);
                sig.toa_offset_us = (d - min_dist) / c_mps * 1e6;
            }
        }

        signals
    }

    /// Check if a node can sense carrier above CCA threshold.
    pub fn carrier_sensed(
        &mut self,
        rx_id: NodeId,
        rx_pos: Vec2,
        transmissions: &[(NodeId, Vec2)],
        cca_threshold_dbm: f64,
        now: SimTime,
    ) -> bool {
        let threshold_w = crate::units::dbm_to_w(cca_threshold_dbm);
        match self.config.cca_mode {
            CcaMode::StrongestSignal => {
                for (tx_id, tx_pos) in transmissions {
                    if *tx_id == rx_id {
                        continue;
                    }
                    let rx_power = self.received_power_w(*tx_pos, rx_pos, *tx_id, rx_id, now);
                    if rx_power >= threshold_w {
                        return true;
                    }
                }
                false
            }
            CcaMode::AggregateEnergy => {
                let mut aggregate_rx_power = 0.0;
                for (tx_id, tx_pos) in transmissions {
                    if *tx_id == rx_id {
                        continue;
                    }
                    let rx_power = self.received_power_w(*tx_pos, rx_pos, *tx_id, rx_id, now);
                    aggregate_rx_power += rx_power;
                    if aggregate_rx_power >= threshold_w {
                        return true;
                    }
                }
                false
            }
        }
    }
}

impl std::fmt::Debug for Channel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Channel")
            .field("noise_floor_w", &self.noise_floor_w)
            .field("shadowing_entries", &self.shadowing_cache.len())
            .field("fader_entries", &self.faders.len())
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PhyConfig;
    use crate::rng::RngContext;
    use crate::units::w_to_dbm;

    #[test]
    fn strongest_signal_cca_does_not_sum_multiple_weak_senders() {
        let mut cfg = PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            shadowing_std_db: 0.0,
            enable_fading: false,
            ..PhyConfig::default()
        };
        cfg.cca_mode = CcaMode::StrongestSignal;
        let mut channel = Channel::new(&cfg, &RngContext::new(7));

        let rx_id = 0;
        let rx_pos = Vec2::new(0.0, 0.0);
        let tx_a = (1, Vec2::new(2.0, 0.0));
        let tx_b = (2, Vec2::new(-2.0, 0.0));
        let transmissions = vec![tx_a, tx_b];

        let single_rx_power = channel.received_power_w(tx_a.1, rx_pos, tx_a.0, rx_id, SimTime::ZERO);
        let threshold_dbm = w_to_dbm(single_rx_power * 1.5);
        assert!(
            !channel.carrier_sensed(rx_id, rx_pos, &transmissions, threshold_dbm, SimTime::ZERO),
            "legacy strongest-signal CCA should stay idle when each sender is below threshold"
        );
    }

    #[test]
    fn aggregate_energy_cca_can_detect_combined_power() {
        let mut cfg = PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            shadowing_std_db: 0.0,
            enable_fading: false,
            ..PhyConfig::default()
        };
        cfg.cca_mode = CcaMode::AggregateEnergy;
        let mut channel = Channel::new(&cfg, &RngContext::new(7));

        let rx_id = 0;
        let rx_pos = Vec2::new(0.0, 0.0);
        let tx_a = (1, Vec2::new(2.0, 0.0));
        let tx_b = (2, Vec2::new(-2.0, 0.0));
        let transmissions = vec![tx_a, tx_b];

        let single_rx_power = channel.received_power_w(tx_a.1, rx_pos, tx_a.0, rx_id, SimTime::ZERO);
        let threshold_dbm = w_to_dbm(single_rx_power * 1.5);
        assert!(
            channel.carrier_sensed(rx_id, rx_pos, &transmissions, threshold_dbm, SimTime::ZERO),
            "aggregate-energy CCA should report busy when combined power exceeds threshold"
        );
    }
}
