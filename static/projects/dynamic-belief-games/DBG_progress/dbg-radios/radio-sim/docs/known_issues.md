# Known Issues and Caveats

## Active Caveats

| ID | Area | Current Behavior | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| RS-001 | Overlay scheduling | `control_overlay.observation_interval_ms` is validated but does not auto-drive step timing. | Users may assume automatic cadence and get stale/empty observations. | Drive cadence explicitly with `run_until_ms(...)` in caller loop. |
| RS-002 | TDMA local control | TDMA `apply_local_action` is currently a no-op. | Overlay experiments only influence CSMA behavior today. | Use CSMA for local-control efficacy studies; document TDMA limitation in reports. |
| RS-003 | TDMA slot roles | `RLC`/`CLC` branches are placeholders in TDMA MAC. | Expecting full control-beacon role behavior can be misleading. | Treat DLC as active data path; avoid over-claiming RLC/CLC functionality. |
| RS-004 | Scenario mobility | Scenario/media position arrays currently apply timestep 0 only. | No mobility playback from manifest/comms position timelines. | Use static-position assumptions explicitly; avoid mobility claims from scenario files. |
| RS-005 | Summary interpretation | `drop_events` counts total drop events, including retry-path events before eventual delivery. | High sender-confirmed PDR can coexist with nonzero drops. | Interpret `drop_events` together with `packets_failed` and `pdr_sender_confirmed`. |
| RS-006 | PDR interpretation | `pdr_receiver_pairwise` can exceed 1.0 under fanout. | Users may mistake this for a bug. | Use `pdr_sender_confirmed`/`pdr_receiver_unique` for bounded ratios. |

## Intentionally Unsupported Config Values

Validation rejects the following to avoid silent no-op behavior:

- `mac.csma.enable_rts_cts = true`
- `mac.tdma.enable_sic = true`
- non-default `phy.los_k_factor`, `phy.los_threshold_m`, `phy.snr_threshold_db`

## Documentation Gaps to Keep Updating

- Expand TDMA action/control semantics when TDMA overlay support lands.
- Add explicit schema examples for media manifests and scenario logs in docs.
- Keep conformance baseline lifecycle documented as gate policy evolves.
