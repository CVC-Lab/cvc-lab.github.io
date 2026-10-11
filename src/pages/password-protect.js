import React from 'react'
import Layout from '../components/layout'
import PasswordProtect from '../components/password-protect/PasswordProtect'
import Seo from '../components/seo'

const PasswordProtectPage = ({ location }) => (
  <Layout headerVariant="compact">
    <PasswordProtect location={location} />
  </Layout>
)

export default PasswordProtectPage

export const Head = () => (
  <Seo title="Sign in" meta={[{ name: 'robots', content: 'noindex, nofollow' }]} />
)
