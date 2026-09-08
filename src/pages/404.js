import * as React from 'react'
import Layout from '../components/layout'
import Seo from '../components/seo'

const NotFoundPage = () => (
  <Layout>
    <h1>404: Not Found</h1>
    <p>You just hit a route that doesn&apos;t exist.</p>
  </Layout>
)

export default NotFoundPage

export const Head = () => <Seo title="Page not found" />
