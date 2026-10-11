/**
 * @jest-environment node
 */
// Server render of the gate wrappers, as gatsby-ssr.js runs them. Dummy site password only.
const render = (pathname, sitePassword) => {
  jest.resetModules()
  if (sitePassword === undefined) delete process.env.GATSBY_INTERNAL_LINKS_PASSWORD
  else process.env.GATSBY_INTERNAL_LINKS_PASSWORD = sitePassword
  const React = require('react')
  const { renderToString } = require('react-dom/server')
  const gate = require('../src/components/password-protect/PasswordContext')
  return renderToString(
    React.createElement(
      gate.PasswordProvider,
      null,
      React.createElement(
        gate.ProtectedRoute,
        { location: { pathname } },
        React.createElement('div', { id: 'page' }, 'PAGE CONTENT')
      )
    )
  )
}

afterEach(() => {
  delete process.env.GATSBY_INTERNAL_LINKS_PASSWORD
})

test.each(['/internal/', '/projects/dynamic-belief-games/internal/systems-protocols/'])(
  'gated route %s server-renders the status shell with a no-JS notice instead of the page',
  route => {
    const html = render(route, 'dummy')
    expect(html).not.toContain('PAGE CONTENT')
    expect(html).toContain('class="password-gate-status"')
    expect(html).toContain('role="status"')
    expect(html).toMatch(/<noscript>[\s\S]*<a href="\/">Go to the CVC home page<\/a>/)
  }
)

test.each(['/', '/people/', '/password-protect/', '/projects/dynamic-belief-games/overview/'])(
  'public route %s server-renders its content',
  route => {
    const html = render(route, undefined)
    expect(html).toContain('PAGE CONTENT')
    expect(html).not.toContain('password-gate-status')
  }
)
