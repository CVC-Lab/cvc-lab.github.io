import * as React from 'react'
import PropTypes from 'prop-types'
import BackLink from '../ui/BackLink'
import Ai4pdLayout from './Ai4pdLayout'
import { AI4PD_BASE } from './links'

// Where a markdown sub-page sits in the program: the tab to highlight and the page it returns to.
const PARENTS = [
  {
    prefix: `${AI4PD_BASE}/thrusts/`,
    section: 'approach',
    to: `${AI4PD_BASE}/approach/#thrusts`,
    label: 'Approach',
  },
  {
    prefix: `${AI4PD_BASE}/background/`,
    section: 'background',
    to: `${AI4PD_BASE}/background/`,
    label: 'Background',
  },
]
const HUB = { to: `${AI4PD_BASE}/`, label: 'AI4PD' }

/**
 * Chrome for the AI4PD markdown sub-pages (thrust briefs, background parts): the program's
 * sub-nav and footer, a back link to the parent page and the page's only h1.
 */
const Ai4pdMarkdownPage = ({ title, eyebrow, slug, children }) => {
  const path = `/${String(slug || '').replace(/^\/+|\/+$/g, '')}/`
  const parent = PARENTS.find(item => path.startsWith(item.prefix)) || HUB

  return (
    <Ai4pdLayout section={parent.section} current="true">
      <article>
        <header className="ai4pd-hero ai4pd-hero--doc">
          <div className="page-container">
            <BackLink to={parent.to}>Back to {parent.label}</BackLink>
            {eyebrow && <p className="ai4pd-eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
          </div>
        </header>
        <div className="ai4pd-doc">
          <div className="page-container">
            <div className="ai4pd-prose ai4pd-markdown">{children}</div>
          </div>
        </div>
      </article>
    </Ai4pdLayout>
  )
}

Ai4pdMarkdownPage.propTypes = {
  title: PropTypes.node.isRequired,
  eyebrow: PropTypes.node,
  slug: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

export default Ai4pdMarkdownPage
