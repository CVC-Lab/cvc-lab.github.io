import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { navigate } from 'gatsby'
import './password-gate.css'

// This gate is a convenience screen, not access control. The site is static and
// public: gated page content ships in page-data JSON and JS chunks, and both
// passwords can be read from the client bundle. Nothing sensitive may rely on it.

export const GATE_PATH = '/password-protect/'
export const DEFAULT_GATED_PATH = '/internal/'
export const PENDING_REDIRECT_KEY = 'password-protect-redirect'
const UNLOCKED_KEY = 'password-protect-unlocked'
const DBG_INTERNAL_PATH = '/projects/dynamic-belief-games/internal'
export const PROTECTED_PATHS = ['/internal', DBG_INTERNAL_PATH]
const DBG_INTERNAL_PASSWORD = 'dbg2026'

const normalizePassword = value => (typeof value === 'string' ? value.trim().toLowerCase() : '')
// An unset or empty password never matches anything, so the gate fails closed.
const EXPECTED_PASSWORDS = {
  site: normalizePassword(process.env.GATSBY_INTERNAL_LINKS_PASSWORD),
  dbg: normalizePassword(DBG_INTERNAL_PASSWORD),
}

export const normalizeRoutePath = value =>
  typeof value === 'string' ? value.replace(/\/+$/, '') || '/' : '/'
const isUnder = (pathname, base) => pathname === base || pathname.startsWith(`${base}/`)

export const isProtectedPath = pathname => {
  const normalized = normalizeRoutePath(pathname)
  return PROTECTED_PATHS.some(base => isUnder(normalized, base))
}

export const getGateScope = pathname => {
  const normalized = normalizeRoutePath(pathname)
  if (isUnder(normalized, DBG_INTERNAL_PATH)) return 'dbg'
  return isProtectedPath(normalized) ? 'site' : null
}

// sessionStorage throws when storage is blocked and does not exist during SSR.
export const gateStorage = {
  get: key => {
    try {
      return window.sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key, value) => {
    try {
      window.sessionStorage.setItem(key, value)
    } catch {
      // The unlock then lasts until the next page load.
    }
  },
  remove: key => {
    try {
      window.sessionStorage.removeItem(key)
    } catch {
      // Nothing was stored.
    }
  },
}

const LOCKED = { site: false, dbgPath: null }
const PasswordContext = createContext()

export const PasswordProvider = ({ children }) => {
  const [access, setAccess] = useState(LOCKED)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Read in an effect so the server-rendered shell and the first client render match.
    if (EXPECTED_PASSWORDS.site && gateStorage.get(UNLOCKED_KEY) === 'site') {
      setAccess(current => ({ ...current, site: true }))
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((candidate, targetPath) => {
    const scope = getGateScope(targetPath)
    const expected = scope ? EXPECTED_PASSWORDS[scope] : ''
    if (!expected || normalizePassword(candidate) !== expected) return false

    if (scope === 'site') {
      // A flag, never the password.
      gateStorage.set(UNLOCKED_KEY, 'site')
      setAccess(current => ({ ...current, site: true }))
    } else {
      setAccess(current => ({ ...current, dbgPath: normalizeRoutePath(targetPath) }))
    }
    return true
  }, [])

  const logout = useCallback(() => {
    gateStorage.remove(UNLOCKED_KEY)
    setAccess(LOCKED)
  }, [])

  const hasAccess = useCallback(
    pathname => {
      const scope = getGateScope(pathname)
      if (!scope) return true
      return scope === 'site' ? access.site : access.dbgPath === normalizeRoutePath(pathname)
    },
    [access]
  )

  const value = useMemo(
    () => ({
      isAuthenticated: access.site || Boolean(access.dbgPath),
      isLoading,
      hasAccess,
      login,
      logout,
    }),
    [access, isLoading, hasAccess, login, logout]
  )

  return <PasswordContext.Provider value={value}>{children}</PasswordContext.Provider>
}

PasswordProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const usePassword = () => {
  const context = useContext(PasswordContext)
  if (!context) {
    throw new Error('usePassword must be used within a PasswordProvider')
  }
  return context
}

// Without JavaScript the status never resolves, so the notice replaces it.
const GateStatus = () => (
  <div className="password-gate-status">
    <p className="password-gate-status__loading" role="status">
      Loading...
    </p>
    <noscript>
      <style>{'.password-gate-status__loading{display:none}'}</style>
      <p>
        This page needs JavaScript. <a href="/">Go to the CVC home page</a>
      </p>
    </noscript>
  </div>
)

// For an unknown URL Gatsby renders its 404 page (the dev 404 page in development) under
// that URL. It has nothing to gate, and its server HTML is the 404 page.
const NOT_FOUND_PAGE = /^\/(404|dev-404-page)(\/|\.html)?$/

export const ProtectedRoute = ({ children, location, pageResources }) => {
  const { isAuthenticated, isLoading, hasAccess, logout } = usePassword()
  const pathname = location.pathname
  const isNotFound = NOT_FOUND_PAGE.test(pageResources?.page?.path ?? '')
  const isProtected = !isNotFound && isProtectedPath(pathname)
  const isGate = normalizeRoutePath(pathname) === normalizeRoutePath(GATE_PATH)

  // Leaving the gated pages locks them again.
  useEffect(() => {
    if (!isLoading && !isProtected && !isGate && isAuthenticated) {
      logout()
    }
  }, [isAuthenticated, isGate, isLoading, isProtected, logout])

  const shouldRedirectToPassword = !isLoading && isProtected && !hasAccess(pathname)

  useEffect(() => {
    if (!shouldRedirectToPassword) return

    gateStorage.set(PENDING_REDIRECT_KEY, pathname)
    navigate(GATE_PATH, { replace: true, state: { redirectTo: pathname } })
  }, [pathname, shouldRedirectToPassword])

  // Only a protected route has to wait for the stored-flag check. Blocking every
  // route on it made each page server-render as the loading shell, because
  // isLoading is cleared from an effect that never runs during SSR.
  if (isProtected && (isLoading || shouldRedirectToPassword)) {
    return <GateStatus />
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
  // Browser only; the server render has no pageResources and keeps the gate.
  pageResources: PropTypes.shape({
    page: PropTypes.shape({ path: PropTypes.string }),
  }),
}

export default PasswordContext
