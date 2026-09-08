import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa'
import Layout from '../layout'
import Seo from '../seo'
import { useCardImage } from '../../hooks/useCardImages'
import { AI4PD_NAV, AI4PD_BASE, PATIENT_PORTAL_URL, CONTACT_EMAIL } from './links'
import './ai4pd.css'

/**
 * Shell for every AI4PD page: the CVC layout plus the program's own sub-navigation,
 * so the Parkinson's material reads as one site instead of three.
 */
const Ai4pdLayout = ({ section, children }) => (
  <Layout headerVariant="compact">
    <div className="ai4pd-page">
      <nav className="ai4pd-nav" aria-label="AI4PD sections">
        <div className="ai4pd-shell ai4pd-nav__inner">
          <Link to={`${AI4PD_BASE}/`} className="ai4pd-nav__brand">
            AI4PD
            <span>AI for Parkinson&apos;s disease</span>
          </Link>
          <ul className="ai4pd-nav__links">
            {AI4PD_NAV.map(item => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className={item.key === section ? 'is-active' : undefined}
                  aria-current={item.key === section ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={PATIENT_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ai4pd-button ai4pd-button--primary ai4pd-nav__portal"
          >
            Patient portal <FaExternalLinkAlt aria-hidden="true" />
          </a>
        </div>
      </nav>

      {children}

      <footer className="ai4pd-footer">
        <div className="ai4pd-shell ai4pd-footer__inner">
          <p>
            AI4PD is a research program of the Computational Visualization Center, Oden Institute
            for Computational Engineering and Sciences, The University of Texas at Austin. Decision
            support only; every output goes to the physician first.
          </p>
          <p>
            <Link to="/projects/">All CVC projects</Link> ·{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>Prof. Chandrajit Bajaj, {CONTACT_EMAIL}</a>
          </p>
        </div>
      </footer>
    </div>
  </Layout>
)

Ai4pdLayout.propTypes = {
  section: PropTypes.oneOf(AI4PD_NAV.map(item => item.key).concat(['background'])),
  children: PropTypes.node.isRequired,
}

export default Ai4pdLayout

/** Head for an AI4PD page: title suffixed with the program name, canonical from location. */
export const Ai4pdHead = ({ title, description, location }) => (
  <Seo
    title={title ? `${title} | AI4PD` : 'AI4PD: AI for Parkinson’s disease'}
    description={description}
    pathname={location.pathname}
  />
)

Ai4pdHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string.isRequired,
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}

/** A figure from src/images/projects/ai4pd, served through gatsby-plugin-image. */
export const Ai4pdFigure = ({ name, alt, caption, loading = 'lazy', wide = false }) => {
  const resolveCardImage = useCardImage()
  const key = name.startsWith('projects/') ? name : `projects/ai4pd/${name}`
  const image = getImage(resolveCardImage(key))
  if (!image) return null
  return (
    <figure className={`ai4pd-figure${wide ? ' ai4pd-figure--wide' : ''}`}>
      <GatsbyImage image={image} alt={alt} loading={loading} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

Ai4pdFigure.propTypes = {
  name: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  caption: PropTypes.node,
  loading: PropTypes.oneOf(['eager', 'lazy']),
  wide: PropTypes.bool,
}

/** internal: Gatsby router; static: plain HTML under static/; external: new tab. */
export const SmartLink = ({ href, kind = 'internal', className, children }) => {
  if (kind === 'internal') {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }
  if (kind === 'external') {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

SmartLink.propTypes = {
  href: PropTypes.string.isRequired,
  kind: PropTypes.oneOf(['internal', 'static', 'external']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export const LinkIcon = ({ kind }) =>
  kind === 'external' ? (
    <FaExternalLinkAlt aria-hidden="true" />
  ) : (
    <FaArrowRight aria-hidden="true" />
  )

LinkIcon.propTypes = { kind: PropTypes.string }
