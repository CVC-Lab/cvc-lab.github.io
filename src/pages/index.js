import * as React from 'react'
import { Helmet } from 'react-helmet'
import { useSiteMetadata } from '../context/SiteContext'

import Layout from '../components/layout'
import favicon from '../favicons/favicon.png'
import FeaturedResearch from '../components/FeaturedResearch'
import QuickStats from '../components/QuickStats'
import AboutCondensed from '../components/AboutCondensed'
import PeopleCondensed from '../components/PeopleCondensed'

const IndexPage = () => {
  const { projectTiles, peopleCards } = useSiteMetadata()

  // Calculate counts for stats
  const projectCount = projectTiles?.length || 0
  const currentMemberCount =
    peopleCards?.filter(p => p.status === 'current' || p.status === true || p.Current === true)
      .length || 0

  return (
    <Layout>
      <Helmet>
        <meta name="icon" href={favicon} />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1.0"
          data-react-helmet="true"
        />
      </Helmet>

      {/* Featured Research Carousel */}
      <FeaturedResearch projectTiles={projectTiles || []} />

      {/* Quick Stats */}
      <QuickStats projectCount={projectCount} memberCount={currentMemberCount} />

      {/* Condensed About Section */}
      <AboutCondensed />

      {/* Condensed People Section */}
      <PeopleCondensed peopleCards={peopleCards || []} />
    </Layout>
  )
}

export default IndexPage
