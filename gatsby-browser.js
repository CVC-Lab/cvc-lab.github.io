// Latin subset only: the all-subsets files declare nine @font-face rules per weight
// (cyrillic, greek, vietnamese, ...) that the site never uses.
import '@fontsource/libre-franklin/latin-300.css'
import '@fontsource/libre-franklin/latin-400.css'
import '@fontsource/libre-franklin/latin-500.css'
import '@fontsource/libre-franklin/latin-600.css'
import '@fontsource/libre-franklin/latin-700.css'
import './src/styles/global.css'
import React from 'react'
import { PasswordProvider, ProtectedRoute } from './src/components/password-protect/PasswordContext'
import { SiteProvider } from './src/context/SiteContext'

// Wrap the app with the password provider and site provider
export const wrapRootElement = ({ element }) => {
  return (
    <PasswordProvider>
      <SiteProvider>{element}</SiteProvider>
    </PasswordProvider>
  )
}

// Wrap the page element with the protected route
export const wrapPageElement = ({ element, props }) => {
  return <ProtectedRoute {...props}>{element}</ProtectedRoute>
}

// New navigations start at the top; hash links scroll to their anchor; browser
// back/forward restore the position Gatsby saved for that history entry.
export const shouldUpdateScroll = ({ routerProps: { location }, getSavedScrollPosition }) => {
  if (location.hash) return true
  return getSavedScrollPosition(location) || [0, 0]
}
