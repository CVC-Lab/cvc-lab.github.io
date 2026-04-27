# output/

Local runtime artifacts and scenario media assets.

## Typical Contents

- `comms_log.json`: baseline communication timeline metadata.
- `comms_log_enriched.json`: enriched timeline metadata.
- `audio/msg_*.wav`: source voice clips referenced by scenario traffic.
- `audio/reconstructed/*.wav`: reconstructed receiver-side audio outputs.

## Repository Policy

- `output/audio/` is ignored in Git by default at the repo root to avoid committing large binary payloads unintentionally.
- Keep `output/` as a local working directory for experiments and notebook demos.
- If sharing datasets publicly is required, prefer:
  - a release artifact,
  - object storage link, or
  - Git LFS with explicit retention policy.
