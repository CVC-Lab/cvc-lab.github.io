import * as React from 'react'
import { Link } from 'gatsby'
import './dbg-microsite.css'
import observerVideo from '../../images/projects/dynamic_belief_games/observer-view-demo-preview.webm'
import videoPoster from '../../images/projects/dynamic_belief_games/background_image.png'
import overviewImage from '../../images/projects/dynamic_belief_games/DBG_overview.png'

const branchLinks = [
  {
    title: 'DBG Overview',
    description: 'Project narrative, validation story, demo summary, team, and contacts.',
    to: '/projects/dynamic-belief-games/overview',
    label: 'Public',
  },
  {
    title: 'Systems & Protocols',
    description: 'Radio simulation, protocol stack, controller boundary, and PIN overlays.',
    to: '/projects/dynamic-belief-games/internal/systems-protocols',
    label: 'Protected',
  },
  {
    title: 'DBG Gym & Visualization',
    description: 'Digital twin, scene controls, visualization modes, and runtime demo assets.',
    to: '/projects/dynamic-belief-games/internal/dbg-gym-visualization',
    label: 'Protected',
  },
]

const DbgProjectHome = () => (
  <div className="dbg-project-home">
    <section className="dbg-home-hero">
      <div className="dbg-shell dbg-home-hero__grid">
        <div className="dbg-home-hero__content">
          <Link className="dbg-home-back-link" to="/projects">
            Back to all projects
          </Link>
          <p className="dbg-home-eyebrow">Dynamic Belief Games</p>
          <h1>Predictive networking for contested mobile missions.</h1>
          <p>
            DBG trains intelligent networking agents inside a digital-twin environment so mobile
            ad hoc networks can reason about terrain, interference, route choice, and mission risk
            before deployment.
          </p>
        </div>

        <div className="dbg-home-visual" aria-label="DBG observer-view video preview">
          <video
            className="dbg-home-visual__video"
            src={observerVideo}
            poster={videoPoster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="dbg-home-visual__caption">
            <span>Observer-view preview</span>
            <strong>Digital twin + mission geometry</strong>
          </div>
        </div>
      </div>
    </section>

    <section className="dbg-home-stack">
      <div className="dbg-shell dbg-home-stack__grid">
        <div>
          <p className="dbg-home-eyebrow">DBG Stack</p>
          <h2>From mission environment to intelligent agents</h2>
          <p>
            The project connects a mission-scale environment, a calibrated digital twin, and
            intelligent networking agents into one testable decision loop.
          </p>
        </div>
        <figure className="dbg-home-stack__figure">
          <img
            src={overviewImage}
            alt="Layered DBG concept showing mission environment, digital twin, and intelligent agents"
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>
    </section>

    <section className="dbg-home-tree">
      <div className="dbg-shell">
        <div className="dbg-home-tree__header">
          <p className="dbg-home-eyebrow">Explore the Project</p>
          <h2>Choose a branch</h2>
          <p>
            The landing page stays short. Deeper technical material lives in focused pages below.
          </p>
        </div>

        <div className="dbg-home-tree__map">
          <div className="dbg-home-tree__root">
            <span>DBG</span>
          </div>
          <div className="dbg-home-tree__trunk" aria-hidden="true" />
          <div className="dbg-home-tree__branches">
            {branchLinks.map(branch => (
              <Link className="dbg-home-branch" to={branch.to} key={branch.title}>
                <span className="dbg-home-branch__label">{branch.label}</span>
                <h3>{branch.title}</h3>
                <p>{branch.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  </div>
)

export default DbgProjectHome
