import * as React from 'react'
import Layout from '../components/layout'
import Seo from '../components/seo'
import SoftwareList from '../components/software_list'
import softwareProjects from '../data/site/software'

const SoftwarePage = () => (
  <Layout>
    <SoftwareList softwareProjects={softwareProjects} />
  </Layout>
)

export default SoftwarePage

export const Head = ({ location }) => (
  <Seo
    title="Software"
    description="Software released by the Computational Visualization Center"
    pathname={location.pathname}
  />
)
