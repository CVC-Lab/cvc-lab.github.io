import * as React from 'react'
import PropTypes from 'prop-types'
import { useSiteMetadata } from '../context/SiteContext'

import Header from './header'
import Footer from './footer'
import './layout.css'

const Layout = ({ children, headerVariant = 'default' }) => {
  const { title, menuLinks } = useSiteMetadata()

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header menuLinks={menuLinks} siteTitle={title} variant={headerVariant} />
      <div>
        <main id="main-content" tabIndex={-1} style={{ minHeight: '90vh' }}>
          {children}
        </main>
      </div>
      <Footer />
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  headerVariant: PropTypes.oneOf(['default', 'compact', 'nav-only']),
}

export default Layout
