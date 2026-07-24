import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import Layout from '../layout'
import './digital-twin-project.css'

const DigitalTwinPage = ({ project }) => (
  <Layout headerVariant="compact">
    <main className={`dt-page dt-page--${project.slug}`}>
      <section className="dt-hero">
        <div className="dt-shell dt-hero__grid">
          <div className="dt-hero__copy">
            <p className="dt-eyebrow">{project.eyebrow}</p>
            <h1>{project.title}</h1>
            <p className="dt-hero__subtitle">{project.subtitle}</p>
            <div className="dt-actions">
              <a className="dt-button dt-button--primary" href="#overview">
                Explore the twin <FaArrowDown aria-hidden="true" />
              </a>
              <Link className="dt-button" to="/projects?theme=world-models">
                <FaArrowLeft aria-hidden="true" /> World Models
              </Link>
            </div>
            <p className="dt-source">{project.sourceNote}</p>
          </div>
          <figure className="dt-hero__figure">
            <img src={project.heroImage} alt={project.heroAlt} />
            <figcaption>{project.heroCaption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="dt-section" id="overview">
        <div className="dt-shell">
          <div className="dt-section-heading">
            <p className="dt-eyebrow">{project.overviewEyebrow}</p>
            <h2>{project.overviewTitle}</h2>
            <p>{project.overview}</p>
          </div>
          <div className="dt-feature-grid">
            {project.features.map(feature => (
              <article className="dt-feature" key={feature.kicker}>
                <p className="dt-feature__kicker">{feature.kicker}</p>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dt-section dt-section--muted" id="visuals">
        <div className="dt-shell">
          <div className="dt-section-heading">
            <p className="dt-eyebrow">Visual map</p>
            <h2>{project.galleryTitle}</h2>
            <p>{project.galleryIntro}</p>
          </div>
          <div className="dt-gallery">
            {project.gallery.map(item => (
              <figure className="dt-gallery__item" key={item.title}>
                <a href={item.image} target="_blank" rel="noreferrer">
                  <img src={item.image} alt={item.alt} loading="lazy" />
                </a>
                <figcaption>
                  <strong>{item.title}</strong>
                  <span>{item.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="dt-section" id="workflow">
        <div className="dt-shell">
          <div className="dt-section-heading">
            <p className="dt-eyebrow">Workflow</p>
            <h2>{project.workflowTitle}</h2>
            <p>{project.workflowIntro}</p>
          </div>
          <div className="dt-process" role="list" aria-label={`${project.title} workflow`}>
            {project.process.map((step, index) => (
              <article className="dt-process__step" key={step.title} role="listitem">
                <span className="dt-process__index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {index < project.process.length - 1 && (
                  <FaArrowRight className="dt-process__arrow" aria-hidden="true" />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dt-section dt-section--dark" id="technical">
        <div className="dt-shell">
          <div className="dt-section-heading dt-section-heading--dark">
            <p className="dt-eyebrow">Technical view</p>
            <h2>{project.technicalTitle}</h2>
            <p>{project.technicalIntro}</p>
          </div>
          <div className="dt-detail-grid">
            {project.details.map(detail => (
              <article className="dt-detail" key={detail.title}>
                <h3>{detail.title}</h3>
                <p>{detail.body}</p>
                {detail.items && (
                  <ul>
                    {detail.items.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dt-section dt-section--closing">
        <div className="dt-shell dt-closing">
          <div>
            <p className="dt-eyebrow">Current scope</p>
            <h2>{project.closingTitle}</h2>
            <p>{project.closingBody}</p>
          </div>
          <Link className="dt-button dt-button--primary" to="/projects?theme=world-models">
            Browse World Models <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  </Layout>
)

DigitalTwinPage.propTypes = {
  project: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    eyebrow: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    heroImage: PropTypes.string.isRequired,
    heroAlt: PropTypes.string.isRequired,
    heroCaption: PropTypes.string.isRequired,
    sourceNote: PropTypes.string.isRequired,
    overviewEyebrow: PropTypes.string.isRequired,
    overviewTitle: PropTypes.string.isRequired,
    overview: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.object).isRequired,
    galleryTitle: PropTypes.string.isRequired,
    galleryIntro: PropTypes.string.isRequired,
    gallery: PropTypes.arrayOf(PropTypes.object).isRequired,
    workflowTitle: PropTypes.string.isRequired,
    workflowIntro: PropTypes.string.isRequired,
    process: PropTypes.arrayOf(PropTypes.object).isRequired,
    technicalTitle: PropTypes.string.isRequired,
    technicalIntro: PropTypes.string.isRequired,
    details: PropTypes.arrayOf(PropTypes.object).isRequired,
    closingTitle: PropTypes.string.isRequired,
    closingBody: PropTypes.string.isRequired,
  }).isRequired,
}

export default DigitalTwinPage
