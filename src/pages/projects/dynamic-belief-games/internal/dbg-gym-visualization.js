import * as React from 'react'
import { Link } from 'gatsby'
import Layout from '../../../../components/layout'
import Seo from '../../../../components/seo'
import '../../../../components/dbg/dbg-microsite.css'

const viewModes = [
  'Control Tower view for mission-scale overview and monitoring',
  'Soldier or single-radio view for local perspective and link intuition',
  'Observer or fly-through view for scene inspection and demo narration',
]

const sections = [
  {
    title: 'Overview',
    body: 'DBG Gym is the digital-twin layer used to train, test, and explain predictive networking behavior under realistic terrain, materials, mobility, and traffic conditions.',
  },
  {
    title: 'Scene Generation Pipeline',
    body: 'Covers the scene database, terrain setup, buildings, materials, and the asset pipeline used to create controlled but diverse training and demonstration environments.',
  },
  {
    title: 'Materials and RF Context',
    body: 'Summarizes how terrain and material properties support more credible propagation assumptions and how those assumptions connect to validation work elsewhere in the program.',
  },
  {
    title: 'Unreal and Runtime Integration',
    body: 'Documents the runtime bridge between visualization, relay behavior, scenario execution, and the environment-to-agent interfaces used by the broader DBG stack.',
  },
  {
    title: 'Scenario Editing and Visualization',
    body: 'Tracks interactive controls, scenario adjustments, visual overlays, and operator-facing tools for interrogating missions, radios, and network behavior.',
  },
  {
    title: 'Assets and Roadmap',
    body: 'Captures the current visual inventory, approved screenshots or clips, and the remaining gaps needed for stronger collaborator review and external storytelling.',
  },
]

const assetNeeds = [
  'Approved Control Tower, Soldier, and Observer screenshots with stable captions',
  'Representative terrain and material examples that communicate the twin without showing sensitive detail',
  'A small gallery or clip set that replaces placeholder visuals with polished internal review assets',
]

const DbgGymVisualizationPage = () => (
  <Layout headerVariant="compact">
    <div className="dbg-page">
      <section className="dbg-internal-hero">
        <div className="dbg-shell">
          <Link className="dbg-back-link" to="/projects/dynamic-belief-games">
            ← Back to DBG home
          </Link>
          <p className="dbg-internal-hero__meta">Internal Workstream</p>
          <h1>DBG Gym &amp; Visualization Components</h1>
          <p className="dbg-internal-hero__subtitle">
            Internal notes on the digital-twin environment, visualization modes, terrain and
            material controls, scenario editing, and the runtime interfaces that support DBG
            demonstrations and experimentation.
          </p>
          <div className="dbg-internal-note">
            This page should emphasize approved visuals and architecture summaries rather than
            dense implementation notes. It is a collaborator-facing staging area, not a public
            release page.
          </div>
        </div>
      </section>

      <section className="dbg-section">
        <div className="dbg-shell">
          <div className="dbg-section__intro">
            <p className="dbg-section__eyebrow">Visualization Modes</p>
            <h2>Core views already implied by the deck and layout plan</h2>
          </div>
          <div className="dbg-meta-grid dbg-meta-grid--three">
            {viewModes.map(item => (
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
            <p className="dbg-section__eyebrow">Workstream Scope</p>
            <h2>Digital-twin and visualization components</h2>
            <p>
              This workstream consolidates the 3D Gym and runtime visualization material into one
              internal page so the project can review visual infrastructure without prematurely
              splitting ownership across several thin pages.
            </p>
          </div>
          <div className="dbg-card-grid dbg-card-grid--two">
            {sections.map(section => (
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
            <p className="dbg-section__eyebrow">Assets Needed</p>
            <h2>What this page still needs to become useful internally</h2>
          </div>
          <ul className="dbg-bullet-list">
            {assetNeeds.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  </Layout>
)

export default DbgGymVisualizationPage

export const Head = () => (
  <Seo
    title="DBG Internal: DBG Gym & Visualization"
    description="Convenience-gated internal workstream summary for the DBG Gym and visualization components."
    meta={[{ name: 'robots', content: 'noindex, nofollow' }]}
  />
)
