import * as React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import Layout from '../components/layout'
import Seo from '../components/seo'
import projectTiles from '../data/site/projects'
import peopleCards from '../data/site/people'
import FeaturedResearch from '../components/FeaturedResearch'
import QuickStats from '../components/QuickStats'
import AboutCondensed from '../components/AboutCondensed'
import PeopleCondensed from '../components/PeopleCondensed'

const currentMemberCount = peopleCards.filter(person => person.status === 'current').length

const OldHomePage = () => {
  const { site } = useStaticQuery(graphql`
    query OldHomeTitle {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <Layout>
      <h1 className="visually-hidden">{site.siteMetadata.title}</h1>
      <FeaturedResearch projectTiles={projectTiles} />
      <QuickStats projectCount={projectTiles.length} memberCount={currentMemberCount} />
      <AboutCondensed />
      <PeopleCondensed peopleCards={peopleCards} />
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
