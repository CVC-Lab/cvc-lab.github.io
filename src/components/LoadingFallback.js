import * as React from 'react'

/**
 * LoadingFallback component used as a placeholder while lazy-loaded components are being loaded
 */
const LoadingFallback = () => (
  <div
    style={{
      padding: '20px',
      textAlign: 'center',
      color: '#333f48',
      minHeight: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    Loading...
  </div>
)

export default LoadingFallback
