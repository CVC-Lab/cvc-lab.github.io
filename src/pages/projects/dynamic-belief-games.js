import * as React from 'react'
import Layout from '../../components/layout'
import Seo from '../../components/seo'
import DbgProjectHome from '../../components/dbg/DbgProjectHome'

const DynamicBeliefGamesPage = () => (
  <Layout headerVariant="compact">
    <DbgProjectHome />
  </Layout>
)

export default DynamicBeliefGamesPage

export const Head = () => (
  <Seo
    title="Dynamic Belief Games"
    description="Dynamic Belief Games trains intelligent networking agents in a digital twin for contested mobile ad hoc networks."
  />
)
