import React from 'react'
import PropTypes from 'prop-types'
import PasswordProtect from '../components/password-protect/PasswordProtect'
import Seo from '../components/seo'

const PasswordProtectPage = ({ location }) => {
  return <PasswordProtect location={location} />
}

PasswordProtectPage.propTypes = {
  location: PropTypes.object,
}

export default PasswordProtectPage

export const Head = () => (
  <Seo title="Sign in" meta={[{ name: 'robots', content: 'noindex, nofollow' }]} />
)
