use std::collections::VecDeque;

use crate::des::{NodeId, PacketId};
use crate::packet::Packet;

use super::position::Vec2;

/// A radio node in the simulation.
#[derive(Debug)]
pub struct Node {
    pub id: NodeId,
    pub position: Vec2,
    /// Queue of packets waiting for MAC to transmit.
    pub tx_queue: VecDeque<Packet>,
    /// Whether this node is currently transmitting (for carrier sense).
    pub is_transmitting: bool,
    /// Set of packet IDs originated by this node.
    pub created_packets: hashbrown::HashSet<PacketId>,
}

impl Node {
    pub fn new(id: NodeId, position: Vec2) -> Self {
        Node {
            id,
            position,
            tx_queue: VecDeque::new(),
            is_transmitting: false,
            created_packets: hashbrown::HashSet::new(),
        }
    }
}
