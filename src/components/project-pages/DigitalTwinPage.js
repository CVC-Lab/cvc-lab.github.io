import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import Layout from '../layout'
import './digital-twin-project.css'

// fit: 'cover' (default, photographs) crops to the frame; 'contain' shows a diagram whole.
const withFit = (base, fit) => (fit === 'contain' ? `${base} ${base}--contain` : base)

const DigitalTwinPage = ({ project }) => (
  <Layout headerVariant="compact">
    <div className="dt-page">
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
              <Link className="dt-button" to="/projects/?theme=world-models">
                <FaArrowLeft aria-hidden="true" /> World Models
              </Link>
            </div>
            <p className="dt-source">{project.sourceNote}</p>
          </div>
          <figure className={withFit('dt-hero__figure', project.heroFit)}>
            <img
              src={project.heroImage}
              width={project.heroWidth}
              height={project.heroHeight}
              alt={project.heroAlt}
              decoding="async"
            />
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
              <figure className={withFit('dt-gallery__item', item.fit)} key={item.title}>
                <a href={item.full} target="_blank" rel="noopener noreferrer">
                  <img
                    src={item.image}
                    width={item.width}
                    height={item.height}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="visually-hidden"> (opens the full-size image in a new tab)</span>
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
          <div
            className="dt-process"
            role="list"
            aria-label={`${project.title} workflow`}
            style={{ '--dt-process-columns': project.process.length }}
          >
            {project.process.map((step, index) => (
              <article className="dt-process__step" key={step.title} role="listitem">
                <span className="dt-process__index">{String(index + 1).padStart(2, '0')}</span>
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
          <Link className="dt-button dt-button--primary" to="/projects/?theme=world-models">
            Browse World Models <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  </Layout>
)

const fit = PropTypes.oneOf(['cover', 'contain'])

DigitalTwinPage.propTypes = {
  project: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    eyebrow: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    heroImage: PropTypes.string.isRequired,
    heroWidth: PropTypes.number.isRequired,
    heroHeight: PropTypes.number.isRequired,
    heroFit: fit,
    heroAlt: PropTypes.string.isRequired,
    heroCaption: PropTypes.string.isRequired,
    sourceNote: PropTypes.string.isRequired,
    overviewEyebrow: PropTypes.string.isRequired,
    overviewTitle: PropTypes.string.isRequired,
    overview: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.object).isRequired,
    galleryTitle: PropTypes.string.isRequired,
    galleryIntro: PropTypes.string.isRequired,
    gallery: PropTypes.arrayOf(
      PropTypes.shape({
        image: PropTypes.string.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        full: PropTypes.string.isRequired,
        fit,
        title: PropTypes.string.isRequired,
        alt: PropTypes.string.isRequired,
        caption: PropTypes.string.isRequired,
      })
    ).isRequired,
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
