import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Navigation from './navigation'
import { StaticImage } from 'gatsby-plugin-image'
import './header.css'

const Header = ({ siteTitle = '', siteDescription = '', menuLinks = [] }) => (
  <header className="site-header">
    <div className="header-inner">
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
      <h1 style={{ margin: 0 }}>
        <Link to="/" className="site-title-link">
          <div className="site-title">{siteTitle}</div>
        </Link>
      </h1>
      <h2 className="site-description">{siteDescription}</h2>
    </div>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
  siteDescription: PropTypes.string,
  menuLinks: PropTypes.array,
}

export default Header
