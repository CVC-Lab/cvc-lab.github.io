use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use rand_distr::{Distribution, Normal};
use sha2::{Digest, Sha256};

/// Run-scoped deterministic RNG with named substreams.
/// Each substream is derived from SHA-256(seed || "::" || name),
/// matching the Python implementation for cross-validation.
#[derive(Debug, Clone)]
pub struct RngContext {
    seed: u64,
}

impl RngContext {
    pub fn new(seed: u64) -> Self {
        RngContext { seed }
    }

    /// Create a named substream. Deterministic for a given (seed, name).
    pub fn stream(&self, name: &str) -> RngStream {
        let mut hasher = Sha256::new();
        hasher.update(self.seed.to_le_bytes());
        hasher.update(b"::");
        hasher.update(name.as_bytes());
        let hash = hasher.finalize();
        let child_seed = u64::from_le_bytes(hash[..8].try_into().unwrap());
        RngStream {
            rng: StdRng::seed_from_u64(child_seed),
            parent_seed: self.seed,
        }
    }

    pub fn seed(&self) -> u64 {
        self.seed
    }
}

/// A single deterministic RNG substream.
#[derive(Debug, Clone)]
pub struct RngStream {
    rng: StdRng,
    parent_seed: u64,
}

impl RngStream {
    /// Generate a uniform float in [0, 1).
    pub fn gen_float(&mut self) -> f64 {
        self.rng.gen::<f64>()
    }

    /// Generate a uniform integer in [low, high].
    pub fn gen_range_int(&mut self, low: i64, high: i64) -> i64 {
        self.rng.gen_range(low..=high)
    }

    /// Generate a uniform float in [low, high).
    pub fn gen_range_float(&mut self, low: f64, high: f64) -> f64 {
        self.rng.gen_range(low..high)
    }

    /// Bernoulli trial with probability p.
    pub fn gen_bool(&mut self, p: f64) -> bool {
        self.gen_float() < p
    }

    /// Gaussian sample with given mean and standard deviation.
    pub fn gauss(&mut self, mean: f64, std: f64) -> f64 {
        if !std.is_finite() || std <= 0.0 {
            return mean;
        }
        let normal = Normal::new(mean, std).unwrap();
        normal.sample(&mut self.rng)
    }

    /// Choose a random element from a slice.
    pub fn choice<T: Clone>(&mut self, items: &[T]) -> Option<T> {
        if items.is_empty() {
            return None;
        }
        let idx = self.rng.gen_range(0..items.len());
        Some(items[idx].clone())
    }

    /// Create a child substream for further partitioning.
    pub fn sub_stream(&self, name: &str) -> RngStream {
        let ctx = RngContext {
            seed: self.parent_seed,
        };
        ctx.stream(name)
    }

    /// Access the inner RNG for use with rand distributions.
    pub fn inner(&mut self) -> &mut StdRng {
        &mut self.rng
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deterministic_same_seed() {
        let ctx1 = RngContext::new(42);
        let ctx2 = RngContext::new(42);
        let mut s1 = ctx1.stream("test");
        let mut s2 = ctx2.stream("test");
        for _ in 0..100 {
            assert_eq!(s1.gen_float(), s2.gen_float());
        }
    }

    #[test]
    fn different_names_different_streams() {
        let ctx = RngContext::new(42);
        let mut a = ctx.stream("alpha");
        let mut b = ctx.stream("beta");
        // Very unlikely to be equal
        let va: Vec<f64> = (0..10).map(|_| a.gen_float()).collect();
        let vb: Vec<f64> = (0..10).map(|_| b.gen_float()).collect();
        assert_ne!(va, vb);
    }

    #[test]
    fn different_seeds_different_streams() {
        let mut a = RngContext::new(1).stream("x");
        let mut b = RngContext::new(2).stream("x");
        let va: Vec<f64> = (0..10).map(|_| a.gen_float()).collect();
        let vb: Vec<f64> = (0..10).map(|_| b.gen_float()).collect();
        assert_ne!(va, vb);
    }
}
