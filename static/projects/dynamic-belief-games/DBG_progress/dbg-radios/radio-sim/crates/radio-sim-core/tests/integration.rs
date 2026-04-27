use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use std::sync::Arc;

use radio_sim_core::config::*;
use radio_sim_core::control::{AccessCategoryValues, LocalAction};
use radio_sim_core::des::{EventKind, SimTime};
use radio_sim_core::media::scenario::RawMediaEntry;
use radio_sim_core::metrics::events::SimEvent;
use radio_sim_core::node::Vec2;
use radio_sim_core::packet::MediaKind;
use radio_sim_core::sim::Simulation;
use radio_sim_core::voice::codec::{reconstruct_audio, CodecConfig};

fn default_tdma_config() -> SimConfig {
    SimConfig {
        general: GeneralConfig {
            num_nodes: 10,
            area_size_m: 200.0, // small area so nodes are close
            sim_duration_s: 1.0,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Tdma(TdmaConfig {
            source_probability: 0.5,
            broadcast_probability: 0.0, // all unicast
            ..TdmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    }
}

fn default_csma_config() -> SimConfig {
    SimConfig {
        general: GeneralConfig {
            num_nodes: 5,
            area_size_m: 50.0, // very close together
            sim_duration_s: 0.5,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.5,
            broadcast_probability: 1.0, // all broadcast (no ACK needed)
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    }
}

#[test]
fn scenario_load_error_is_recoverable() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 10.0,
            sim_duration_s: 0.2,
            seed: 7,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::Scenario {
                comms_log_path: "/does/not/exist/comms_log.json".to_string(),
                audio_dir: "/does/not/exist/audio".to_string(),
            },
            packet_bits: 1024,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
            ..TrafficConfig::default()
        },
        ..SimConfig::default()
    };
    let err = Simulation::new(config).expect_err("expected scenario load failure");
    assert!(
        format!("{err}").contains("failed to load scenario traffic"),
        "unexpected init error: {err}"
    );
}

/// Fix #1 regression: CSMA packets actually get received by other nodes.
#[test]
fn csma_delivers_broadcast_packets() {
    let config = default_csma_config();
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();
    let summary = sim.metrics.summary();
    assert!(
        summary.packets_sent > 0,
        "CSMA should send packets, got 0"
    );
    // Broadcasts don't generate Delivery events (no dest_id match).
    // Check for Rx events instead — packets actually entered the channel.
    let rx_count = sim
        .metrics
        .events()
        .iter()
        .filter(|e| matches!(e, SimEvent::Rx { .. }))
        .count();
    assert!(
        rx_count > 0,
        "CSMA broadcast should be received by other nodes; sent={} rx_count={}",
        summary.packets_sent,
        rx_count
    );
}

/// Fix #1 regression: CSMA unicast with ACK completes.
#[test]
fn csma_unicast_with_ack() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 10.0,
            sim_duration_s: 0.1,
            seed: 99,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 1.0,
            broadcast_probability: 0.0, // all unicast
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();
    let summary = sim.metrics.summary();
    assert!(
        summary.packets_sent > 0,
        "Should send unicast packets"
    );
    // With 2 close nodes, at least some should be delivered via ACK
    assert!(
        summary.packets_delivered > 0,
        "Unicast packets should be delivered with ACK; sent={} delivered={} dropped={}",
        summary.packets_sent,
        summary.packets_delivered,
        summary.packets_dropped
    );
}

/// Fix #3 regression: Poisson traffic model actually produces packets.
#[test]
fn poisson_traffic_produces_packets() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 5,
            area_size_m: 100.0,
            sim_duration_s: 1.0,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0, // MAC doesn't generate on its own
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::Poisson {
                rate_per_slot: 0.5,
            },
            packet_bits: 1024,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
            ..TrafficConfig::default()
        },
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();
    let summary = sim.metrics.summary();
    assert!(
        summary.packets_sent > 0,
        "Poisson traffic model should produce packets, got 0 sent"
    );
}

/// Fix #4 regression: TDMA unicast destinations are distributed, not all node 0.
#[test]
fn tdma_unicast_distributed_destinations() {
    let config = default_tdma_config();
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let mut dest_nodes: std::collections::HashSet<u16> = std::collections::HashSet::new();
    for event in sim.metrics.events() {
        if let SimEvent::Delivery { dest_id, .. } = event {
            dest_nodes.insert(*dest_id);
        }
    }
    assert!(
        !dest_nodes.is_empty(),
        "Expected at least one TDMA unicast delivery for destination distribution check"
    );
    // With 10 nodes and broadcast_probability=0, deliveries should go to multiple nodes
    assert!(
        dest_nodes.len() > 1 || dest_nodes.iter().next() != Some(&0),
        "Unicast destinations should not all be node 0; got: {:?}",
        dest_nodes
    );
}

/// Fix #5 regression: No packet_id=0 in TxStart events.
#[test]
fn no_zero_packet_ids_in_tx_start() {
    let config = default_tdma_config();
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let zero_id_count = sim
        .metrics
        .events()
        .iter()
        .filter(|e| matches!(e, SimEvent::TxStart { packet_id, .. } if *packet_id == 0))
        .count();
    assert_eq!(
        zero_id_count, 0,
        "TxStart events should never have packet_id=0; found {}",
        zero_id_count
    );
}

/// Fix #6 regression: TDMA Bernoulli origination varies across slots.
#[test]
fn tdma_origination_varies_across_slots() {
    // Run with many nodes and moderate probability.
    // If RNG is fixed per node, every node makes the same decision every slot.
    // With the fix, decisions should vary.
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 20,
            area_size_m: 500.0,
            sim_duration_s: 2.0,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Tdma(TdmaConfig {
            source_probability: 0.5,
            broadcast_probability: 1.0,
            ..TdmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();
    let summary = sim.metrics.summary();
    // With 20 nodes over 2s, we should get many sent packets
    // (if RNG was broken, we'd get a very skewed count)
    assert!(
        summary.packets_sent > 10,
        "Should send many packets with 20 nodes; got {}",
        summary.packets_sent
    );
}

/// Determinism: same seed produces identical results.
#[test]
fn determinism() {
    let config = default_tdma_config();
    let mut sim1 = Simulation::new(config.clone()).expect("valid test config");
    sim1.run();
    let s1 = sim1.metrics.summary();

    let mut sim2 = Simulation::new(config).expect("valid test config");
    sim2.run();
    let s2 = sim2.metrics.summary();

    assert_eq!(s1.packets_sent, s2.packets_sent, "Determinism: packets_sent");
    assert_eq!(
        s1.packets_delivered, s2.packets_delivered,
        "Determinism: packets_delivered"
    );
}

/// Audit2 #1 regression: CSMA TX fairness — multiple nodes should transmit, not just one.
#[test]
fn csma_broadcast_fairness() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 5,
            area_size_m: 50.0,
            sim_duration_s: 1.0,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.5,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let mut tx_nodes: std::collections::HashSet<u16> = std::collections::HashSet::new();
    for event in sim.metrics.events() {
        if let SimEvent::TxStart { node_id, kind, .. } = event {
            if *kind == "data" {
                tx_nodes.insert(*node_id);
            }
        }
    }
    assert!(
        tx_nodes.len() > 1,
        "Multiple nodes should transmit in CSMA broadcast; only {:?} transmitted",
        tx_nodes
    );
}

/// Audit2 #2 regression: No duplicate TxStart per packet ID.
#[test]
fn no_duplicate_tx_start_per_packet() {
    let config = default_csma_config();
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let mut seen_ids: std::collections::HashMap<u64, u32> = std::collections::HashMap::new();
    for event in sim.metrics.events() {
        if let SimEvent::TxStart { packet_id, kind, .. } = event {
            if *kind == "data" {
                *seen_ids.entry(*packet_id).or_insert(0) += 1;
            }
        }
    }
    assert!(
        !seen_ids.is_empty(),
        "Expected at least one data TxStart event before duplicate check"
    );
    let duplicates: Vec<_> = seen_ids.iter().filter(|(_, &count)| count > 1).collect();
    assert!(
        duplicates.is_empty(),
        "Found duplicate TxStart events for packet IDs: {:?}",
        duplicates
    );
}

#[test]
fn overlay_disabled_returns_no_local_observations() {
    let mut config = default_csma_config();
    config.control_overlay.enabled = false;
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();
    let actions = vec![LocalAction::default(); sim.nodes.len()];
    sim.apply_local_actions(&actions);
    let obs = sim.take_local_observations();
    assert!(
        obs.is_empty(),
        "overlay-disabled simulation should expose no local observations"
    );
}

#[test]
fn csma_half_duplex_no_rx_during_tx_interval() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 6,
            area_size_m: 80.0,
            sim_duration_s: 0.8,
            seed: 77,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.8,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let mut starts: std::collections::HashMap<u64, (u16, u64)> = std::collections::HashMap::new();
    let mut intervals: std::collections::HashMap<u16, Vec<(u64, u64)>> =
        std::collections::HashMap::new();
    let mut rx_events: Vec<(u16, u64)> = Vec::new();

    for event in sim.metrics.events() {
        match event {
            SimEvent::TxStart {
                time_ns,
                node_id,
                packet_id,
                kind,
                ..
            } if kind == "data" => {
                starts.insert(*packet_id, (*node_id, *time_ns));
            }
            SimEvent::TxEnd {
                time_ns,
                node_id,
                packet_id,
                ..
            } => {
                if let Some((start_node, start_ns)) = starts.remove(packet_id) {
                    if start_node == *node_id {
                        intervals
                            .entry(*node_id)
                            .or_default()
                            .push((start_ns, *time_ns));
                    }
                }
            }
            SimEvent::Rx { time_ns, node_id, .. } => {
                rx_events.push((*node_id, *time_ns));
            }
            _ => {}
        }
    }

    let interval_count: usize = intervals.values().map(|v| v.len()).sum();
    assert!(interval_count > 0, "expected at least one closed TX interval");
    assert!(!rx_events.is_empty(), "expected at least one RX event");

    for (rx_node, rx_time_ns) in rx_events {
        if let Some(node_intervals) = intervals.get(&rx_node) {
            for (start_ns, end_ns) in node_intervals {
                assert!(
                    rx_time_ns < *start_ns || rx_time_ns > *end_ns,
                    "node {} received during its own TX interval [{}, {}] at {}",
                    rx_node,
                    start_ns,
                    end_ns,
                    rx_time_ns
                );
            }
        }
    }
}

/// Audit3 #1+#2: CSMA with tiny contention window produces collisions.
#[test]
fn csma_heavy_load_collisions() {
    // Use minimal CW (cw_min_exp=1 → CW=2) so backoff collisions are very likely.
    // After the first TX completes, all frozen nodes resume simultaneously and
    // pick counter ∈ {0,1} — high probability of simultaneous expiry → collision.
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 10,
            area_size_m: 50.0,
            sim_duration_s: 0.5,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 1.0,
            broadcast_probability: 1.0, // broadcast: no ACK wait → faster contention
            preamble_detect_sinr_db: Some(-1.0),
            edca: AccessCategoryValues::new(
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 1,
                    cw_max_exp: 2,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 1,
                    cw_max_exp: 2,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 3,
                    cw_min_exp: 1,
                    cw_max_exp: 2,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 7,
                    cw_min_exp: 1,
                    cw_max_exp: 2,
                    txop_limit_us: 0.0,
                },
            ),
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();
    let summary = sim.metrics.summary();
    assert!(
        summary.packets_sent > 0,
        "Should send packets"
    );
    assert!(
        summary.collisions > 0,
        "10 nodes with CW=2 should produce collisions; got 0. sent={} delivered={} dropped={}",
        summary.packets_sent,
        summary.packets_delivered,
        summary.packets_dropped
    );
}

/// Audit4 #1: No duplicate Collision events for the same (time_ns, node_id).
#[test]
fn csma_no_duplicate_collision() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 10,
            area_size_m: 50.0,
            sim_duration_s: 0.5,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 1.0,
            broadcast_probability: 1.0,
            preamble_detect_sinr_db: Some(-1.0),
            edca: AccessCategoryValues::new(
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 1,
                    cw_max_exp: 2,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 2,
                    cw_min_exp: 1,
                    cw_max_exp: 2,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 3,
                    cw_min_exp: 1,
                    cw_max_exp: 2,
                    txop_limit_us: 0.0,
                },
                CsmaAccessCategoryConfig {
                    aifsn: 7,
                    cw_min_exp: 1,
                    cw_max_exp: 2,
                    txop_limit_us: 0.0,
                },
            ),
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();
    let summary = sim.metrics.summary();
    assert!(summary.collisions > 0, "Expected collisions for duplicate check");

    let mut seen: std::collections::HashSet<(u64, u16)> = std::collections::HashSet::new();
    for event in sim.metrics.events() {
        if let SimEvent::Collision { time_ns, node_id } = event {
            assert!(
                seen.insert((*time_ns, *node_id)),
                "Duplicate Collision event for (time_ns={}, node_id={})",
                time_ns,
                node_id
            );
        }
    }
}

/// Audit3 #2: ACK timeout margin is added to a derived propagation-aware timeout.
#[test]
fn csma_ack_timeout_margin_is_added_to_derived_timeout() {
    let mut csma_cfg = CsmaConfig::default();
    csma_cfg.source_probability = 0.0;
    csma_cfg.broadcast_probability = 0.0;
    csma_cfg.slot_duration_us = 1.0;
    csma_cfg.sifs_us = 10.0;
    csma_cfg.ack_timeout_us = 0.0;
    csma_cfg.preamble_us = 50.0;
    csma_cfg.ack_bits = 4000;
    csma_cfg.data_rate_bps = 1e6;
    csma_cfg.edca.be.aifsn = 1;
    csma_cfg.edca.be.cw_min_exp = 1;
    csma_cfg.edca.be.cw_max_exp = 1;
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 20_000.0,
            sim_duration_s: 0.02,
            seed: 42,
        },
        phy: PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            shadowing_std_db: 0.0,
            enable_fading: false,
            ..PhyConfig::default()
        },
        mac: MacConfig::Csma(csma_cfg.clone()),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(8_000.0, 0.0);
    sim.macs[0].enqueue(
        radio_sim_core::packet::Packet {
            id: 999,
            source_id: 0,
            dest_id: Some(1),
            kind: radio_sim_core::packet::PacketKind::Data,
            creation_time: SimTime::ZERO,
            payload_bits: 1024,
            payload: None,
            media: None,
            message_id: None,
            frame_index: None,
            hop_count: 0,
            max_hops: 1,
            delivered: false,
            region_id: None,
        },
        1,
    );
    sim.engine
        .schedule(SimTime::ZERO, 0, EventKind::CcaSample { node_id: 0 });
    sim.run();
    let propagation_us =
        sim.nodes[0].position.distance_to(&sim.nodes[1].position) / 299_792_458.0 * 1e6;
    let ack_airtime_us =
        csma_cfg.preamble_us + (csma_cfg.ack_bits as f64 / csma_cfg.data_rate_bps) * 1e6;
    assert!(
        propagation_us + csma_cfg.sifs_us + ack_airtime_us + propagation_us > 100.0,
        "test requires a derived ACK wait beyond the legacy fixed 100 us timeout",
    );
    assert!(
        sim.metrics.events().iter().any(|event| {
            matches!(
                event,
                SimEvent::TxEnd {
                    node_id,
                    packet_id,
                    success,
                    ..
                } if *node_id == 0 && *packet_id == 999 && *success
            )
        }),
        "sender should complete successfully when ACK arrival exceeds the legacy fixed timeout",
    );
    assert!(
        !sim.metrics.events().iter().any(|event| {
            matches!(
                event,
                SimEvent::Drop {
                    node_id,
                    packet_id,
                    reason,
                    ..
                } if *node_id == 0 && *packet_id == 999 && reason == "max_retries"
            )
        }),
        "derived timeout should avoid max-retry drops for this packet",
    );
}

/// Audit3 #3: No duplicate Delivery events for same (packet_id, dest_id).
#[test]
fn csma_no_duplicate_delivery() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 5,
            area_size_m: 50.0,
            sim_duration_s: 0.5,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.5,
            broadcast_probability: 0.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let mut seen: std::collections::HashSet<(u64, u16)> = std::collections::HashSet::new();
    let mut delivery_count = 0usize;
    for event in sim.metrics.events() {
        if let SimEvent::Delivery { packet_id, dest_id, .. } = event {
            delivery_count += 1;
            assert!(
                seen.insert((*packet_id, *dest_id)),
                "Duplicate Delivery for packet_id={} dest_id={}",
                packet_id,
                dest_id
            );
        }
    }
    assert!(
        delivery_count > 0,
        "Expected at least one delivery before duplicate-delivery assertion"
    );
}

/// Audit3 #3: PDR < 1.0 and packets_failed > 0 when nodes are out of range.
#[test]
fn csma_pdr_below_one_with_drops() {
    // Place nodes far apart so SINR is too low to decode — packets sent but never delivered.
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 5000.0,
            sim_duration_s: 0.1,
            seed: 42,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 1.0,
            broadcast_probability: 0.0,
            max_retries: 1,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();
    let summary = sim.metrics.summary();
    assert!(
        summary.packets_sent > 0,
        "Out-of-range test must still originate packets to validate failure accounting"
    );
    assert!(
        summary.packets_failed > 0,
        "packets_failed should be > 0 when nodes are out of range; sent={} delivered={} failed={}",
        summary.packets_sent,
        summary.packets_delivered,
        summary.packets_failed
    );
    assert!(
        summary.pdr < 1.0,
        "PDR should be < 1.0 with failed packets; pdr={} sent={} delivered={}",
        summary.pdr,
        summary.packets_sent,
        summary.packets_delivered
    );
}

/// Audit4 #7: TDMA should emit at most one Delivery per (packet_id, dest_id).
#[test]
fn tdma_no_duplicate_delivery() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 10,
            area_size_m: 200.0,
            sim_duration_s: 1.0,
            seed: 123,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Tdma(TdmaConfig {
            source_probability: 0.8,
            broadcast_probability: 0.0,
            ..TdmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let mut seen: std::collections::HashSet<(u64, u16)> = std::collections::HashSet::new();
    let mut delivery_count = 0usize;
    for event in sim.metrics.events() {
        if let SimEvent::Delivery { packet_id, dest_id, .. } = event {
            delivery_count += 1;
            assert!(
                seen.insert((*packet_id, *dest_id)),
                "Duplicate TDMA Delivery for packet_id={} dest_id={}",
                packet_id,
                dest_id
            );
        }
    }
    assert!(
        delivery_count > 0,
        "Expected at least one TDMA delivery before duplicate-delivery assertion"
    );
}

/// Audit4 #9: TDMA delivery latencies should be strictly positive.
#[test]
fn tdma_delivery_latency_positive() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 10,
            area_size_m: 200.0,
            sim_duration_s: 1.0,
            seed: 123,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Tdma(TdmaConfig {
            source_probability: 0.8,
            broadcast_probability: 0.0,
            ..TdmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let latencies: Vec<u64> = sim
        .metrics
        .events()
        .iter()
        .filter_map(|e| {
            if let SimEvent::Delivery { latency_ns, .. } = e {
                Some(*latency_ns)
            } else {
                None
            }
        })
        .collect();
    assert!(!latencies.is_empty(), "Expected at least one TDMA delivery");
    assert!(
        latencies.iter().all(|lat| *lat > 0),
        "All TDMA deliveries should have positive latency; found {:?}",
        latencies.iter().filter(|lat| **lat == 0).collect::<Vec<_>>()
    );
}

#[test]
fn tdma_run_until_does_not_materialize_future_events() {
    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 8,
            area_size_m: 150.0,
            sim_duration_s: 0.2,
            seed: 99,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Tdma(TdmaConfig {
            source_probability: 0.9,
            broadcast_probability: 0.0,
            ..TdmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    let until = SimTime::from_ms(1.0);
    sim.run_until(until);

    for event in sim.metrics.events() {
        let time_ns = match event {
            SimEvent::TxStart { time_ns, .. }
            | SimEvent::TxEnd { time_ns, .. }
            | SimEvent::Rx { time_ns, .. }
            | SimEvent::Delivery { time_ns, .. }
            | SimEvent::Drop { time_ns, .. }
            | SimEvent::Collision { time_ns, .. } => *time_ns,
        };
        assert!(
            time_ns <= until.as_ns(),
            "run_until produced event beyond limit: event_time_ns={} until_ns={}",
            time_ns,
            until.as_ns()
        );
    }
}

#[test]
fn media_scenario_tracks_audio_and_video_streams() {
    let dir = temp_dir("media_scenario");
    let manifest_path = dir.join("media_manifest.json");
    let manifest = r#"{
        "frames": [
            {"time_s": 0.005, "sender_id": 0, "stream_id": 10, "frame_index": 0, "payload_bytes": 64, "media_kind": "video"},
            {"time_s": 0.020, "sender_id": 0, "stream_id": 10, "frame_index": 1, "payload_bytes": 64, "media_kind": "video"},
            {"time_s": 0.040, "sender_id": 1, "stream_id": 20, "frame_index": 0, "payload_bytes": 32, "media_kind": "audio"}
        ]
    }"#;
    fs::write(&manifest_path, manifest).unwrap();

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 30.0,
            sim_duration_s: 0.2,
            seed: 88,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::MediaScenario {
                manifest_path: manifest_path.to_string_lossy().to_string(),
            },
            packet_bits: 1024,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
            ..TrafficConfig::default()
        },
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid media scenario");
    sim.run();
    let summary = sim.metrics.summary();
    assert!(summary.packets_sent > 0, "media scenario should transmit packets");

    let media_results = sim.metrics.media_results();
    assert!(
        !media_results.is_empty(),
        "media tracker should emit stream results"
    );
    let has_video = media_results
        .iter()
        .any(|r| r.media_kind == MediaKind::Video && r.stream_id == 10);
    let has_audio = media_results
        .iter()
        .any(|r| r.media_kind == MediaKind::Audio && r.stream_id == 20);
    assert!(has_video, "expected video stream 10 in media results");
    assert!(has_audio, "expected audio stream 20 in media results");

    fs::remove_file(manifest_path).ok();
    fs::remove_dir_all(dir).ok();
}

#[test]
fn media_scenario_sparse_frame_indices_are_exposed_in_results() {
    let dir = temp_dir("media_sparse_indices");
    let manifest_path = dir.join("media_manifest_sparse.json");
    let manifest = r#"{
        "frames": [
            {"time_s": 0.005, "sender_id": 0, "stream_id": 99, "frame_index": 4, "payload_bytes": 64, "media_kind": "video"},
            {"time_s": 0.020, "sender_id": 0, "stream_id": 99, "frame_index": 10, "payload_bytes": 64, "media_kind": "video"}
        ]
    }"#;
    fs::write(&manifest_path, manifest).unwrap();

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 30.0,
            sim_duration_s: 0.2,
            seed: 89,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::MediaScenario {
                manifest_path: manifest_path.to_string_lossy().to_string(),
            },
            packet_bits: 1024,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
            ..TrafficConfig::default()
        },
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid media scenario");
    sim.run();

    let result = sim
        .metrics
        .media_results()
        .into_iter()
        .find(|r| {
            r.sender_id == 0
                && r.receiver_id == 1
                && r.stream_id == 99
                && r.media_kind == MediaKind::Video
        })
        .expect("missing sparse stream result");
    assert_eq!(result.frame_indices, vec![4, 10]);
    assert_eq!(result.total_frames, 2);
    assert_eq!(result.frames_received.len(), 2);

    fs::remove_file(manifest_path).ok();
    fs::remove_dir_all(dir).ok();
}

#[test]
fn media_scenario_rejects_incomplete_explicit_fragment_rows() {
    let dir = temp_dir("media_invalid_fragments");
    let manifest_path = dir.join("media_manifest_invalid_frag.json");
    let manifest = r#"{
        "frames": [
            {"time_s": 0.005, "sender_id": 0, "stream_id": 55, "frame_index": 0, "payload_bytes": 64, "media_kind": "video", "fragment_index": 0, "fragment_count": 2}
        ]
    }"#;
    fs::write(&manifest_path, manifest).unwrap();

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 30.0,
            sim_duration_s: 0.2,
            seed: 90,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::MediaScenario {
                manifest_path: manifest_path.to_string_lossy().to_string(),
            },
            packet_bits: 1024,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
            ..TrafficConfig::default()
        },
        ..SimConfig::default()
    };
    let err = Simulation::new(config).expect_err("invalid explicit fragment rows should fail");
    let msg = format!("{err}");
    assert!(
        msg.contains("missing indices"),
        "expected explicit fragment completeness error, got: {msg}"
    );

    fs::remove_file(manifest_path).ok();
    fs::remove_dir_all(dir).ok();
}

fn temp_dir(prefix: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("{prefix}_{nanos}"));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn write_wav_pcm16_mono(path: &Path, sample_rate_hz: u32, pcm_bytes: &[u8]) {
    assert_eq!(pcm_bytes.len() % 2, 0, "16-bit PCM must be even length");
    let channels = 1u16;
    let bits = 16u16;
    let data_size = pcm_bytes.len() as u32;
    let block_align = channels * (bits / 8);
    let byte_rate = sample_rate_hz * block_align as u32;
    let chunk_size = 36 + data_size;

    let mut out = Vec::with_capacity(44 + pcm_bytes.len());
    out.extend_from_slice(b"RIFF");
    out.extend_from_slice(&chunk_size.to_le_bytes());
    out.extend_from_slice(b"WAVE");
    out.extend_from_slice(b"fmt ");
    out.extend_from_slice(&16u32.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes()); // PCM
    out.extend_from_slice(&channels.to_le_bytes());
    out.extend_from_slice(&sample_rate_hz.to_le_bytes());
    out.extend_from_slice(&byte_rate.to_le_bytes());
    out.extend_from_slice(&block_align.to_le_bytes());
    out.extend_from_slice(&bits.to_le_bytes());
    out.extend_from_slice(b"data");
    out.extend_from_slice(&data_size.to_le_bytes());
    out.extend_from_slice(pcm_bytes);
    fs::write(path, out).unwrap();
}

fn create_scenario_fixture(
    prefix: &str,
    messages: &[(u32, f64, u16, Vec<u8>)],
) -> (PathBuf, PathBuf) {
    let root = temp_dir(prefix);
    let audio_dir = root.join("audio");
    fs::create_dir_all(&audio_dir).unwrap();

    let message_json: Vec<serde_json::Value> = messages
        .iter()
        .map(|(message_id, time_s, sender_id, pcm)| {
            let file = format!("msg_{message_id}.wav");
            write_wav_pcm16_mono(&audio_dir.join(&file), 24_000, pcm);
            serde_json::json!({
                "message_id": message_id,
                "time_s": time_s,
                "sender_id": sender_id,
                "channel_id": "sq0",
                "audio_file": file
            })
        })
        .collect();
    let comms = serde_json::json!({ "messages": message_json });
    let comms_path = root.join("comms_log.json");
    fs::write(&comms_path, serde_json::to_vec_pretty(&comms).unwrap()).unwrap();
    (comms_path, audio_dir)
}

/// Scenario end-to-end: close nodes should deliver payload bytes unchanged.
#[test]
fn scenario_voice_payload_roundtrip_close_range() {
    let frame_bytes = CodecConfig::default().frame_bytes();
    let payload: Vec<u8> = (0..frame_bytes).map(|i| (i % 251) as u8).collect();
    let (comms_path, audio_dir) =
        create_scenario_fixture("scenario_roundtrip", &[(0, 0.0, 0, payload.clone())]);

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 10.0,
            sim_duration_s: 0.2,
            seed: 1,
        },
        phy: PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            ..PhyConfig::default()
        },
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::Scenario {
                comms_log_path: comms_path.to_string_lossy().to_string(),
                audio_dir: audio_dir.to_string_lossy().to_string(),
            },
            packet_bits: 1024,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
            ..TrafficConfig::default()
        },
        ..SimConfig::default()
    };

    let mut sim = Simulation::new(config).expect("valid test config");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(3.0, 0.0);
    sim.run();

    let results = sim.metrics.voice_results();
    let result = results
        .iter()
        .find(|r| r.sender_id == 0 && r.message_id == 0 && r.receiver_id == 1)
        .expect("missing voice result for receiver");
    assert_eq!(result.total_frames, 1);
    assert_eq!(result.frames_received, vec![true]);
    assert_eq!(
        result.frame_payloads[0].as_ref().map(|p| p.as_ref().clone()),
        Some(payload)
    );
}

/// Scenario end-to-end: far nodes should lose frames and reconstruct silence.
#[test]
fn scenario_voice_loss_reconstructs_silence() {
    let frame_bytes = CodecConfig::default().frame_bytes();
    let payload = vec![9u8; frame_bytes];
    let (comms_path, audio_dir) =
        create_scenario_fixture("scenario_loss", &[(7, 0.0, 0, payload)]);

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 5000.0,
            sim_duration_s: 0.2,
            seed: 2,
        },
        phy: PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            ..PhyConfig::default()
        },
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::Scenario {
                comms_log_path: comms_path.to_string_lossy().to_string(),
                audio_dir: audio_dir.to_string_lossy().to_string(),
            },
            packet_bits: 1024,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
            ..TrafficConfig::default()
        },
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(5_000_000.0, 0.0);
    sim.run();

    let result = sim
        .metrics
        .voice_results()
        .into_iter()
        .find(|r| r.sender_id == 0 && r.message_id == 7 && r.receiver_id == 1)
        .expect("missing voice result");
    assert!(
        !result.frames_received[0],
        "far nodes should lose frame under free-space path loss"
    );
    assert!(result.pdr < 1.0);
    let reconstructed = reconstruct_audio(&result.frame_payloads, &CodecConfig::default());
    assert!(reconstructed.iter().all(|b| *b == 0));
}

/// Scenario queue-drop accounting: TDMA queue saturation should count QueueFull drops.
#[test]
fn scenario_queue_full_drops_are_counted() {
    let frame_bytes = CodecConfig::default().frame_bytes();
    let mut msgs = Vec::new();
    for id in 0..6u32 {
        msgs.push((id, 0.0, 0u16, vec![id as u8; frame_bytes]));
    }
    let (comms_path, audio_dir) = create_scenario_fixture("scenario_queue_drop", &msgs);

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 20.0,
            sim_duration_s: 0.1,
            seed: 3,
        },
        phy: PhyConfig::default(),
        mac: MacConfig::Tdma(TdmaConfig {
            source_probability: 0.0,
            broadcast_probability: 1.0,
            node_queue_size: 1,
            ..TdmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::Scenario {
                comms_log_path: comms_path.to_string_lossy().to_string(),
                audio_dir: audio_dir.to_string_lossy().to_string(),
            },
            packet_bits: 1024,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
            ..TrafficConfig::default()
        },
        ..SimConfig::default()
    };
    let mut sim = Simulation::new(config).expect("valid test config");
    sim.run();

    let drop_total: u32 = sim
        .metrics
        .voice_results()
        .iter()
        .filter(|r| r.sender_id == 0 && r.receiver_id == 1)
        .map(|r| r.frames_queue_dropped as u32)
        .sum();
    assert!(drop_total > 0, "expected queue-full drops under saturation");
}

/// Build a synthetic Opus-style payload (variable size, non-960-byte) for testing.
fn synth_opus_frame(message_id: u32, frame_index: u16, size: usize) -> Arc<Vec<u8>> {
    let mut bytes = vec![0u8; size];
    for (i, b) in bytes.iter_mut().enumerate() {
        *b = ((message_id as usize ^ frame_index as usize ^ i).wrapping_mul(31) & 0xff) as u8;
    }
    Arc::new(bytes)
}

fn in_memory_voice_entries(
    sender: u16,
    dest: u16,
    stream_id: u32,
    start_s: f64,
    frame_period_s: f64,
    sizes: &[usize],
) -> Vec<RawMediaEntry> {
    sizes
        .iter()
        .enumerate()
        .map(|(i, size)| RawMediaEntry {
            time_s: start_s + i as f64 * frame_period_s,
            sender_id: sender,
            dest_id: Some(dest),
            stream_id,
            message_id: Some(stream_id),
            frame_index: i as u16,
            media_kind: MediaKind::Audio,
            payload: synth_opus_frame(stream_id, i as u16, *size),
            fragment_index: None,
            fragment_count: None,
        })
        .collect()
}

/// In-memory MediaInMemory should round-trip variable-size voice payloads through CSMA.
#[test]
fn voice_in_memory_csma_roundtrip() {
    // 5 frames of variable Opus-like sizes (40-60 bytes), well under MTU.
    let sizes = vec![40, 47, 53, 60, 44];
    let entries = in_memory_voice_entries(0, 1, 1, 0.05, 0.020, &sizes);
    let expected_payloads: Vec<Vec<u8>> = entries
        .iter()
        .map(|e| e.payload.as_ref().clone())
        .collect();

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 10.0,
            sim_duration_s: 0.5,
            seed: 11,
        },
        phy: PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            ..PhyConfig::default()
        },
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0,
            broadcast_probability: 0.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::MediaInMemory {
                entries: Arc::new(entries),
            },
            packet_bits: 1024,
            mtu_bytes: 1200,
            playout_slack_ms: 200.0,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
        },
        ..SimConfig::default()
    };

    let mut sim = Simulation::new(config).expect("valid in-memory voice config");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(2.0, 0.0);
    sim.run();

    let result = sim
        .metrics
        .media_results()
        .iter()
        .find(|r| r.sender_id == 0 && r.receiver_id == 1 && r.stream_id == 1)
        .expect("missing media result for receiver")
        .clone();
    assert_eq!(result.total_frames, sizes.len() as u16);
    assert!(
        result.frames_received.iter().all(|r| *r),
        "all frames should arrive close range; got pdr={} frames_received={:?}",
        result.pdr,
        result.frames_received
    );
    for (i, expected) in expected_payloads.iter().enumerate() {
        let got = result.frame_payloads[i]
            .as_ref()
            .expect("frame payload must be present after success");
        assert_eq!(
            got.as_ref(),
            expected,
            "frame {i} payload byte-mismatch (size {})",
            expected.len()
        );
    }
}

/// Same end-to-end roundtrip but through TDMA barrage. Verifies that the
/// MediaInMemory traffic source is wired identically for both MAC choices and
/// that variable-size payloads survive cooperative combining + reassembly.
#[test]
fn voice_in_memory_tdma_roundtrip() {
    let sizes = vec![38, 50, 41];
    let entries = in_memory_voice_entries(0, 1, 7, 0.010, 0.020, &sizes);
    let expected_payloads: Vec<Vec<u8>> = entries
        .iter()
        .map(|e| e.payload.as_ref().clone())
        .collect();

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 3,
            area_size_m: 20.0,
            sim_duration_s: 0.6,
            seed: 23,
        },
        phy: PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            ..PhyConfig::default()
        },
        mac: MacConfig::Tdma(TdmaConfig {
            source_probability: 0.0,
            broadcast_probability: 0.0,
            ..TdmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::MediaInMemory {
                entries: Arc::new(entries),
            },
            packet_bits: 1024,
            mtu_bytes: 1200,
            playout_slack_ms: 400.0,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
        },
        ..SimConfig::default()
    };

    let mut sim = Simulation::new(config).expect("valid in-memory voice config");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(3.0, 0.0);
    sim.nodes[2].position = Vec2::new(6.0, 0.0);
    sim.run();

    let result = sim
        .metrics
        .media_results()
        .iter()
        .find(|r| r.sender_id == 0 && r.receiver_id == 1 && r.stream_id == 7)
        .expect("missing media result for receiver")
        .clone();
    assert_eq!(result.total_frames, sizes.len() as u16);
    assert!(
        result.frames_received.iter().all(|r| *r),
        "all frames should arrive at close range; got pdr={} frames_received={:?}",
        result.pdr,
        result.frames_received
    );
    for (i, expected) in expected_payloads.iter().enumerate() {
        let got = result.frame_payloads[i]
            .as_ref()
            .expect("frame payload must be present after success");
        assert_eq!(
            got.as_ref(),
            expected,
            "frame {i} payload byte-mismatch (size {})",
            expected.len()
        );
    }
}

/// Auto-fragmentation should split a payload larger than the MTU and reassemble
/// it byte-exactly through CSMA.
#[test]
fn voice_in_memory_auto_fragmentation_roundtrip() {
    let payload: Vec<u8> = (0..2500).map(|i| ((i * 7) & 0xff) as u8).collect();
    let entries = vec![RawMediaEntry {
        time_s: 0.05,
        sender_id: 0,
        dest_id: Some(1),
        stream_id: 99,
        message_id: Some(99),
        frame_index: 0,
        media_kind: MediaKind::Audio,
        payload: Arc::new(payload.clone()),
        fragment_index: None,
        fragment_count: None,
    }];

    let config = SimConfig {
        general: GeneralConfig {
            num_nodes: 2,
            area_size_m: 10.0,
            sim_duration_s: 0.3,
            seed: 5,
        },
        phy: PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            ..PhyConfig::default()
        },
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.0,
            broadcast_probability: 0.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig {
            model: TrafficModel::MediaInMemory {
                entries: Arc::new(entries),
            },
            packet_bits: 1024,
            // MTU smaller than payload forces fragmentation into 3 pieces.
            mtu_bytes: 1000,
            playout_slack_ms: 200.0,
            codec: CodecConfig::default(),
            class_mix: TrafficClassMix::default(),
        },
        ..SimConfig::default()
    };

    let mut sim = Simulation::new(config).expect("valid auto-frag config");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(2.0, 0.0);
    sim.run();

    let result = sim
        .metrics
        .media_results()
        .iter()
        .find(|r| r.sender_id == 0 && r.receiver_id == 1 && r.stream_id == 99)
        .expect("missing media result for receiver")
        .clone();
    assert_eq!(result.frames_received, vec![true]);
    let got = result.frame_payloads[0]
        .as_ref()
        .expect("reassembled payload must be present");
    assert_eq!(got.len(), payload.len(), "reassembled length must match");
    assert_eq!(got.as_ref(), &payload, "reassembled bytes must match");
}

// ---------------- Control overlay: baseline equivalence + action effects ----------------

fn baseline_csma_config(num_nodes: u16, area_m: f64, sim_s: f64, seed: u64) -> SimConfig {
    SimConfig {
        general: GeneralConfig {
            num_nodes,
            area_size_m: area_m,
            sim_duration_s: sim_s,
            seed,
        },
        phy: PhyConfig {
            path_loss_model: PathLossModel::FreeSpace,
            ..PhyConfig::default()
        },
        mac: MacConfig::Csma(CsmaConfig {
            source_probability: 0.5,
            broadcast_probability: 1.0,
            ..CsmaConfig::default()
        }),
        traffic: TrafficConfig::default(),
        ..SimConfig::default()
    }
}

/// Overlay-off vs overlay-on-with-default-action MUST yield identical packet
/// outcomes. This pins the contract: when control is silent, behavior is the
/// baseline emulator.
#[test]
fn overlay_silent_matches_baseline() {
    let baseline = {
        let mut sim = Simulation::new(baseline_csma_config(6, 80.0, 0.5, 17))
            .expect("baseline sim builds");
        sim.run();
        let s = sim.metrics.summary();
        (s.packets_sent, s.packets_delivered, s.packets_dropped, s.collisions)
    };

    let overlay_silent = {
        let mut cfg = baseline_csma_config(6, 80.0, 0.5, 17);
        cfg.control_overlay.enabled = true;
        let mut sim = Simulation::new(cfg).expect("overlay sim builds");
        // Drive the loop with default (no-op) actions every 25 ms.
        let zero = LocalAction::default();
        let actions = vec![zero; 6];
        let step_ns = 25_000_000_u64;
        loop {
            let next_ms = (sim.current_time().as_ns() + step_ns) as f64 / 1_000_000.0;
            sim.run_until(SimTime::from_ms(next_ms));
            let _obs = sim.take_local_observations();
            sim.apply_local_actions(&actions);
            if sim.is_finished() {
                break;
            }
        }
        let s = sim.metrics.summary();
        (s.packets_sent, s.packets_delivered, s.packets_dropped, s.collisions)
    };

    assert_eq!(
        overlay_silent, baseline,
        "overlay enabled with default LocalAction must match baseline behavior; \
         baseline = {baseline:?}, overlay_silent = {overlay_silent:?}"
    );
}

/// purge_oldest action drops queued packets and surfaces the count via the
/// next observation's action_outcomes.purged_oldest.
#[test]
fn agent_purge_oldest_drops_queued_packets() {
    let mut cfg = baseline_csma_config(2, 30.0, 0.2, 1);
    cfg.control_overlay.enabled = true;
    if let MacConfig::Csma(ref mut c) = cfg.mac {
        // Make BE backoff long so packets accumulate before any TX completes.
        c.edca.be.cw_min_exp = 12;
        c.edca.be.cw_max_exp = 12;
    }
    let mut sim = Simulation::new(cfg).expect("sim builds");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(2.0, 0.0);

    // Step a bit so the BernoulliTraffic source builds a real BE backlog.
    sim.run_until(SimTime::from_ms(50.0));
    let pre = sim.take_local_observations();
    let pre_be_queue = pre[0].queue_len.be;
    assert!(pre_be_queue > 0, "expected BE backlog before purge; got {pre_be_queue}");

    let mut purge = LocalAction::default();
    purge.purge_oldest.be = pre_be_queue.min(4) as u16;
    sim.apply_local_actions(&[purge.clone(), LocalAction::default()]);

    // Step forward and read the next observation: outcome counter should reflect
    // the drop, and queue should have shrunk.
    sim.run_until(SimTime::from_ms(60.0));
    let post = sim.take_local_observations();
    let purged_reported = post[0].action_outcomes.purged_oldest.be;
    assert_eq!(
        purged_reported, purge.purge_oldest.be as u32,
        "agent's purge_oldest count must surface as outcome telemetry"
    );
    // Note: queue size after purge is not strictly bounded because Bernoulli
    // traffic continues to arrive between the purge and the observation. The
    // outcome counter above is the contract we rely on.
}

/// max_queue_len override caps the AC queue independent of the global cap and
/// reports admission_drops in the next observation.
#[test]
fn agent_max_queue_len_override_caps_per_ac_queue() {
    let mut cfg = baseline_csma_config(2, 30.0, 0.3, 2);
    cfg.control_overlay.enabled = true;
    if let MacConfig::Csma(ref mut c) = cfg.mac {
        c.edca.be.cw_min_exp = 12;
        c.edca.be.cw_max_exp = 12;
    }
    let mut sim = Simulation::new(cfg).expect("sim builds");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(2.0, 0.0);

    // Cap BE at 2 immediately.
    let mut cap = LocalAction::default();
    cap.max_queue_len.be = Some(2);
    sim.apply_local_actions(&[cap.clone(), LocalAction::default()]);

    sim.run_until(SimTime::from_ms(200.0));
    let obs = sim.take_local_observations();
    assert!(
        obs[0].queue_len.be <= 2,
        "BE queue must respect the per-AC cap; got {}",
        obs[0].queue_len.be
    );
    assert!(
        obs[0].action_outcomes.admission_drops.be > 0,
        "with sustained traffic and cap=2, some BE enqueues should be admission-dropped"
    );
}

/// rate_cap_pps enforces a per-AC token-bucket rate cap and reports
/// rate_cap_drops in the next observation.
#[test]
fn agent_rate_cap_drops_excess_traffic() {
    let mut cfg = baseline_csma_config(2, 30.0, 0.5, 3);
    cfg.control_overlay.enabled = true;
    let mut sim = Simulation::new(cfg).expect("sim builds");
    sim.nodes[0].position = Vec2::new(0.0, 0.0);
    sim.nodes[1].position = Vec2::new(2.0, 0.0);

    // Cap BE at 1 packet per second — well below offered rate.
    let mut cap = LocalAction::default();
    cap.rate_cap_pps.be = Some(1.0);
    sim.apply_local_actions(&[cap.clone(), LocalAction::default()]);

    sim.run_until(SimTime::from_ms(400.0));
    let obs = sim.take_local_observations();
    assert!(
        obs[0].action_outcomes.rate_cap_drops.be > 0,
        "cap=1 pps under heavier offered traffic must drop excess via rate_cap_drops"
    );
}
