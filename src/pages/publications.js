import * as React from 'react'
import { graphql, useStaticQuery } from 'gatsby'

import Layout from '../components/layout'
import PublicationTable from '../components/publication_table'

const PublicationsPage = () => {
  const data = useStaticQuery(graphql`
    query CsvQuery {
      allPapersCsv {
        nodes {
          Title
          Location
          PublicationType
          PublishedDateMonth
          PublishedDateYear
          PDFLink
          LocalPDFLink
          Abstract
          RegisterDate
          Authors
          sortOrder
          ProjectLink
          OtherAuthors
        }
      }
    }
  `)

  return (
    <Layout>
      <PublicationTable
        id="publications"
        publicationData={data.allPapersCsv.nodes}
      ></PublicationTable>
    </Layout>
  )
}

export default PublicationsPage
