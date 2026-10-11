// Manual mock for the `gatsby` module. Jest picks it up automatically because it sits next to
// node_modules. It provides only what src/ imports from gatsby.
const React = require('react')

const ROUTER_ONLY_PROPS = [
  'activeClassName',
  'activeStyle',
  'partiallyActive',
  'replace',
  'state',
  'getProps',
]

const Link = React.forwardRef(({ to, ...props }, ref) => {
  const rest = Object.fromEntries(
    Object.entries(props).filter(([name]) => !ROUTER_ONLY_PROPS.includes(name))
  )
  return React.createElement('a', { ...rest, href: to, ref })
})
Link.displayName = 'Link'

module.exports = {
  Link,
  navigate: jest.fn(),
  withPrefix: path => path,
  graphql: jest.fn(),
  useStaticQuery: jest.fn(),
}
