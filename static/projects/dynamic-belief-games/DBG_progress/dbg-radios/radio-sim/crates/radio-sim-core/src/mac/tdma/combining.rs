use crate::config::{CombiningMode, GuardFallbackMode};
use crate::phy::channel::RxSignal;

/// Apply cooperative combining to a group of signals carrying the same packet.
/// Returns combined SINR in dB, or None if no valid signals.
pub fn combine_signals(signals: &[&RxSignal], mode: CombiningMode) -> Option<f64> {
    if signals.is_empty() {
        return None;
    }

    let branch_sinr = |s: &RxSignal| {
        if s.other_plus_noise_w > 0.0 {
            s.rx_power_w / s.other_plus_noise_w
        } else {
            0.0
        }
    };

    let combined_linear = match mode {
        CombiningMode::MRC => {
            // Maximum Ratio Combining over branches with shared external interference.
            signals.iter().map(|s| branch_sinr(s)).sum::<f64>()
        }
        CombiningMode::EGC => {
            // Equal Gain Combining: (sum of sqrt(SINR))^2
            let sum_sqrt: f64 = signals
                .iter()
                .map(|s| branch_sinr(s).max(0.0).sqrt())
                .sum();
            sum_sqrt * sum_sqrt
        }
        CombiningMode::SC => {
            // Selection Combining: max individual SINR
            signals
                .iter()
                .map(|s| branch_sinr(s))
                .fold(0.0f64, f64::max)
        }
    };

    if combined_linear <= 0.0 {
        return None;
    }

    Some(10.0 * combined_linear.log10())
}

/// Filter signals by guard-time window. Signals arriving too late are excluded.
pub fn filter_guard_time(
    signals: &[RxSignal],
    guard_time_us: f64,
    fallback_mode: GuardFallbackMode,
) -> Vec<&RxSignal> {
    let mut filtered: Vec<&RxSignal> = signals
        .iter()
        .filter(|s| s.toa_offset_us <= guard_time_us)
        .collect();

    // Optional fallback for real-world receiver behavior when all paths miss guard.
    if filtered.is_empty() && matches!(fallback_mode, GuardFallbackMode::StrongestFallback) {
        if let Some(strongest) = signals.iter().max_by(|a, b| {
            a.rx_power_w
                .partial_cmp(&b.rx_power_w)
                .unwrap_or(std::cmp::Ordering::Equal)
        }) {
            filtered.push(strongest);
        }
    }

    filtered
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::des::SimTime;
    use crate::packet::{Packet, PacketKind};

    fn make_signal(sinr_linear: f64, rx_power: f64, toa_us: f64) -> RxSignal {
        let other_plus_noise_w = if sinr_linear > 0.0 {
            rx_power / sinr_linear
        } else {
            f64::INFINITY
        };
        RxSignal {
            packet: Packet {
                id: 1,
                source_id: 0,
                dest_id: None,
                kind: PacketKind::Data,
                creation_time: SimTime::ZERO,
                payload_bits: 1024,
                payload: None,
                media: None,
                message_id: None,
                frame_index: None,
                hop_count: 0,
                max_hops: 5,
                delivered: false,
                region_id: None,
            },
            rx_power_w: rx_power,
            sinr_linear,
            sinr_db: 10.0 * sinr_linear.log10(),
            preamble_sinr_db: 10.0 * sinr_linear.log10(),
            tx_node_id: 0,
            other_plus_noise_w,
            toa_offset_us: toa_us,
            start_offset_us: 0.0,
            overlap_packet_count: 1,
        }
    }

    #[test]
    fn mrc_sums_sinr() {
        let s1 = make_signal(10.0, 1.0, 0.0);
        let s2 = make_signal(5.0, 0.5, 0.0);
        let combined = combine_signals(&[&s1, &s2], CombiningMode::MRC).unwrap();
        let expected_db = 10.0 * 15.0f64.log10();
        assert!((combined - expected_db).abs() < 0.01);
    }

    #[test]
    fn sc_picks_max() {
        let s1 = make_signal(10.0, 1.0, 0.0);
        let s2 = make_signal(5.0, 0.5, 0.0);
        let combined = combine_signals(&[&s1, &s2], CombiningMode::SC).unwrap();
        let expected_db = 10.0 * 10.0f64.log10();
        assert!((combined - expected_db).abs() < 0.01);
    }

    #[test]
    fn guard_time_filters() {
        let s1 = make_signal(10.0, 1.0, 1.0); // within 5us
        let s2 = make_signal(5.0, 0.5, 10.0); // outside 5us
        let signals = [s1, s2];
        let filtered = filter_guard_time(&signals, 5.0, GuardFallbackMode::StrongestFallback);
        assert_eq!(filtered.len(), 1);
        assert!((filtered[0].sinr_linear - 10.0).abs() < 0.01);
    }

    #[test]
    fn strict_guard_mode_drops_all_late_paths() {
        let s1 = make_signal(10.0, 1.0, 7.0);
        let s2 = make_signal(8.0, 0.8, 8.0);
        let signals = [s1, s2];
        let filtered = filter_guard_time(&signals, 5.0, GuardFallbackMode::Strict);
        assert!(filtered.is_empty());
    }

    #[test]
    fn strongest_fallback_mode_keeps_one_when_all_late() {
        let s1 = make_signal(10.0, 1.0, 7.0);
        let s2 = make_signal(8.0, 2.0, 8.0);
        let signals = [s1, s2];
        let filtered = filter_guard_time(&signals, 5.0, GuardFallbackMode::StrongestFallback);
        assert_eq!(filtered.len(), 1);
        assert!((filtered[0].rx_power_w - 2.0).abs() < 1e-9);
    }

    #[test]
    fn combining_uses_other_plus_noise_denominator() {
        let mut s1 = make_signal(0.01, 10.0, 0.0);
        let mut s2 = make_signal(0.01, 10.0, 0.0);
        // Per-branch SINR from power/denom is 10, independent of sinr_linear field.
        s1.other_plus_noise_w = 1.0;
        s2.other_plus_noise_w = 1.0;
        let combined = combine_signals(&[&s1, &s2], CombiningMode::MRC).unwrap();
        let expected_db = 10.0 * 20.0f64.log10(); // 10 + 10 linear
        assert!((combined - expected_db).abs() < 0.01);
    }
}
