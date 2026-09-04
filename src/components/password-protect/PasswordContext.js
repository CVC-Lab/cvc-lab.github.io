import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'
import PropTypes from 'prop-types'
import Cookies from 'js-cookie'
import { navigate } from 'gatsby'

// SECURITY NOTE: This is a basic password protection mechanism suitable only
// for low-security content. For production applications requiring real security,
// implement proper authentication with:
// - Server-side authentication
// - Secure token-based auth (JWT)
// - OAuth/SAML integration
// - Proper session management
// Current implementation stores passwords in plain text in cookies.

const COOKIE_NAME = 'password-protect'
export const PENDING_REDIRECT_KEY = 'password-protect-redirect'
const PASSWORD = process.env.GATSBY_INTERNAL_LINKS_PASSWORD
const normalizePassword = value => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const configuredPassword = normalizePassword(PASSWORD)
const hasConfiguredPassword = configuredPassword.length > 0
const DBG_INTERNAL_PASSWORD = 'dbg2026'
export const normalizeRoutePath = value =>
  typeof value === 'string' ? value.replace(/\/+$/, '') || '/' : '/'
const isDbgInternalPage = pathname =>
  normalizeRoutePath(pathname).startsWith('/projects/dynamic-belief-games/internal')
export const getRoutePasswordForPath = pathname =>
  isDbgInternalPage(pathname) ? DBG_INTERNAL_PASSWORD : undefined

// Create context
const PasswordContext = createContext()

// Provider component
export const PasswordProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [transientPath, setTransientPath] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only trust a stored password when a real password is configured.
    const storedPassword = Cookies.get(COOKIE_NAME)
    if (hasConfiguredPassword && normalizePassword(storedPassword) === configuredPassword) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((passwordCandidate, options = {}) => {
    const allowEmptyPassword = Boolean(options.allowEmptyPassword)
    const routePassword = normalizePassword(options.routePassword)
    const normalizedCandidate = normalizePassword(passwordCandidate)
    const hasRoutePassword = routePassword.length > 0
    const routePasswordMatches = routePassword.length > 0 && normalizedCandidate === routePassword
    const configuredPasswordMatches =
      hasConfiguredPassword && normalizedCandidate === configuredPassword
    const canAuthenticate =
      allowEmptyPassword ||
      routePasswordMatches ||
      (!hasRoutePassword && (!hasConfiguredPassword || configuredPasswordMatches))

    if (canAuthenticate) {
      if (configuredPasswordMatches && !routePasswordMatches && !allowEmptyPassword) {
        Cookies.set(COOKIE_NAME, configuredPassword)
      }
      setTransientPath(options.transientPath ? normalizeRoutePath(options.transientPath) : null)
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    Cookies.remove(COOKIE_NAME)
    setTransientPath(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <PasswordContext.Provider value={{ isAuthenticated, isLoading, login, logout, transientPath }}>
      {children}
    </PasswordContext.Provider>
  )
}

PasswordProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// Custom hook to use the password context
export const usePassword = () => {
  const context = useContext(PasswordContext)
  if (!context) {
    throw new Error('usePassword must be used within a PasswordProvider')
  }
  return context
}

// Helper function to check if a page is protected
export const isProtectedPage = (pathname, pagePaths, partialMatching = false) => {
  const normalizedPathname = normalizeRoutePath(pathname)
  const isProtected = pagePaths.find(path => {
    const normalizedPath = normalizeRoutePath(path)
    const isIndexPage = normalizedPathname === '/'

    if (partialMatching && !isIndexPage) {
      return (
        normalizedPathname === normalizedPath || normalizedPathname.startsWith(`${normalizedPath}/`)
      )
    }

    return normalizedPath === normalizedPathname
  })

  return Boolean(isProtected)
}

// Protected route component
export const ProtectedRoute = ({
  children,
  location,
  pagePaths = [
    '/internal',
    '/internal/',
    '/cvc-website/internal',
    '/cvc-website/internal/',
    '/projects/dynamic-belief-games/internal',
    '/projects/dynamic-belief-games/internal/',
  ],
  partialMatching = true,
}) => {
  const { isAuthenticated, isLoading, logout, transientPath } = usePassword()
  const pathname = location.pathname
  const isProtected = isProtectedPage(pathname, pagePaths, partialMatching)
  const dbgInternalPage = isDbgInternalPage(pathname)
  const hasRouteAccess =
    isAuthenticated &&
    (!dbgInternalPage || normalizeRoutePath(transientPath) === normalizeRoutePath(pathname))

  useEffect(() => {
    const normalizedPathname = normalizeRoutePath(pathname)
    if (
      !isLoading &&
      !isProtected &&
      normalizedPathname !== '/password-protect' &&
      isAuthenticated
    ) {
      logout()
    }
  }, [isAuthenticated, isLoading, isProtected, logout, pathname])

  const shouldRedirectToPassword = !isLoading && isProtected && !hasRouteAccess

  useEffect(() => {
    if (!shouldRedirectToPassword) return

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(PENDING_REDIRECT_KEY, pathname)
    }

    navigate('/password-protect', {
      state: {
        redirectTo: pathname,
        routePassword: getRoutePasswordForPath(pathname),
      },
    })
  }, [pathname, shouldRedirectToPassword])

  // Only a protected route has to wait for the cookie check. Blocking every
  // route on it made each page server-render as the loading shell, because
  // isLoading is cleared from an effect that never runs during SSR.
  if (isLoading && isProtected) {
    return <div>Loading...</div>
  }

  if (shouldRedirectToPassword) {
    return null
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
  pagePaths: PropTypes.arrayOf(PropTypes.string),
  partialMatching: PropTypes.bool,
}

export default PasswordContext
