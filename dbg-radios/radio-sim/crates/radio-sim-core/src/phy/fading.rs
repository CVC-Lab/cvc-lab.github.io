use crate::rng::RngStream;

/// Jakes/Clarke sum-of-sinusoids fading generator.
/// Produces Rayleigh (K=0) or Rician (K>0) fading samples.
pub struct JakesFader {
    num_sinusoids: usize,
    /// Cosine component phases (one per sinusoid).
    phases_i: Vec<f64>,
    /// Sine component phases.
    phases_q: Vec<f64>,
    /// Rician K-factor (0 = Rayleigh).
    k_factor: f64,
}

impl JakesFader {
    pub fn new(k_factor: f64, rng: &mut RngStream) -> Self {
        let m = 16usize;
        let phases_i: Vec<f64> = (0..m)
            .map(|_| rng.gen_range_float(0.0, 2.0 * std::f64::consts::PI))
            .collect();
        let phases_q: Vec<f64> = (0..m)
            .map(|_| rng.gen_range_float(0.0, 2.0 * std::f64::consts::PI))
            .collect();
        JakesFader {
            num_sinusoids: m,
            phases_i,
            phases_q,
            k_factor,
        }
    }

    /// Generate a fading gain (linear power) at a given Doppler-normalized time.
    /// `fd_t` = f_doppler * t (dimensionless).
    pub fn sample(&self, fd_t: f64) -> f64 {
        let m = self.num_sinusoids as f64;
        let inv_sqrt_m = 1.0 / m.sqrt();
        let two_pi = 2.0 * std::f64::consts::PI;

        let mut i_sum = 0.0;
        let mut q_sum = 0.0;
        for n in 0..self.num_sinusoids {
            let alpha_n = two_pi * (n as f64) / m;
            let cos_doppler = (two_pi * fd_t * alpha_n.cos() + self.phases_i[n]).cos();
            let sin_doppler = (two_pi * fd_t * alpha_n.cos() + self.phases_q[n]).sin();
            i_sum += cos_doppler;
            q_sum += sin_doppler;
        }
        i_sum *= inv_sqrt_m;
        q_sum *= inv_sqrt_m;

        // Add Rician LOS component
        let k = self.k_factor;
        let scale = 1.0 / (k + 1.0);
        let los_power = k / (k + 1.0);

        // Fading envelope squared (power gain)
        scale * (i_sum * i_sum + q_sum * q_sum) + los_power
    }
}

impl std::fmt::Debug for JakesFader {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("JakesFader")
            .field("num_sinusoids", &self.num_sinusoids)
            .field("k_factor", &self.k_factor)
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rng::RngContext;

    #[test]
    fn rayleigh_mean_approx_one() {
        let ctx = RngContext::new(42);
        let mut rng = ctx.stream("fading_test");
        let fader = JakesFader::new(0.0, &mut rng);
        let n = 10000;
        let sum: f64 = (0..n).map(|i| fader.sample(i as f64 * 0.01)).sum();
        let mean = sum / n as f64;
        // Rayleigh power gain should average ~1.0 (with M=16 sinusoids, variance is significant)
        assert!(
            (mean - 1.0).abs() < 0.5,
            "Mean fading gain = {mean}, expected ~1.0"
        );
    }
}
