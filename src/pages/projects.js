import * as React from 'react'
import Layout from '../components/layout'
import Tiles, { filterGateScript } from '../components/tiles'
import Seo from '../components/seo'
import projectTiles from '../data/site/projects'

const ProjectsPage = ({ location }) => (
  <Layout>
    <Tiles
      projectTiles={projectTiles}
      locationSearch={location?.search || ''}
      locationKey={location?.key}
    />
  </Layout>
)

export default ProjectsPage

export const Head = ({ location }) => (
  <>
    <Seo
      title="Projects"
      description="Research projects at the Computational Visualization Center"
      pathname={location.pathname}
    />
    <script dangerouslySetInnerHTML={{ __html: filterGateScript }} />
  </>
)
