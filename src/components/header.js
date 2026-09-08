import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Navigation from './navigation'
import { StaticImage } from 'gatsby-plugin-image'
import './header.css'

const Header = ({ siteTitle = '', menuLinks = [], variant = 'default' }) => {
  const isCompact = variant === 'compact'
  const isNavOnly = variant === 'nav-only'
  const [isScrolled, setIsScrolled] = React.useState(false)
  const showExpandedHeader = !isCompact && !isNavOnly && !isScrolled

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const collapseThreshold = 120
    const expandThreshold = 48

    const updateScrollState = () => {
      const currentScrollY = window.scrollY

      setIsScrolled(prevIsScrolled => {
        if (prevIsScrolled) {
          return currentScrollY > expandThreshold
        }

        return currentScrollY > collapseThreshold
      })
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })

    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  return (
    <header
      className={`site-header ${isCompact ? 'site-header--compact' : ''} ${
        isNavOnly ? 'site-header--nav-only' : ''
      } ${isScrolled ? 'site-header--scrolled' : ''}`}
    >
      <div
        className={`header-inner ${isCompact ? 'header-inner--compact' : ''} ${
          isNavOnly ? 'header-inner--nav-only' : ''
        } ${isScrolled ? 'header-inner--scrolled' : ''}`}
      >
        <div className="header-flex-container">
          <Link to="/" className="header-logo-link">
            <StaticImage
              className="headerlogo"
              src="../images/knockout_university_formal_horizontal.png"
              width={280}
              quality={95}
              formats={['auto', 'webp', 'avif']}
              alt="UT Austin Logo"
              placeholder="none"
              loading="eager"
            />
          </Link>
          <Navigation menuLinks={menuLinks} />
        </div>

        {isCompact ? (
          <Link to="/" className="site-title-link site-title-link--compact">
            <div className="site-title site-title--compact">{siteTitle}</div>
          </Link>
        ) : showExpandedHeader ? (
          <>
            <div className="site-title-wrap">
              <Link to="/" className="site-title-link">
                <div className="site-title">{siteTitle}</div>
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </header>
  )
}

Header.propTypes = {
  siteTitle: PropTypes.string,
  menuLinks: PropTypes.array,
  variant: PropTypes.oneOf(['default', 'compact', 'nav-only']),
}

export default Header
