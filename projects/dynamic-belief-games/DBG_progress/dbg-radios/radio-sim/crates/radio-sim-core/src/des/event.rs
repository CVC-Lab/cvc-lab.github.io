use std::cmp::Ordering;

use serde::{Deserialize, Serialize};

/// Simulation time in nanoseconds from epoch 0.
/// u64 gives ~584 years of range with sub-microsecond precision.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct SimTime(pub u64);

impl SimTime {
    pub const ZERO: SimTime = SimTime(0);
    pub const MAX: SimTime = SimTime(u64::MAX);

    pub fn from_us(us: f64) -> Self {
        SimTime((us * 1_000.0) as u64)
    }

    pub fn from_ms(ms: f64) -> Self {
        SimTime((ms * 1_000_000.0) as u64)
    }

    pub fn from_s(s: f64) -> Self {
        SimTime((s * 1_000_000_000.0) as u64)
    }

    pub fn as_ns(&self) -> u64 {
        self.0
    }

    pub fn as_us(&self) -> f64 {
        self.0 as f64 / 1_000.0
    }

    pub fn as_ms(&self) -> f64 {
        self.0 as f64 / 1_000_000.0
    }

    pub fn as_s(&self) -> f64 {
        self.0 as f64 / 1_000_000_000.0
    }
}

impl std::ops::Add for SimTime {
    type Output = SimTime;
    fn add(self, rhs: SimTime) -> SimTime {
        SimTime(self.0 + rhs.0)
    }
}

impl std::ops::Sub for SimTime {
    type Output = SimTime;
    fn sub(self, rhs: SimTime) -> SimTime {
        SimTime(self.0.saturating_sub(rhs.0))
    }
}

impl std::fmt::Display for SimTime {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if self.0 >= 1_000_000_000 {
            write!(f, "{:.3}s", self.as_s())
        } else if self.0 >= 1_000_000 {
            write!(f, "{:.3}ms", self.as_ms())
        } else if self.0 >= 1_000 {
            write!(f, "{:.1}us", self.as_us())
        } else {
            write!(f, "{}ns", self.0)
        }
    }
}

pub type NodeId = u16;
pub type PacketId = u64;

/// Slot roles in the TDMA frame structure.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SlotRole {
    /// Data Link Channel -- user data transmission/relay
    DLC,
    /// Relay Link Channel -- telemetry beacons
    RLC,
    /// Controller Link Channel -- schedule announcements
    CLC,
}

/// All events processed by the DES engine.
#[derive(Debug, Clone)]
pub enum EventKind {
    // -- TDMA slot structure --
    SlotStart {
        frame: u32,
        slot: u16,
        role: SlotRole,
    },
    SlotEnd {
        frame: u32,
        slot: u16,
    },

    // -- Transmission lifecycle --
    TxBegin {
        node_id: NodeId,
        packet_id: PacketId,
    },
    TxEnd {
        node_id: NodeId,
        packet_id: PacketId,
    },

    // -- Reception (produced by PHY after propagation) --
    SignalArrivalStart {
        rx_node: NodeId,
        tx_node: NodeId,
        packet_id: PacketId,
    },
    SignalArrivalEnd {
        rx_node: NodeId,
        tx_node: NodeId,
        packet_id: PacketId,
    },
    /// All signals arriving at a receiver during a slot/tx window.
    RxBatch {
        rx_node: NodeId,
    },
    CarrierSenseUpdate {
        node_id: NodeId,
    },

    // -- CSMA-specific timers --
    CcaSample {
        node_id: NodeId,
    },
    DifsExpired {
        node_id: NodeId,
    },
    SifsExpired {
        node_id: NodeId,
    },
    BackoffTick {
        node_id: NodeId,
    },
    AckTimeout {
        node_id: NodeId,
        packet_id: PacketId,
    },

    // -- Traffic generation --
    TrafficGenerate {
        node_id: NodeId,
    },

    // -- Simulation control --
    SimEnd,
}

/// A scheduled event in the DES engine.
#[derive(Debug, Clone)]
pub struct Event {
    pub time: SimTime,
    /// Lower number = higher priority. ACK(-1) > Data(0) > Metrics(1).
    pub priority: i8,
    /// Monotonic sequence number for deterministic tie-breaking.
    pub seq: u64,
    pub kind: EventKind,
}

impl Eq for Event {}

impl PartialEq for Event {
    fn eq(&self, other: &Self) -> bool {
        self.time == other.time && self.priority == other.priority && self.seq == other.seq
    }
}

// Reverse ordering for BinaryHeap (min-heap behavior).
impl Ord for Event {
    fn cmp(&self, other: &Self) -> Ordering {
        other
            .time
            .cmp(&self.time)
            .then(other.priority.cmp(&self.priority))
            .then(other.seq.cmp(&self.seq))
    }
}

impl PartialOrd for Event {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simtime_conversions() {
        let t = SimTime::from_ms(1.5);
        assert_eq!(t.as_ns(), 1_500_000);
        assert!((t.as_us() - 1500.0).abs() < 1e-6);
        assert!((t.as_ms() - 1.5).abs() < 1e-9);
    }

    #[test]
    fn simtime_arithmetic() {
        let a = SimTime::from_us(100.0);
        let b = SimTime::from_us(50.0);
        assert_eq!((a + b).as_us(), 150.0);
        assert_eq!((a - b).as_us(), 50.0);
        // Saturating sub
        assert_eq!((b - a), SimTime::ZERO);
    }

    #[test]
    fn event_ordering_min_heap() {
        use std::collections::BinaryHeap;
        let mut heap = BinaryHeap::new();
        heap.push(Event {
            time: SimTime::from_us(200.0),
            priority: 0,
            seq: 0,
            kind: EventKind::SimEnd,
        });
        heap.push(Event {
            time: SimTime::from_us(100.0),
            priority: 0,
            seq: 1,
            kind: EventKind::SimEnd,
        });
        heap.push(Event {
            time: SimTime::from_us(100.0),
            priority: -1,
            seq: 2,
            kind: EventKind::SimEnd,
        });
        // Earliest time first, then lowest priority number (highest priority)
        let e1 = heap.pop().unwrap();
        assert_eq!(e1.time, SimTime::from_us(100.0));
        // Among same time: lower priority number = higher priority = popped first
        // -1 < 0, so -1 should come first
        assert_eq!(e1.priority, -1, "priority -1 should pop before 0");
        let e2 = heap.pop().unwrap();
        assert_eq!(e2.time, SimTime::from_us(100.0));
        assert_eq!(e2.priority, 0);
        let e3 = heap.pop().unwrap();
        assert_eq!(e3.time, SimTime::from_us(200.0));
    }
}
