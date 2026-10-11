import * as React from 'react'
import BackLink from '../ui/BackLink'
import SmartLink from '../ui/SmartLink'
import { useVideoPlayback } from '../../hooks/useVideoPlayback'
import './dbg-microsite.css'
// WebP derivatives; the full-size originals live in the assets-v1 GitHub release.
import overviewImage from '../../images/projects/dynamic_belief_games/DBG_overview.webp'
import overviewImage725 from '../../images/projects/dynamic_belief_games/DBG_overview_725.webp'
import overviewImage1075 from '../../images/projects/dynamic_belief_games/DBG_overview_1075.webp'
import videoPoster from '../../images/projects/dynamic_belief_games/observer-view-demo-poster.webp'
import observerVideo from '../../images/projects/dynamic_belief_games/observer-view-demo-preview.webm'
import observerVideoMp4 from '../../images/projects/dynamic_belief_games/observer-view-demo-preview.mp4'

const branchLinks = [
  {
    title: 'DBG Internal Site',
    description:
      'Protected workspace for authorized team members with demos, documentation, protocol notes, and internal project material.',
    href: 'https://cvcdbg.org/',
    label: 'Protected',
  },
]

const DbgProjectHome = () => {
  const { videoRef } = useVideoPlayback()

  return (
    <div className="dbg-project-home">
      <section className="dbg-home-hero">
        <div className="page-container dbg-home-hero__grid">
          <div className="dbg-home-hero__content">
            <BackLink to="/projects/">Back to all projects</BackLink>
            <p className="dbg-home-eyebrow">Dynamic Belief Games</p>
            <h1>Predictive networking for contested mobile missions.</h1>
            <p>
              DBG trains intelligent networking agents inside a digital-twin environment so mobile
              ad hoc networks can reason about terrain, interference, route choice, and mission risk
              before deployment. This public page stays intentionally high level; deeper project
              material is available only through the protected internal site.
            </p>
          </div>

          <div className="dbg-home-visual">
            {/* Full page width up to 1100px, then the right-hand column (at most 680px). sizes and
                srcSet come before src: WebKit starts loading as soon as src is set. */}
            <img
              className="dbg-home-visual__image"
              sizes="(max-width: 1100px) calc(100vw - 2rem), 680px"
              srcSet={`${overviewImage725} 725w, ${overviewImage1075} 1075w, ${overviewImage} 1672w`}
              src={overviewImage}
              alt="Layered DBG concept showing intelligent agents, digital twin, and mission environment"
              width="1672"
              height="941"
              decoding="async"
            />
            <div className="dbg-home-visual__caption">
              <span>Concept preview</span>
              <strong>Mission environment + digital twin + agents</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="dbg-home-stack">
        <div className="page-container dbg-home-stack__grid">
          <div>
            <p className="dbg-home-eyebrow">DBG Stack</p>
            <h2>From mission environment to intelligent agents</h2>
            <p>
              The project connects a mission-scale environment, a calibrated digital twin, and
              intelligent networking agents into one testable decision loop.
            </p>
          </div>
          <figure className="dbg-home-stack__figure">
            <video
              ref={videoRef}
              className="dbg-home-stack__video"
              poster={videoPoster}
              aria-label="DBG Gym demo: silent looping screen recording"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
            >
              <source src={observerVideo} type="video/webm" />
              <source src={observerVideoMp4} type="video/mp4" />
            </video>
          </figure>
        </div>
      </section>

      <section className="dbg-home-tree">
        <div className="page-container">
          <div className="dbg-home-tree__header">
            <p className="dbg-home-eyebrow">Explore the Project</p>
            <h2>Internal project access</h2>
            <p>
              The public page is a teaser for the research direction. Authorized collaborators can
              continue into the protected internal site for implementation details and project
              assets.
            </p>
          </div>

          <div className="dbg-home-tree__map dbg-home-tree__map--single">
            <div className="dbg-home-tree__root">
              <span>DBG</span>
            </div>
            <div className="dbg-home-tree__trunk" aria-hidden="true" />
            <div className="dbg-home-tree__branches dbg-home-tree__branches--single">
              {branchLinks.map(branch => (
                <SmartLink className="dbg-home-branch" to={branch.href} key={branch.title}>
                  <span className="dbg-home-branch__label">{branch.label}</span>
                  <h3>{branch.title}</h3>
                  <p>{branch.description}</p>
                </SmartLink>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DbgProjectHome
