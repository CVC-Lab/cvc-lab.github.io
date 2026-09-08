import * as React from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/layout'
import Seo from '../components/seo'
import { useSiteMetadata } from '../context/SiteContext'
import FeaturedResearch from '../components/FeaturedResearch'
import QuickStats from '../components/QuickStats'
import AboutCondensed from '../components/AboutCondensed'
import PeopleCondensed from '../components/PeopleCondensed'

const OldHomePage = () => {
  const { projectTiles, peopleCards } = useSiteMetadata()

  const projectCount = projectTiles?.length || 0
  const currentMemberCount =
    peopleCards?.filter(p => p.status === 'current' || p.status === true || p.Current === true)
      .length || 0

  return (
    <Layout>
      <FeaturedResearch projectTiles={projectTiles || []} />
      <QuickStats projectCount={projectCount} memberCount={currentMemberCount} />
      <AboutCondensed />
      <PeopleCondensed peopleCards={peopleCards || []} />
    </Layout>
  )
}

export default OldHomePage

export const Head = ({ location }) => (
  <Seo
    pathname={location.pathname}
    title="Previous Home"
    description="Archived previous homepage for the Computational Visualization Center."
    meta={[{ name: 'robots', content: 'noindex, nofollow' }]}
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
