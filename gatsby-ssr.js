import React from 'react'
import { PasswordProvider, ProtectedRoute } from './src/components/password-protect/PasswordContext'
import { SiteProvider } from './src/context/SiteContext'

// Every route gets a language attribute, including pages that export no Head.
export const onRenderBody = ({ setHtmlAttributes }) => {
  setHtmlAttributes({ lang: 'en' })
}

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
