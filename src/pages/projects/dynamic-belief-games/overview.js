import * as React from 'react'
import PropTypes from 'prop-types'
import Layout from '../../../components/layout'
import Seo from '../../../components/seo'
import DbgMicrosite from '../../../components/dbg/DbgMicrosite'

const DynamicBeliefGamesOverviewPage = () => (
  <Layout>
    <DbgMicrosite />
  </Layout>
)

export default DynamicBeliefGamesOverviewPage

export const Head = ({ location }) => (
  <Seo
    pathname={location.pathname}
    title="Dynamic Belief Games Overview"
    description="Overview of Dynamic Belief Games: PIN agents, DBG Gym, RF-grounded validation, demonstrated capability, team, and project resources."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
