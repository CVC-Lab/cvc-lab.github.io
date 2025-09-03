import * as React from 'react'
import { Suspense, lazy } from 'react'
import { useSiteMetadata } from '../context/SiteContext'

import Layout from '../components/layout'
import LoadingFallback from '../components/LoadingFallback'

// Lazy load component
const NewsTiles = lazy(() => import('../components/news_tiles'))

const ErrorFallback = () => (
  <div
    style={{
      padding: '2rem',
      textAlign: 'center',
      color: '#333f48',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <h2>Unable to load news data</h2>
    <p style={{ maxWidth: '600px', margin: '1rem auto' }}>
      We&apos;re experiencing a technical issue loading the news content. Please try refreshing the
      page or check back later.
    </p>
  </div>
)

const NewsPage = () => {
  // Get site metadata with error handling
  let newsTiles = []
  let hasError = false

  try {
    const siteMetadata = useSiteMetadata()
    newsTiles = siteMetadata.newsTiles || []
    hasError = siteMetadata.hasError
  } catch {
    hasError = true
  }

  return (
    <Layout>
      {hasError ? (
        <ErrorFallback />
      ) : (
        <Suspense fallback={<LoadingFallback />}>
          <NewsTiles id="news" newsTiles={newsTiles} />
        </Suspense>
      )}
    </Layout>
  )
}

export default NewsPage
