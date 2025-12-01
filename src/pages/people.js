import * as React from 'react'
import { Helmet } from 'react-helmet'
import { useSiteMetadata } from '../context/SiteContext'
import Layout from '../components/layout'
import Cards from '../components/cards'
import favicon from '../favicons/favicon.png'

const PeoplePage = () => {
  const { peopleCards } = useSiteMetadata()

  return (
    <Layout>
      <Helmet>
        <title>People | CVC Lab</title>
        <meta name="icon" href={favicon} />
        <meta name="description" content="Team members at the Computational Visualization Center" />
      </Helmet>

      <Cards peopleCards={peopleCards || []} />
    </Layout>
  )
}

export default PeoplePage
