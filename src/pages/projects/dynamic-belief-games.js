import * as React from 'react'
import PropTypes from 'prop-types'
import Layout from '../../components/layout'
import Seo from '../../components/seo'
import DbgProjectHome from '../../components/dbg/DbgProjectHome'

const DynamicBeliefGamesPage = () => (
  <Layout headerVariant="compact">
    <DbgProjectHome />
  </Layout>
)

export default DynamicBeliefGamesPage

export const Head = ({ location }) => (
  <Seo
    pathname={location.pathname}
    title="Dynamic Belief Games"
    description="Dynamic Belief Games trains intelligent networking agents in a digital twin for contested mobile ad hoc networks."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
