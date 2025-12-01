import * as React from 'react'
import { Helmet } from 'react-helmet'
import { useSiteMetadata } from '../context/SiteContext'
import Layout from '../components/layout'
import Tiles from '../components/tiles'
import favicon from '../favicons/favicon.png'

const ProjectsPage = () => {
  const { projectTiles } = useSiteMetadata()

  return (
    <Layout>
      <Helmet>
        <title>Projects | CVC Lab</title>
        <meta name="icon" href={favicon} />
        <meta
          name="description"
          content="Research projects at the Computational Visualization Center"
        />
      </Helmet>

      <Tiles projectTiles={projectTiles || []} showAllProjects />
    </Layout>
  )
}

export default ProjectsPage
