import * as React from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../../components/layout'
import Seo from '../../components/seo'
import { AI4PD_BASE } from '../../components/ai4pd/links'

// The Parkinson's program moved to /projects/ai4pd/. GitHub Pages has no server-side
// redirects, so this page forwards visitors itself: with scripts through the router, without
// them through a meta refresh. The refresh sits in a <noscript> in the body because the Head
// API escapes <noscript> content, and a refresh that also fires with scripts on cuts off the
// page's own chunk loading.
const TARGET = `${AI4PD_BASE}/`

const HealthcareAiRedirect = () => {
  React.useEffect(() => {
    navigate(TARGET, { replace: true })
  }, [])

  return (
    <Layout headerVariant="compact">
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${TARGET}`} />
      </noscript>
      <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1>This page has moved</h1>
        <p>
          The Parkinson&apos;s program now lives at{' '}
          <Link to={TARGET}>cvc-lab.github.io{TARGET}</Link>.
        </p>
      </div>
    </Layout>
  )
}

export default HealthcareAiRedirect

// noindex: Seo gets no pathname, so it writes no canonical or og:url for this page.
export const Head = () => (
  <Seo title="Moved: AI4PD" meta={[{ name: 'robots', content: 'noindex, follow' }]} />
)
