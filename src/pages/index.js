import * as React from 'react'
import Layout from '../components/layout'
import Seo from '../components/seo'
import ResearchThemesLanding from '../components/home-v2/ResearchThemesLanding'

const IndexPage = () => (
  <Layout headerVariant="nav-only">
    <ResearchThemesLanding />
  </Layout>
)

export default IndexPage

export const Head = () => (
  <Seo
    title="Computational Visualization Center"
    description="Explore CVC research across Healthcare AI, World Models, and AI for Science."
  />
)
