import * as React from 'react'
import PropTypes from 'prop-types'
import { useSiteMetadata } from '../context/SiteContext'
import Layout from '../components/layout'
import Cards from '../components/cards'
import Seo from '../components/seo'

const PeoplePage = () => {
  const { peopleCards } = useSiteMetadata()

  return (
    <Layout>
      <Cards peopleCards={peopleCards || []} />
    </Layout>
  )
}

export default PeoplePage

export const Head = ({ location }) => (
  <Seo
    title="People"
    description="Team members at the Computational Visualization Center"
    pathname={location.pathname}
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
