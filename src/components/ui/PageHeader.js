import * as React from 'react'
import PropTypes from 'prop-types'
import './PageHeader.css'

/**
 * The title block of a page: its only <h1>, with an optional back link above,
 * eyebrow, lede and extra content below. It owns the space above the title, so
 * the page wrapper around it has no top padding of its own.
 */
const PageHeader = ({ title, eyebrow, lede, align = 'left', back, className = '', children }) => (
  <header
    className={`page-header page-header--${align}${back ? ' page-header--has-back' : ''} ${className}`.trim()}
  >
    {back && <div className="page-header__back">{back}</div>}
    {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
    <h1 className="page-title">{title}</h1>
    {lede && <p className="page-header__lede">{lede}</p>}
    {children && <div className="page-header__extra">{children}</div>}
  </header>
)

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  eyebrow: PropTypes.node,
  lede: PropTypes.node,
  align: PropTypes.oneOf(['left', 'center']),
  back: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
}

export default PageHeader
