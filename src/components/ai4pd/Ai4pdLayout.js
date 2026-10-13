import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa'
import Layout from '../layout'
import Seo from '../seo'
import SmartLink, { resolveLink } from '../ui/SmartLink'
import { useScrollStrip } from '../ui/useScrollStrip'
import { AI4PD_NAV, AI4PD_BASE, PATIENT_PORTAL_URL, CONTACT_EMAIL } from './links'
import ai4pdShare from '../../images/projects/ai4pd/ai4pd_share.jpg'
import './ai4pd.css'

const SECTIONS = AI4PD_NAV.map(item => item.key).concat(['background'])

/** The program's own sub-navigation; the strip keeps the current tab in view. */
const Ai4pdNav = ({ section, current }) => {
  const { ref, fade } = useScrollStrip({ active: '[aria-current]' })

  return (
    <nav className="ai4pd-nav" aria-label="AI4PD sections">
      <div className="page-container ai4pd-nav__inner">
        <Link to={`${AI4PD_BASE}/`} className="ai4pd-nav__brand">
          AI4PD
          <span>AI for Parkinson&apos;s disease</span>
        </Link>
        <ul ref={ref} className="ai4pd-nav__links ui-scroll-strip" data-fade={fade}>
          {AI4PD_NAV.map(item => (
            <li key={item.key}>
              <Link
                to={item.to}
                className={item.key === section ? 'is-active' : undefined}
                aria-current={item.key === section ? current : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <SmartLink
          to={PATIENT_PORTAL_URL}
          className="ai4pd-button ai4pd-button--primary ai4pd-nav__portal"
        >
          Patient portal <FaExternalLinkAlt aria-hidden="true" />
        </SmartLink>
      </div>
    </nav>
  )
}

Ai4pdNav.propTypes = {
  section: PropTypes.oneOf(SECTIONS),
  current: PropTypes.oneOf(['page', 'true']).isRequired,
}

/**
 * Shell for every AI4PD page: the CVC layout plus the program's own sub-navigation,
 * so the Parkinson's material reads as one site instead of three. `current` is "page"
 * on a section's own route and "true" on a page under it (the thrust briefs).
 */
const Ai4pdLayout = ({ section, current = 'page', children }) => (
  <Layout headerVariant="compact">
    <div className="ai4pd-page">
      <Ai4pdNav section={section} current={current} />

      {children}

      <footer className="ai4pd-footer">
        <div className="page-container ai4pd-footer__inner">
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
  section: PropTypes.oneOf(SECTIONS),
  current: PropTypes.oneOf(['page', 'true']),
  children: PropTypes.node.isRequired,
}

export default Ai4pdLayout

const SHARE_ALT =
  'A patient surrounded by the evidence AI4PD combines: brain imaging, a clinic exam, a wearable gait signal, a biospecimen, and a timeline of visits'

/**
 * Head for an AI4PD page: title suffixed with the program name, canonical from location.
 * Link previews show the program figure unless the page names its own image.
 */
export const Ai4pdHead = ({
  title,
  description,
  location,
  image = ai4pdShare,
  imageAlt = SHARE_ALT,
}) => (
  <Seo
    title={title ? `${title} | AI4PD` : 'AI4PD: AI for Parkinson’s disease'}
    description={description}
    pathname={location.pathname}
    image={image}
    imageAlt={imageAlt}
  />
)

Ai4pdHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string.isRequired,
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
  image: PropTypes.string,
  imageAlt: PropTypes.string,
}

/** Arrow for a link that stays on the site, the external-link mark for one that leaves it. */
export const LinkIcon = ({ to }) =>
  resolveLink(to).kind === 'external' ? (
    <FaExternalLinkAlt aria-hidden="true" />
  ) : (
    <FaArrowRight aria-hidden="true" />
  )

LinkIcon.propTypes = { to: PropTypes.string.isRequired }
