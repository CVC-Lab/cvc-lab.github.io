import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Navigation from './navigation'
import { StaticImage } from 'gatsby-plugin-image'
import './header.css'

// Without JavaScript the menu button cannot open the drawer, so below 1024px (the drawer
// range in navigation.css) the links sit on a second row of a bar that scrolls with the page.
const NO_SCRIPT_CSS = `@media (max-width: 1023.98px) {
  :root { --site-header-height: 0px; }
  .site-header, .site-header-shadow { position: relative; }
  .site-header__inner { flex-wrap: wrap; row-gap: 0; }
  .header-logo-link { display: flex; align-items: center; min-height: 3rem; }
  .nav-wrapper { display: block; flex: 1 0 100%; }
  .nav-hamburger { display: none; }
  .nav-menu {
    display: block; position: static; width: auto; padding: 0;
    overflow: visible; background: none; box-shadow: none; border: 0;
  }
  .nav-list { flex-direction: row; flex-wrap: wrap; margin-inline: -0.625rem; padding: 0; }
  .nav-link { padding: var(--spacing-2) 0.625rem; border-bottom: 0; font-size: 0.8125rem; }
  .nav-link--active { background: none; box-shadow: none; text-decoration: none; }
  .nav-link::after { display: block; }
}`

// useLayoutEffect warns during SSR; the height only matters in the browser.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

const Header = ({ siteTitle = '', menuLinks = [], variant = 'default' }) => {
  const barRef = React.useRef(null)

  // Publish the bar's real height for scroll offsets and page-level sticky bars.
  useIsomorphicLayoutEffect(() => {
    const bar = barRef.current
    const root = document.documentElement
    let published = ''
    const publish = () => {
      const next = `${Math.round(bar.getBoundingClientRect().height * 100) / 100}px`
      if (next === published) return
      published = next
      root.style.setProperty('--site-header-height', next)
    }
    publish()
    const observer = window.ResizeObserver ? new window.ResizeObserver(publish) : null
    observer?.observe(bar)
    return () => {
      observer?.disconnect()
      root.style.removeProperty('--site-header-height')
    }
  }, [])

  return (
    <>
      <header className="site-header" ref={barRef}>
        <div className="site-header__inner page-container">
          <Link
            to="/"
            className="header-logo-link"
            aria-label={`${siteTitle} home, The University of Texas at Austin`}
          >
            <StaticImage
              className="site-header__logo"
              src="../images/knockout_university_formal_horizontal.png"
              width={280}
              quality={95}
              formats={['auto', 'webp', 'avif']}
              alt=""
              placeholder="none"
              loading="eager"
              objectFit="contain"
            />
          </Link>
          <Navigation menuLinks={menuLinks} />
        </div>
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: NO_SCRIPT_CSS }} />
        </noscript>
      </header>
      {variant !== 'nav-only' && (
        <div
          className={`site-masthead${variant === 'compact' ? ' site-masthead--compact' : ''}`}
          aria-hidden="true"
        >
          <div className="page-container">
            <Link to="/" className="site-title" tabIndex={-1}>
              {siteTitle}
            </Link>
          </div>
        </div>
      )}
      <div className="site-header-shadow" aria-hidden="true" />
    </>
  )
}

Header.propTypes = {
  siteTitle: PropTypes.string,
  menuLinks: PropTypes.array,
  variant: PropTypes.oneOf(['default', 'compact', 'nav-only']),
}

export default Header
