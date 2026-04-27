import * as React from 'react'
import { Link, withPrefix } from 'gatsby'
import Layout from '../../../../components/layout'
import Seo from '../../../../components/seo'
import '../../../../components/dbg/dbg-microsite.css'

const glanceItems = [
  'Rust-core radio emulator with Python control bindings',
  'CSMA/CA runtime is the strongest implemented control surface today',
  'TDMA / barrage-relay path exists, but local overlay control is still behind CSMA',
  'Controller boundary is explicit: local observations in, bounded local actions out',
  'Broader PIN claims depend on scene, traffic, RF, and kinematic context outside the base radio telemetry slice',
  'Conformance, reproducibility, and experiment runbooks are treated as first-class engineering work',
]

const sectionCards = [
  {
    title: 'Architecture and Runtime Boundary',
    body: 'The `radio-sim` stack is a discrete-event simulator with a Rust core, PyO3 bindings, and experiment tooling layered above it. Core radio behavior stays in Rust while Python exposes configuration, runtime stepping, and controller hooks. That separation is deliberate: the simulator remains the radio-side substrate, not the entire training pipeline.',
  },
  {
    title: 'What the Controller Actually Sees',
    body: 'The implemented runtime API exposes interval-aggregated local observations per node: queue state, backoff state, contention summaries, attempt and delivery counters, latency summaries, and neighbor RSSI or PDR hints. It is intentionally a local reactive surface. Richer scene-conditioned sensing belongs to the broader PIN stack and should not be described as if it already lives inside the current radio runtime.',
  },
  {
    title: 'Protocol Modes and Current Maturity',
    body: 'Two MAC families are documented: CSMA for Silvus-like behavior and TDMA for TSM-style barrage relay. CSMA currently carries the most complete local action path, including EDCA-style AIFS, contention-window, and TXOP tuning. TDMA delivery, slot handling, relay behavior, and combining are documented, but the local control overlay is still substantially less mature.',
  },
  {
    title: 'PIN Formulation and Learning View',
    body: 'The docs now treat the canonical v1 training problem as a two-level Stackelberg game rather than generic simultaneous-move MARL. The environment or scenario layer commits first, and distributed PIN followers respond through local overlay actions. That framing is one of the clearest outputs of the bundle and should remain central to any internal summary of the work.',
  },
  {
    title: 'Validation, Conformance, and Repeatability',
    body: 'The bundle is not only theory and protocol prose. It includes conformance profiles, strictness modes, baseline comparisons, a reproducible PIN optimal-control demo runbook, and deterministic experiment guidance. That makes the simulator more than a concept page; it is framed as a testable and reviewable engineering system.',
  },
  {
    title: 'Broader Stack Integration',
    body: 'The docs repeatedly position `radio-sim` inside a larger program that also includes geometry, traffic, and RF enrichment tooling. The important point is not just that these upstream systems exist, but that they provide the richer context needed for stronger PIN claims while the current runtime remains honest about what a radio observes today.',
  },
]

const boundaryPoints = [
  'Implemented now: local CSMA observation and action surface, Python API control loop, conformance harness, and reproducible experiment workflow.',
  'Implemented upstream but not native to the radio runtime: scene structure, platoon layout, traffic programs, and RF/pathloss enrichments from adjacent repositories.',
  'Planned broader PIN scope: richer observation bundles, predictive features, distributed MARL training beyond the local telemetry slice, and a fuller TDMA local-control path.',
]

const capabilityAreas = [
  {
    title: 'Simulation Core',
    body: 'Discrete-event runtime, event dispatch, packet handling, channel logic, and metric collection.',
  },
  {
    title: 'Python Control Surface',
    body: 'Configuration, runtime stepping, observation polling, local action injection, and experiment scripting.',
  },
  {
    title: 'CSMA Control Path',
    body: 'Current best-developed control target for local PIN overlays and the main basis for the v1 learning docs.',
  },
  {
    title: 'TDMA / Barrage Relay',
    body: 'Documented protocol path with relay lifecycle and slot semantics, but not yet an equally mature control target.',
  },
  {
    title: 'Validation and Conformance',
    body: 'Profile-driven checks, scenario sets, strictness modes, baseline comparisons, and repeatable KPI review.',
  },
  {
    title: 'Media and Voice Path',
    body: 'Audio and media injection path, end-to-end reconstruction, and stream-level KPI handling for communication experiments.',
  },
]

const nextSteps = [
  'Pull the strongest implementation-backed pieces of `radio-sim` into a cleaner internal narrative without collapsing the implemented-versus-planned distinction.',
  'Keep CSMA, TDMA, and broader PIN-scope claims carefully separated so collaborators do not overread current runtime maturity.',
  'Use conformance and optimal-control experiment outputs as the default evidence layer when describing progress, not only architecture diagrams.',
  'Decide which assets from the docs bundle are safe for collaborator web review under the current weak password gate and which should stay in repo-local documentation only.',
]

const staticAsset = path => withPrefix(path)

const SystemsProtocolsPage = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <Layout headerVariant="compact">
      <div className="dbg-page">
        <section className="dbg-internal-hero">
          <div className="dbg-shell">
            <Link className="dbg-back-link" to="/projects/dynamic-belief-games">
              ← Back to DBG home
            </Link>
            <p className="dbg-internal-hero__meta">Internal Workstream</p>
            <h1>Systems &amp; Protocols</h1>
            <p className="dbg-internal-hero__subtitle">
              Internal summary of the `radio-sim` workstream: runtime architecture, protocol
              behavior, controller interfaces, PIN training formulation, and the validation logic
              that connects simulator claims to reviewable engineering evidence.
            </p>
            <div className="dbg-internal-note">
              This page is convenience-gated for collaborator review only. It should stay at the
              level of internal summary and approved engineering context rather than sensitive field
              details or private implementation notes.
            </div>
          </div>
        </section>

        <section className="dbg-section dbg-section--alt">
          <div className="dbg-shell">
            <div className="dbg-section__intro">
              <p className="dbg-section__eyebrow">Live Links</p>
              <h2>Demo and documentation</h2>
              <p>Open the browser demo or read the built docs.</p>
            </div>
            <div className="dbg-card-grid dbg-card-grid--two">
              <article className="dbg-card dbg-resource-card">
                <p className="dbg-section__eyebrow">Live Demo</p>
                <h3>RF packet visualizer</h3>
                <p>
                  Browser-based interactive demo of the full voice transport chain: microphone
                  capture, frame slicing, G.711 &micro;-law or PCM16 codec, header + CRC-16
                  packetization, a configurable channel (delay, jitter, loss, per-byte bit-flip),
                  AM/FM/BPSK RF preview, jitter buffer, and playback &mdash; with live TX/RX
                  waveforms, spectra, a packet grid, and an animated signal pipeline so you can
                  watch individual packets traverse each stage.
                </p>
                <p>
                  Useful for narrating how a single spoken frame becomes bytes on the air and back
                  again, and for injecting failures (drops, corruption) to see CRC rejection,
                  reordering, and packet-loss concealment in real time.
                </p>
                <a
                  className="dbg-text-link"
                  href={staticAsset(
                    '/projects/dynamic-belief-games/DBG_progress/radio_sim/index.html'
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Check it out in action &rarr;
                </a>
                <a
                  className="dbg-text-link"
                  href={staticAsset(
                    '/projects/dynamic-belief-games/DBG_progress/radio_sim/overview.html'
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the overview
                </a>
              </article>
              <article className="dbg-card dbg-resource-card">
                <p className="dbg-section__eyebrow">Documentation</p>
                <h3>Protocol stack and PIN control</h3>
                <p>
                  Rust + PyO3 radio emulator and research workspace for local PIN (Predictive
                  Intelligent Network) control overlays. Covers CSMA/CA-style local control for
                  Silvus-like behavior and TDMA/TSM-style barrage alignment, with a conformance
                  harness, experiment notebooks, and artifacts that measure packet delivery ratio
                  (PDR) and latency over scenario life.
                </p>
                <a
                  className="dbg-text-link"
                  href={staticAsset('/projects/dynamic-belief-games/DBG_progress/protocol-docs/')}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read about the protocols &rarr;
                </a>
                <ul className="dbg-bullet-list">
                  <li>
                    <a
                      href={staticAsset(
                        '/projects/dynamic-belief-games/DBG_progress/protocol-docs/pin_controller_api/'
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PIN controller API
                    </a>{' '}
                    &mdash; interface and integration points for the PIN overlay
                  </li>
                  <li>
                    <a
                      href={staticAsset(
                        '/projects/dynamic-belief-games/DBG_progress/protocol-docs/mac_csma_implementation/'
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      CSMA MAC deep dive
                    </a>{' '}
                    &mdash; CSMA/CA-style local control, Silvus-like behavior
                  </li>
                  <li>
                    <a
                      href={staticAsset(
                        '/projects/dynamic-belief-games/DBG_progress/protocol-docs/mac_tdma_implementation/'
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      TDMA MAC deep dive
                    </a>{' '}
                    &mdash; TDMA/TSM-style barrage alignment and constraints
                  </li>
                  <li>
                    <a
                      href={staticAsset(
                        '/projects/dynamic-belief-games/DBG_progress/protocol-docs/pin_optimal_control_experiment/'
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PIN optimal-control experiment
                    </a>{' '}
                    &mdash; reproducible PDR/latency experiment
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="dbg-section">
          <div className="dbg-shell">
            <div className="dbg-section__intro">
              <p className="dbg-section__eyebrow">At a Glance</p>
              <h2>What this workstream actually contains</h2>
            </div>
            <div className="dbg-meta-grid dbg-meta-grid--three">
              {glanceItems.map(item => (
                <article key={item} className="dbg-mini-card">
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dbg-section dbg-section--alt">
          <div className="dbg-shell">
            <div className="dbg-section__intro">
              <p className="dbg-section__eyebrow">Core Narrative</p>
              <h2>What the docs bundle says, in cleaner internal-site language</h2>
              <p>
                The central message of the bundle is that `radio-sim` is already a meaningful
                control and validation substrate, but it is not the whole PIN story. The docs are at
                their best when they stay precise about that boundary.
              </p>
            </div>
            <div className="dbg-card-grid dbg-card-grid--two">
              {sectionCards.map(section => (
                <article key={section.title} className="dbg-card">
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dbg-section">
          <div className="dbg-shell">
            <div className="dbg-section__intro">
              <p className="dbg-section__eyebrow">Implemented vs Planned</p>
              <h2>The most important distinction to preserve</h2>
              <p>
                The source material is unusually careful about scope. That is a strength, and the
                internal page should preserve it rather than flattening everything into one maturity
                level.
              </p>
            </div>
            <ul className="dbg-bullet-list">
              {boundaryPoints.map(point => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="dbg-section dbg-section--alt">
          <div className="dbg-shell">
            <div className="dbg-section__intro">
              <p className="dbg-section__eyebrow">Capability Areas</p>
              <h2>What can be summarized on this page without turning it into repo docs</h2>
            </div>
            <div className="dbg-meta-grid dbg-meta-grid--three">
              {capabilityAreas.map(item => (
                <article key={item.title} className="dbg-mini-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dbg-section">
          <div className="dbg-shell">
            <div className="dbg-section__intro">
              <p className="dbg-section__eyebrow">Next Steps</p>
              <h2>How to use this material on the DBG site</h2>
            </div>
            <ul className="dbg-bullet-list">
              {nextSteps.map(step => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default SystemsProtocolsPage

export const Head = () => (
  <Seo
    title="DBG Internal: Systems & Protocols"
    description="Convenience-gated internal workstream summary for DBG systems, protocols, and integration."
    meta={[{ name: 'robots', content: 'noindex, nofollow' }]}
  />
)
