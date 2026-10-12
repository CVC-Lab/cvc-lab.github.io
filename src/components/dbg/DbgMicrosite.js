import * as React from 'react'
import BackLink from '../ui/BackLink'
import SmartLink from '../ui/SmartLink'
import './dbg-microsite.css'
// WebP derivatives; the full-size originals live in the assets-v1 GitHub release.
import heroImage from '../../images/projects/dynamic_belief_games/DBG_Main.webp'
import frameworkImage from '../../images/projects/dynamic_belief_games/dynamic_belief_games_diagram.webp'
import gymImage from '../../images/projects/dynamic_belief_games/3dgym_example.webp'
import resultsImage from '../../images/projects/dynamic_belief_games/integrated_network_v4.webp'
import demoImage from '../../images/projects/dynamic_belief_games/drone-swarm.webp'

const proofItems = [
  '3D digital twin for training and testing',
  'RF-grounded calibration from physical measurements',
  'Mission-constrained route and uptime evaluation',
]

const challengeCards = [
  {
    title: 'Terrain and mobility',
    body: 'DBG targets contested, mobile, terrain-constrained missions where line-of-sight changes, blocked paths, and shifting topology can break assumptions quickly.',
  },
  {
    title: 'Adversarial pressure',
    body: 'The networking problem is shaped by jamming, spoofing, spectral contention, and uncertain operational state rather than a stable, fully observed environment.',
  },
  {
    title: 'Operational constraints',
    body: 'The system must respect relay budgets, limited power, mission routing plans, and the practical requirement to adapt without changing waveform firmware.',
  },
]

const approachSteps = [
  {
    title: 'Sense',
    body: 'Agents form uncertainty-aware beliefs from heterogeneous observations about terrain, structure, mobility, spectrum, cyber conditions, and mission-relevant objects.',
  },
  {
    title: 'Train',
    body: 'Dynamic Belief Games generates adversarial training scenarios inside a controlled digital twin so agents can learn under realistic, high-variance conditions.',
  },
  {
    title: 'Adapt',
    body: 'PIN agents learn policies for topology, routing, queueing, prioritization, and decision support while explicitly managing downside risk.',
  },
]

const gymFeatures = [
  'Realistic terrain, materials, mobility, and traffic conditions',
  'Control Tower, observer, and soldier-style visual modes',
  'Scenario editing, repeatable experiments, and scalable training runs',
]

const validationPoints = [
  'Virtual scenes are anchored to real radio behavior rather than treated as purely synthetic environments.',
  'The validation layer compares digital-twin assumptions against physical measurements and testbed-informed calibration.',
  'This makes DBG more credible as a training and testing framework for deployment-oriented networking decisions.',
]

const contacts = [
  {
    title: 'Ryan Farell',
    description: 'Co-Principal Investigator and main technical contact for current DBG work.',
    to: 'mailto:ryan.farell@utexas.edu',
    cta: 'Email Ryan',
  },
  {
    title: 'Chandrajit Bajaj',
    description: 'Principal investigator for the project and broader research direction.',
    to: 'mailto:bajaj@cs.utexas.edu',
    cta: 'Email Chandrajit',
  },
]

const DbgMicrosite = () => (
  <div className="dbg-page">
    <section className="dbg-hero">
      <div className="page-container dbg-hero__grid">
        <div className="dbg-hero__content">
          <BackLink to="/projects/dynamic-belief-games/">Back to DBG home</BackLink>
          <p className="dbg-eyebrow">Project Overview</p>
          <h1>Dynamic Belief Games</h1>
          <p className="dbg-hero__subtitle">
            Training predictive intelligent networking agents for contested mobile ad hoc networks.
          </p>
          <p className="dbg-hero__copy">
            DBG trains Predictive Intelligent Networking (PIN) agents to help mobile ad hoc networks
            adapt proactively to mobility, terrain, and interference. It combines adversarial
            scenario generation, a 3D digital twin, and RF-grounded validation to test and improve
            decisions before deployment.
          </p>
          <div className="dbg-hero__actions">
            <a className="dbg-button dbg-button--primary" href="#dbg-gym">
              View DBG Gym
            </a>
            <a className="dbg-button dbg-button--secondary" href="#results">
              View Demo 1
            </a>
          </div>
          <div className="dbg-proof-strip">
            {proofItems.map(item => (
              <div key={item} className="dbg-proof-strip__item">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="dbg-hero__media">
          <img
            src={heroImage}
            alt="Dynamic Belief Games system diagram: PIN-enabled soldier radio network with Layer-7 overlay, DBG differentiable policy optimization loop, and high-fidelity synthetic training visuals"
            width="1600"
            height="1229"
            decoding="async"
          />
        </div>
      </div>
    </section>

    <section className="dbg-section">
      <div className="page-container">
        <div className="dbg-section__intro">
          <p className="dbg-section__eyebrow">The Challenge</p>
          <h2>Why current mobile networks fail under real mission conditions</h2>
          <p>
            DBG is motivated by mobile, contested, terrain-constrained missions where reactive
            heuristics fail to keep pace with rapid link changes and adversarial pressure.
          </p>
        </div>
        <div className="dbg-card-grid dbg-card-grid--three">
          {challengeCards.map(card => (
            <article key={card.title} className="dbg-card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="dbg-section dbg-section--alt">
      <div className="page-container dbg-section__split">
        <div>
          <p className="dbg-section__eyebrow">How DBG Works</p>
          <h2>The framework, the agents, and the platform</h2>
          <p>
            Dynamic Belief Games is the training and decision framework. PIN agents are the learned
            networking agents. DBG Gym is the digital twin used to train, test, and compare policies
            under controlled but realistic variation.
          </p>
          <div className="dbg-step-list">
            {approachSteps.map(step => (
              <article key={step.title} className="dbg-step">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="dbg-visual-card">
          <img
            src={frameworkImage}
            alt="Dynamic Belief Games conceptual framework diagram"
            width="1411"
            height="771"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>

    <section className="dbg-section" id="dbg-gym">
      <div className="page-container dbg-section__split">
        <div className="dbg-visual-card">
          <img
            src={gymImage}
            alt="DBG Gym control-tower view with layered terrain and squad paths"
            width="1600"
            height="792"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div>
          <p className="dbg-section__eyebrow">DBG Gym</p>
          <h2>A digital twin for training, testing, and visualizing network behavior</h2>
          <p>
            DBG Gym creates realistic terrain, materials, mobility, and traffic conditions while
            exposing the system through multiple views and scenario controls that support repeatable
            experimentation.
          </p>
          <ul className="dbg-bullet-list">
            {gymFeatures.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>

    <section className="dbg-section dbg-section--alt" id="validation">
      <div className="page-container dbg-section__split">
        <div>
          <p className="dbg-section__eyebrow">Validation</p>
          <h2>Ground the digital twin in real-world RF behavior</h2>
          <p>
            The project is not simulation only. The validation layer is intended to compare
            digital-twin assumptions against field measurements and testbed-informed radio behavior.
          </p>
          <ul className="dbg-bullet-list">
            {validationPoints.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="dbg-visual-card">
          <img
            src={resultsImage}
            alt="Dynamic Belief Games integrated network mission visual"
            width="965"
            height="659"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>

    <section className="dbg-section" id="results">
      <div className="page-container">
        <div className="dbg-section__intro">
          <p className="dbg-section__eyebrow">Demonstrated Capability</p>
          <h2>Demo 1 &mdash; Platoon Coverage vs Uptime</h2>
          <p>
            DBG Gym&apos;s first demonstration compares two platoon routes through a single urban
            mission envelope. Both routes share the same start and end sectors, the same mission
            legs, and the same formation-spacing rules; only the route geometry differs. Coverage,
            outage, and path loss are measured per node and per route.
          </p>
        </div>
        <div className="dbg-section__split">
          <div className="dbg-visual-card">
            <img
              src={demoImage}
              alt="Austin-area scenario playback in DBG Gym showing platoon routes with blue and red trajectories and communication-radius overlays"
              width="1600"
              height="808"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <h3>Setup</h3>
            <ul className="dbg-bullet-list">
              <li>Routes follow ATP 3-21.8 planning, motivated by NG-NRMM cost maps.</li>
              <li>
                Both paths share start and end sectors and mission legs, with no node pair closer
                than 50 ft.
              </li>
              <li>
                Corridors follow building geometry; open-field zones outside the cover band are
                excluded.
              </li>
            </ul>
            <h3>Outcome</h3>
            <p>
              Coordinated routes &mdash; synced between buildings &mdash; sustained higher uptime
              than staggered, dispersed routes. Staggered routes showed a large coverage dip around
              a central obstruction; coordinated routes avoided it. DBG predicts and suggests such
              routes to maximize uptime under the same mission envelope.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section className="dbg-section dbg-section--alt">
      <div className="page-container">
        <div className="dbg-section__intro">
          <p className="dbg-section__eyebrow">Contact</p>
          <h2>Project contacts</h2>
          <p>
            For research opportunities or technical conversations, reach the project leads directly.
          </p>
        </div>
        <div className="dbg-card-grid dbg-card-grid--two">
          {contacts.map(contact => (
            <article key={contact.title} className="dbg-card dbg-resource-card">
              <h3>{contact.title}</h3>
              <p>{contact.description}</p>
              <SmartLink className="dbg-text-link" to={contact.to}>
                {contact.cta}
              </SmartLink>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="dbg-section">
      <div className="page-container">
        <div className="dbg-section__intro">
          <p className="dbg-section__eyebrow">Team</p>
          <h2>Leadership and contributors</h2>
        </div>
        <div className="dbg-team-groups">
          <div>
            <h3>Leadership</h3>
            <ul className="dbg-bullet-list">
              <li>Chandrajit Bajaj, Principal Investigator</li>
              <li>Ryan Farell, Co-Principal Investigator</li>
            </ul>
          </div>
          <div>
            <h3>Contributors</h3>
            <ul className="dbg-bullet-list">
              <li>Andrew Farell</li>
              <li>Logan Kronforst</li>
              <li>Brian Kim</li>
              <li>Callihan Bertley</li>
              <li>Luke McLennan</li>
            </ul>
          </div>
          <div>
            <h3>Administration</h3>
            <ul className="dbg-bullet-list">
              <li>Catherine Andersson, Administrator</li>
            </ul>
          </div>
          <div>
            <h3>Funding and opportunities</h3>
            <ul className="dbg-bullet-list">
              <li>Funded by Army &ndash; AFC UTDD (C5ISR); DOD Award W911NF-24-C-0006.</li>
              <li>Phase II runs 06 Apr 2025 through 08 Jan 2027.</li>
              <li>For research opportunities, contact Ryan Farell or Chandrajit Bajaj directly.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
)

export default DbgMicrosite
