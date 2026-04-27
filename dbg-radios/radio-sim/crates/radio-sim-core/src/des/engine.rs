use std::collections::BinaryHeap;

use super::event::{Event, EventKind, SimTime};

/// Discrete event simulation engine backed by a BinaryHeap (min-heap via reverse Ord).
pub struct DesEngine {
    queue: BinaryHeap<Event>,
    now: SimTime,
    seq_counter: u64,
    events_processed: u64,
}

impl DesEngine {
    pub fn new() -> Self {
        DesEngine {
            queue: BinaryHeap::with_capacity(4096),
            now: SimTime::ZERO,
            seq_counter: 0,
            events_processed: 0,
        }
    }

    /// Schedule an event at an absolute time.
    /// Panics in debug mode if time is in the past.
    pub fn schedule(&mut self, time: SimTime, priority: i8, kind: EventKind) {
        debug_assert!(
            time >= self.now,
            "Cannot schedule event in the past: {time} < {}",
            self.now
        );
        let seq = self.seq_counter;
        self.seq_counter += 1;
        self.queue.push(Event {
            time,
            priority,
            seq,
            kind,
        });
    }

    /// Schedule an event at now + delay.
    pub fn schedule_delay(&mut self, delay: SimTime, priority: i8, kind: EventKind) {
        self.schedule(self.now + delay, priority, kind);
    }

    /// Pop the next event. Returns None when queue is empty.
    pub fn next_event(&mut self) -> Option<Event> {
        let ev = self.queue.pop()?;
        self.now = ev.time;
        self.events_processed += 1;
        Some(ev)
    }

    /// Current simulation time.
    pub fn now(&self) -> SimTime {
        self.now
    }

    pub fn is_empty(&self) -> bool {
        self.queue.is_empty()
    }

    pub fn events_processed(&self) -> u64 {
        self.events_processed
    }

    pub fn pending_count(&self) -> usize {
        self.queue.len()
    }

    pub fn peek_next_time(&self) -> Option<SimTime> {
        self.queue.peek().map(|ev| ev.time)
    }

    /// Cancel all pending events matching a predicate. O(n) -- use sparingly.
    pub fn cancel_matching<F: Fn(&EventKind) -> bool>(&mut self, pred: F) {
        let old: Vec<Event> = self.queue.drain().collect();
        for ev in old {
            if !pred(&ev.kind) {
                self.queue.push(ev);
            }
        }
    }
}

impl Default for DesEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn schedule_and_pop() {
        let mut eng = DesEngine::new();
        eng.schedule(SimTime::from_us(10.0), 0, EventKind::SimEnd);
        eng.schedule(SimTime::from_us(5.0), 0, EventKind::SimEnd);
        let e1 = eng.next_event().unwrap();
        assert_eq!(e1.time, SimTime::from_us(5.0));
        let e2 = eng.next_event().unwrap();
        assert_eq!(e2.time, SimTime::from_us(10.0));
        assert!(eng.next_event().is_none());
    }

    #[test]
    fn schedule_delay() {
        let mut eng = DesEngine::new();
        eng.schedule(SimTime::from_us(10.0), 0, EventKind::SimEnd);
        eng.next_event(); // now = 10us
        eng.schedule_delay(SimTime::from_us(5.0), 0, EventKind::SimEnd);
        let e = eng.next_event().unwrap();
        assert_eq!(e.time, SimTime::from_us(15.0));
    }

    #[test]
    fn cancel_matching() {
        let mut eng = DesEngine::new();
        eng.schedule(
            SimTime::from_us(10.0),
            0,
            EventKind::AckTimeout {
                node_id: 1,
                packet_id: 42,
            },
        );
        eng.schedule(SimTime::from_us(20.0), 0, EventKind::SimEnd);
        eng.cancel_matching(|k| matches!(k, EventKind::AckTimeout { node_id: 1, .. }));
        let e = eng.next_event().unwrap();
        assert!(matches!(e.kind, EventKind::SimEnd));
        assert!(eng.next_event().is_none());
    }
}
