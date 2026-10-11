import { isProtectedPath, getGateScope } from '../src/components/password-protect/PasswordContext'

// The gate reads GATSBY_INTERNAL_LINKS_PASSWORD when its module loads, so every case loads a
// fresh copy (with its own React and Testing Library) after setting a dummy value.
process.env.RTL_SKIP_AUTO_CLEANUP = 'true'

const SITE_PASSWORD = 'Dummy-Site-Pw'
const UNLOCKED_KEY = 'password-protect-unlocked'
const INTERNAL = '/internal/'
const DBG_PAGE = '/projects/dynamic-belief-games/internal/systems-protocols/'

let rtl

const loadGate = sitePassword => {
  jest.resetModules()
  if (sitePassword === undefined) delete process.env.GATSBY_INTERNAL_LINKS_PASSWORD
  else process.env.GATSBY_INTERNAL_LINKS_PASSWORD = sitePassword
  rtl = require('@testing-library/react')
  return {
    React: require('react'),
    gatsby: require('gatsby'),
    gate: require('../src/components/password-protect/PasswordContext'),
  }
}

// Renders the provider and the route guard for a path and exposes the context value.
const mountRoute = ({ React, gate }, pathname) => {
  let api
  const Probe = () => {
    api = gate.usePassword()
    return null
  }
  const tree = path =>
    React.createElement(
      gate.PasswordProvider,
      null,
      React.createElement(Probe),
      React.createElement(
        gate.ProtectedRoute,
        { location: { pathname: path } },
        React.createElement('div', null, 'PAGE')
      )
    )
  const utils = rtl.render(tree(pathname))
  return { api: () => api, go: path => utils.rerender(tree(path)) }
}

beforeEach(() => {
  window.sessionStorage.clear()
})

afterEach(() => {
  if (rtl) rtl.cleanup()
  delete process.env.GATSBY_INTERNAL_LINKS_PASSWORD
})

describe('gated paths', () => {
  test('/internal/ and the DBG internal pages are gated, everything else is public', () => {
    expect(isProtectedPath('/internal/')).toBe(true)
    expect(isProtectedPath('/internal')).toBe(true)
    expect(isProtectedPath(DBG_PAGE)).toBe(true)
    expect(isProtectedPath('/')).toBe(false)
    expect(isProtectedPath('/projects/')).toBe(false)
    expect(isProtectedPath('/internal-links/')).toBe(false)
    expect(isProtectedPath('/projects/dynamic-belief-games/overview/')).toBe(false)
  })

  test('each gated path belongs to one password scope', () => {
    expect(getGateScope(INTERNAL)).toBe('site')
    expect(getGateScope(DBG_PAGE)).toBe('dbg')
    expect(getGateScope('/people/')).toBeNull()
  })
})

describe('password gate', () => {
  test('fails closed when the site password is unset or blank', () => {
    for (const unset of [undefined, '', '   ']) {
      const modules = loadGate(unset)
      window.sessionStorage.setItem(UNLOCKED_KEY, 'site')
      const route = mountRoute(modules, INTERNAL)
      expect(rtl.screen.queryByText('PAGE')).toBeNull()
      for (const guess of ['', ' ', 'anything', 'undefined']) {
        expect(route.api().login(guess, INTERNAL)).toBe(false)
      }
      expect(route.api().hasAccess(INTERNAL)).toBe(false)
      rtl.cleanup()
    }
  })

  test('a gated route redirects to the gate and passes only redirectTo in history state', () => {
    const modules = loadGate(SITE_PASSWORD)
    mountRoute(modules, DBG_PAGE)
    expect(modules.gatsby.navigate).toHaveBeenCalledTimes(1)
    expect(modules.gatsby.navigate).toHaveBeenCalledWith('/password-protect/', {
      replace: true,
      state: { redirectTo: DBG_PAGE },
    })
  })

  test('the site password opens /internal/ only and stores a flag, never the password', () => {
    const modules = loadGate(SITE_PASSWORD)
    const route = mountRoute(modules, INTERNAL)
    expect(route.api().login('wrong', INTERNAL)).toBe(false)
    expect(route.api().login(SITE_PASSWORD, DBG_PAGE)).toBe(false)
    let unlocked
    rtl.act(() => {
      unlocked = route.api().login('  dummy-site-PW ', INTERNAL)
    })
    expect(unlocked).toBe(true)
    expect(window.sessionStorage.getItem(UNLOCKED_KEY)).toBe('site')
    expect(JSON.stringify({ ...window.sessionStorage }).toLowerCase()).not.toContain(
      SITE_PASSWORD.toLowerCase()
    )
    expect(document.cookie).toBe('')
    expect(route.api().hasAccess(INTERNAL)).toBe(true)
    expect(route.api().hasAccess(DBG_PAGE)).toBe(false)
    expect(rtl.screen.getByText('PAGE')).toBeInTheDocument()
  })

  test('the stored flag survives a reload and leaving the gated pages locks them again', () => {
    const modules = loadGate(SITE_PASSWORD)
    window.sessionStorage.setItem(UNLOCKED_KEY, 'site')
    const route = mountRoute(modules, INTERNAL)
    expect(rtl.screen.getByText('PAGE')).toBeInTheDocument()
    expect(modules.gatsby.navigate).not.toHaveBeenCalled()
    route.go('/password-protect/')
    expect(window.sessionStorage.getItem(UNLOCKED_KEY)).toBe('site')
    route.go('/people/')
    expect(window.sessionStorage.getItem(UNLOCKED_KEY)).toBeNull()
    expect(route.api().hasAccess(INTERNAL)).toBe(false)
  })
})
