use crate::config::{PathLossModel, PhyConfig};
use crate::units::fspl_at_ref;

/// Compute path loss in dB for a given distance and config.
pub fn path_loss_db(config: &PhyConfig, distance_m: f64) -> f64 {
    let d = distance_m.max(config.reference_distance_m);
    match config.path_loss_model {
        PathLossModel::LogDistance => log_distance(config, d),
        PathLossModel::MultiSlope => multi_slope(config, d),
        PathLossModel::FreeSpace => free_space(config.carrier_freq_hz, d),
    }
}

/// Free-space path loss in dB:
/// FSPL = 20*log10(d_m) + 20*log10(f_hz) - 147.55
fn free_space(freq_hz: f64, distance_m: f64) -> f64 {
    20.0 * distance_m.log10() + 20.0 * freq_hz.log10() - 147.55
}

/// Log-distance path loss: PL(d) = PL0 + 10*n*log10(d/d0)
fn log_distance(config: &PhyConfig, d: f64) -> f64 {
    let pl0 = fspl_at_ref(config.carrier_freq_hz, config.reference_distance_m);
    pl0 + 10.0 * config.path_loss_exponent * (d / config.reference_distance_m).log10()
}

/// Multi-slope: near-field log-distance, far-field two-ray ground reflection.
fn multi_slope(config: &PhyConfig, d: f64) -> f64 {
    let pl0 = fspl_at_ref(config.carrier_freq_hz, config.reference_distance_m);
    let near = pl0 + 10.0 * config.path_loss_exponent * (d / config.reference_distance_m).log10();

    let ht = config.tx_antenna_height_m;
    let hr = config.rx_antenna_height_m;
    if ht <= 0.0 || hr <= 0.0 || d <= 1.0 {
        return near;
    }
    let far = 40.0 * d.log10() - 20.0 * ht.log10() - 20.0 * hr.log10();

    // Take the maximum for monotonicity
    near.max(far)
}

/// Two-ray breakpoint distance: 4*pi*ht*hr / lambda.
pub fn breakpoint_distance(config: &PhyConfig) -> f64 {
    let lambda = 3e8 / config.carrier_freq_hz;
    4.0 * std::f64::consts::PI * config.tx_antenna_height_m * config.rx_antenna_height_m / lambda
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> PhyConfig {
        PhyConfig::default()
    }

    #[test]
    fn log_distance_increases() {
        let cfg = test_config();
        let pl1 = path_loss_db(
            &PhyConfig {
                path_loss_model: PathLossModel::LogDistance,
                ..cfg.clone()
            },
            10.0,
        );
        let pl2 = path_loss_db(
            &PhyConfig {
                path_loss_model: PathLossModel::LogDistance,
                ..cfg
            },
            100.0,
        );
        assert!(pl2 > pl1, "Path loss should increase with distance");
    }

    #[test]
    fn multi_slope_monotonic() {
        let cfg = test_config();
        let mut prev = 0.0;
        for d in [1.0, 10.0, 50.0, 100.0, 500.0, 1000.0] {
            let pl = path_loss_db(&cfg, d);
            assert!(pl >= prev, "Multi-slope must be monotonic: {pl} < {prev} at d={d}");
            prev = pl;
        }
    }

    #[test]
    fn free_space_formula_matches_reference() {
        let freq_hz = 2.4e9;
        let distance_m = 100.0;
        let got = free_space(freq_hz, distance_m);
        let expected = 20.0 * distance_m.log10() + 20.0 * freq_hz.log10() - 147.55;
        assert!((got - expected).abs() < 1e-9);
    }

    #[test]
    fn free_space_monotonic() {
        let cfg = PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            ..test_config()
        };
        let p1 = path_loss_db(&cfg, 10.0);
        let p2 = path_loss_db(&cfg, 100.0);
        assert!(p2 > p1, "FSPL should increase with distance");
    }
}
