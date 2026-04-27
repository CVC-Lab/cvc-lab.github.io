/// Per-node distributed channel schedule state for CBR.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SlotState {
    Source,
    Destination,
    Relay,
    Buffer,
    Uninvolved,
}

impl Default for SlotState {
    fn default() -> Self {
        SlotState::Uninvolved
    }
}
