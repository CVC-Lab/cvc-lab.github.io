use serde::{Deserialize, Serialize};

/// 2D position vector.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Vec2 {
    pub x: f64,
    pub y: f64,
}

impl Vec2 {
    pub const ZERO: Vec2 = Vec2 { x: 0.0, y: 0.0 };

    pub fn new(x: f64, y: f64) -> Self {
        Vec2 { x, y }
    }

    pub fn distance_to(&self, other: &Vec2) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }

    pub fn distance_sq(&self, other: &Vec2) -> f64 {
        (self.x - other.x).powi(2) + (self.y - other.y).powi(2)
    }
}

impl Default for Vec2 {
    fn default() -> Self {
        Vec2::ZERO
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn distance() {
        let a = Vec2::new(0.0, 0.0);
        let b = Vec2::new(3.0, 4.0);
        assert!((a.distance_to(&b) - 5.0).abs() < 1e-10);
    }
}
