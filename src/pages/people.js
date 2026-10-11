import * as React from 'react'
import Layout from '../components/layout'
import Cards, { alumniGateScript } from '../components/cards'
import Seo from '../components/seo'
import peopleCards from '../data/site/people'

const PeoplePage = ({ location }) => (
  <Layout>
    <Cards peopleCards={peopleCards} locationSearch={location.search} locationKey={location.key} />
  </Layout>
)

export default PeoplePage

export const Head = ({ location }) => (
  <>
    <Seo
      title="People"
      description="Team members at the Computational Visualization Center"
      pathname={location.pathname}
    />
    <script dangerouslySetInnerHTML={{ __html: alumniGateScript }} />
  </>
)
