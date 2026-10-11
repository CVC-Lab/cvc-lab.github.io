import * as React from 'react'
import Layout from '../components/layout'
import Seo from '../components/seo'
import NewsTiles, { categoryGateScript } from '../components/news_tiles'
import newsTiles from '../data/site/news'

const NewsPage = ({ location }) => (
  <Layout>
    <NewsTiles
      newsTiles={newsTiles}
      locationSearch={location?.search || ''}
      locationKey={location?.key}
    />
  </Layout>
)

export default NewsPage

export const Head = ({ location }) => (
  <>
    <Seo
      title="News"
      description="News, announcements and seminars from the Computational Visualization Center"
      pathname={location.pathname}
    />
    <script dangerouslySetInnerHTML={{ __html: categoryGateScript }} />
  </>
)
