/// Convert watts to dBm.
pub fn w_to_dbm(w: f64) -> f64 {
    10.0 * w.log10() + 30.0
}

/// Convert dBm to watts.
pub fn dbm_to_w(dbm: f64) -> f64 {
    10.0f64.powf((dbm - 30.0) / 10.0)
}

/// Convert linear ratio to dB.
pub fn linear_to_db(lin: f64) -> f64 {
    10.0 * lin.log10()
}

/// Convert dB to linear ratio.
pub fn db_to_linear(db: f64) -> f64 {
    10.0f64.powf(db / 10.0)
}

/// Thermal noise power in watts: kTB.
pub fn thermal_noise_w(bandwidth_hz: f64, noise_figure_db: f64) -> f64 {
    const K_BOLTZMANN: f64 = 1.380649e-23;
    const T_AMBIENT: f64 = 290.0;
    K_BOLTZMANN * T_AMBIENT * bandwidth_hz * db_to_linear(noise_figure_db)
}

/// Free-space path loss at reference distance (dB).
pub fn fspl_at_ref(freq_hz: f64, ref_distance_m: f64) -> f64 {
    let lambda = 3e8 / freq_hz;
    20.0 * (4.0 * std::f64::consts::PI * ref_distance_m / lambda).log10()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_dbm_w() {
        let w = 1.0;
        let dbm = w_to_dbm(w);
        assert!((dbm - 30.0).abs() < 1e-10);
        assert!((dbm_to_w(dbm) - w).abs() < 1e-10);
    }

    #[test]
    fn roundtrip_db_linear() {
        let lin = 100.0;
        let db = linear_to_db(lin);
        assert!((db - 20.0).abs() < 1e-10);
        assert!((db_to_linear(db) - lin).abs() < 1e-10);
    }

    #[test]
    fn thermal_noise_sanity() {
        // 20 MHz BW, 6 dB NF => approx -95 dBm
        let n_w = thermal_noise_w(20e6, 6.0);
        let n_dbm = w_to_dbm(n_w);
        assert!(n_dbm > -100.0 && n_dbm < -90.0, "noise = {n_dbm} dBm");
    }
}
