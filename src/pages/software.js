import * as React from 'react'
import PropTypes from 'prop-types'
import { Suspense, lazy } from 'react'
import { useSiteMetadata } from '../context/SiteContext'
import Layout from '../components/layout'
import Seo from '../components/seo'
import LoadingFallback from '../components/LoadingFallback'

// Lazy load component
const SoftwareList = lazy(() => import('../components/software_list'))

const SoftwarePage = () => {
  const { softwareProjects } = useSiteMetadata()

  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>
        <SoftwareList softwareProjects={softwareProjects} />
      </Suspense>
    </Layout>
  )
}

export default SoftwarePage

export const Head = ({ location }) => (
  <Seo
    title="Software"
    description="Software released by the Computational Visualization Center"
    pathname={location.pathname}
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
