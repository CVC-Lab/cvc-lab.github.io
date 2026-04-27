use crate::des::NodeId;
use hashbrown::HashMap;

/// BAC (Barrage Access Control) fixed scheduler.
/// Assigns nodes to DLC slots in round-robin fashion.
#[derive(Debug)]
pub struct BacScheduler {
    /// slot_index -> list of node IDs that may originate in that slot.
    schedule: HashMap<u16, Vec<NodeId>>,
    /// Number of DLC slots to drain after a source switch.
    drain_slots: u8,
}

impl BacScheduler {
    /// Build a round-robin schedule given slot roles and node count.
    pub fn round_robin(dlc_slot_indices: &[u16], num_nodes: u16, drain_slots: u8) -> Self {
        let mut schedule: HashMap<u16, Vec<NodeId>> = HashMap::new();
        if dlc_slot_indices.is_empty() {
            return BacScheduler {
                schedule,
                drain_slots,
            };
        }
        for node_id in 0..num_nodes {
            let slot_idx = dlc_slot_indices[node_id as usize % dlc_slot_indices.len()];
            schedule.entry(slot_idx).or_default().push(node_id);
        }
        BacScheduler {
            schedule,
            drain_slots,
        }
    }

    /// Check if a node may originate in a given slot at the current DLC index.
    pub fn may_originate(&self, node_id: NodeId, slot: u16, dlc_index: u32) -> bool {
        if let Some(nodes) = self.schedule.get(&slot) {
            if nodes.is_empty() {
                return false;
            }
            // Rotate among assigned nodes using DLC index
            let active_idx = (dlc_index as usize / self.drain_slots.max(1) as usize) % nodes.len();
            nodes[active_idx] == node_id
        } else {
            false
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_robin_basic() {
        let dlc_slots = vec![2, 3, 4, 6, 7, 8, 9, 10, 11]; // 9 DLC slots
        let bac = BacScheduler::round_robin(&dlc_slots, 5, 2);

        // Node 0 should be assigned to slot 2 (0 % 9 = 0 -> index 0)
        assert!(bac.may_originate(0, 2, 0));
        // Node 1 should be assigned to slot 3
        assert!(bac.may_originate(1, 3, 0));
    }

    #[test]
    fn drain_rotation() {
        let dlc_slots = vec![0];
        let bac = BacScheduler::round_robin(&dlc_slots, 3, 2);

        // With drain=2, node rotates every 2 DLC indices
        assert!(bac.may_originate(0, 0, 0)); // dlc 0: node 0
        assert!(bac.may_originate(0, 0, 1)); // dlc 1: still node 0 (drain)
        assert!(bac.may_originate(1, 0, 2)); // dlc 2: node 1
        assert!(bac.may_originate(1, 0, 3)); // dlc 3: still node 1
        assert!(bac.may_originate(2, 0, 4)); // dlc 4: node 2
    }
}
