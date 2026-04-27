use crate::rng::RngStream;

/// Binary exponential backoff with configurable CW range.
#[derive(Debug)]
pub struct BinaryBackoff {
    /// Contention window size in slots (drawn uniformly over [0, cw-1]).
    cw_min: u32,
    /// Maximum contention window size in slots.
    cw_max: u32,
    max_stage: u8,
    stage: u8,
    cw: u32,
    counter: u32,
    frozen: bool,
}

impl BinaryBackoff {
    /// Create a new backoff with exponential CW parameters.
    /// cw_min_exp: e.g. 3 => CW_min = 2^3 = 8 slots
    /// cw_max_exp: e.g. 6 => CW_max = 2^6 = 64 slots
    pub fn new(cw_min_exp: u8, cw_max_exp: u8, max_stage: u8) -> Self {
        BinaryBackoff {
            cw_min: 1u32 << cw_min_exp,
            cw_max: 1u32 << cw_max_exp,
            max_stage,
            stage: 0,
            cw: 1u32 << cw_min_exp,
            counter: 0,
            frozen: false,
        }
    }

    pub fn reconfigure(&mut self, cw_min_exp: u8, cw_max_exp: u8) {
        self.cw_min = 1u32 << cw_min_exp;
        self.cw_max = 1u32 << cw_max_exp;
        let stage_cw = self
            .cw_min
            .checked_shl(self.stage as u32)
            .unwrap_or(u32::MAX)
            .min(self.cw_max)
            .max(self.cw_min);
        self.cw = stage_cw;
        if self.counter >= self.cw {
            self.counter = self.cw.saturating_sub(1);
        }
    }

    /// Reset backoff to initial state and draw new counter.
    pub fn reset(&mut self, rng: &mut RngStream) {
        self.stage = 0;
        self.cw = self.cw_min;
        self.counter = rng.gen_range_int(0, self.cw as i64 - 1) as u32;
        self.frozen = false;
    }

    /// Handle transmission failure: double CW and draw new counter.
    pub fn fail(&mut self, rng: &mut RngStream) {
        if self.stage < self.max_stage {
            self.stage += 1;
        }
        self.cw = (self.cw * 2).min(self.cw_max);
        self.counter = rng.gen_range_int(0, self.cw as i64 - 1) as u32;
        self.frozen = false;
    }

    /// Handle successful transmission.
    pub fn success(&mut self, rng: &mut RngStream) {
        self.reset(rng);
    }

    /// Decrement counter by one slot. Returns true when counter transitions to zero.
    pub fn decrement(&mut self) -> bool {
        if self.frozen || self.counter == 0 {
            return false;
        }
        self.counter -= 1;
        self.counter == 0
    }

    /// Freeze the backoff counter (medium busy).
    pub fn freeze(&mut self) {
        self.frozen = true;
    }

    /// Resume the backoff counter (medium idle).
    pub fn resume(&mut self) {
        self.frozen = false;
    }

    /// Check if backoff counter has reached zero and is not frozen.
    pub fn is_zero(&self) -> bool {
        self.counter == 0 && !self.frozen
    }

    pub fn counter(&self) -> u32 {
        self.counter
    }

    pub fn set_counter(&mut self, counter: u32) {
        self.counter = counter.min(self.cw.saturating_sub(1));
    }

    pub fn stage(&self) -> u8 {
        self.stage
    }

    pub fn current_cw(&self) -> u32 {
        self.cw
    }

    pub fn current_cw_exp(&self) -> u8 {
        self.cw.ilog2() as u8
    }

    pub fn is_frozen(&self) -> bool {
        self.frozen
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rng::RngContext;

    #[test]
    fn fail_doubles_cw() {
        let ctx = RngContext::new(42);
        let mut rng = ctx.stream("backoff_test");
        let mut bo = BinaryBackoff::new(4, 10, 6);
        bo.reset(&mut rng);
        let cw0 = bo.current_cw();
        assert_eq!(cw0, 16); // 2^4

        bo.fail(&mut rng);
        assert_eq!(bo.current_cw(), 32); // 16*2
    }

    #[test]
    fn decrement_to_zero() {
        let ctx = RngContext::new(99);
        let mut rng = ctx.stream("bo");
        let mut bo = BinaryBackoff::new(2, 4, 3); // CW_min = 4
        bo.reset(&mut rng);

        // Decrement until zero
        let mut ticks = 0;
        loop {
            if bo.is_zero() {
                break;
            }
            bo.decrement();
            ticks += 1;
            assert!(ticks <= 100, "Backoff should reach zero");
        }
        assert!(bo.is_zero());
    }

    #[test]
    fn freeze_prevents_decrement() {
        let ctx = RngContext::new(1);
        let mut rng = ctx.stream("bo");
        let mut bo = BinaryBackoff::new(4, 10, 6);
        bo.reset(&mut rng);
        // Force a known counter
        bo.counter = 5;
        bo.freeze();
        assert!(!bo.decrement(), "frozen backoff should not decrement");
        assert_eq!(bo.counter(), 5);
        bo.resume();
        // decrement() returns true only when transitioning to zero.
        // 5 -> 4 is not zero, so returns false.
        let hit_zero = bo.decrement();
        assert!(!hit_zero, "5->4 should not be zero");
        assert_eq!(bo.counter(), 4);
    }

    #[test]
    fn draw_uses_window_size_bounds() {
        let ctx = RngContext::new(7);
        let mut rng = ctx.stream("bo_bounds");
        let mut bo = BinaryBackoff::new(1, 2, 3); // cw_min=2, cw_max=4

        for _ in 0..64 {
            bo.reset(&mut rng);
            assert!(
                bo.counter() <= 1,
                "counter={} should be in [0,1] for cw=2",
                bo.counter()
            );
            bo.fail(&mut rng); // cw=4
            assert!(
                bo.counter() <= 3,
                "counter={} should be in [0,3] for cw=4",
                bo.counter()
            );
        }
    }
}
