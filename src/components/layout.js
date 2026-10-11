import * as React from 'react'
import PropTypes from 'prop-types'
import { useStaticQuery, graphql } from 'gatsby'

import Header from './header'
import Footer from './footer'
import menuLinks from '../data/site/menu'
import './layout.css'

const Layout = ({ children, headerVariant = 'default' }) => {
  const { site } = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header menuLinks={menuLinks} siteTitle={site.siteMetadata.title} variant={headerVariant} />
      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  headerVariant: PropTypes.oneOf(['default', 'compact', 'nav-only']),
}

export default Layout
