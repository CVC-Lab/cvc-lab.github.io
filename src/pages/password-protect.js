import React from 'react'
import PropTypes from 'prop-types'
import PasswordProtect from '../components/password-protect/PasswordProtect'

const PasswordProtectPage = ({ location }) => {
  return <PasswordProtect location={location} />
}

PasswordProtectPage.propTypes = {
  location: PropTypes.object,
}

export default PasswordProtectPage
