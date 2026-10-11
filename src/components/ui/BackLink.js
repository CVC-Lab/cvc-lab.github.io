import * as React from 'react'
import PropTypes from 'prop-types'
import SmartLink from './SmartLink'
import './BackLink.css'

const BackLink = ({ to, className = '', children }) => (
  <SmartLink to={to} className={`back-link ${className}`.trim()}>
    <span className="back-link__arrow" aria-hidden="true">
      ←
    </span>
    <span className="back-link__label">{children}</span>
  </SmartLink>
)

BackLink.propTypes = {
  to: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export default BackLink
