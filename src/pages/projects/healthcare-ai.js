import * as React from 'react'
import PropTypes from 'prop-types'
import { Link, navigate } from 'gatsby'
import Layout from '../../components/layout'
import { AI4PD_BASE } from '../../components/ai4pd/links'

// The Parkinson's program moved to /projects/ai4pd/. GitHub Pages has no server-side
// redirects, so this page forwards visitors and tells crawlers the canonical address.
const TARGET = `${AI4PD_BASE}/`

const HealthcareAiRedirect = () => {
  React.useEffect(() => {
    navigate(TARGET, { replace: true })
  }, [])

  return (
    <Layout headerVariant="compact">
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

export const Head = () => (
  <>
    <title>Moved: AI4PD | Computational Visualization Center</title>
    <meta httpEquiv="refresh" content={`0;url=${TARGET}`} />
    <link rel="canonical" href={`https://cvc-lab.github.io${TARGET}`} />
    <meta name="robots" content="noindex, follow" />
  </>
)

HealthcareAiRedirect.propTypes = {}
Head.propTypes = { location: PropTypes.object }
