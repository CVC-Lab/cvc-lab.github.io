import * as React from 'react'
import PropTypes from 'prop-types'
import { useSiteMetadata } from '../context/SiteContext'
import Layout from '../components/layout'
import Tiles from '../components/tiles'
import Seo from '../components/seo'

const ProjectsPage = ({ location }) => {
  const { projectTiles } = useSiteMetadata()

  return (
    <Layout>
      <Tiles
        projectTiles={projectTiles || []}
        showAllProjects
        locationSearch={location?.search || ''}
      />
    </Layout>
  )
}

ProjectsPage.propTypes = {
  location: PropTypes.shape({ search: PropTypes.string }),
}

export default ProjectsPage

export const Head = ({ location }) => (
  <Seo
    title="Projects"
    description="Research projects at the Computational Visualization Center"
    pathname={location.pathname}
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
