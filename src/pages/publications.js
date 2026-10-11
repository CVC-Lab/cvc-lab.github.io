import * as React from 'react'

import Layout from '../components/layout'
import Seo from '../components/seo'
import PublicationTable from '../components/publication_table'

// pageContext.publications: src/data/publications.yaml, read and checked by gatsby-node.js.
const PublicationsPage = ({ pageContext }) => {
  return (
    <Layout>
      <PublicationTable publicationData={pageContext.publications} />
    </Layout>
  )
}

export default PublicationsPage

export const Head = ({ location }) => (
  <Seo
    title="Publications"
    description="Journal articles, conference papers, preprints, books and technical reports from the Computational Visualization Center."
    pathname={location.pathname}
  />
)
