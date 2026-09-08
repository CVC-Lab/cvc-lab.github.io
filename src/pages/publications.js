import * as React from 'react'
import PropTypes from 'prop-types'

import Layout from '../components/layout'
import Seo from '../components/seo'
import PublicationTable from '../components/publication_table'
import publicationData from '../data/papers.json'

const PublicationsPage = () => {
  return (
    <Layout>
      <PublicationTable id="publications" publicationData={publicationData}></PublicationTable>
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

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
