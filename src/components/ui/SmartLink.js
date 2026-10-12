import * as React from 'react'
import PropTypes from 'prop-types'
import { Link, withPrefix } from 'gatsby'

const SITE_ORIGIN = /^https?:\/\/cvc-lab\.github\.io(?=[/?#]|$)/i

// Served from static/ as plain files: the Gatsby router has no page-data for them.
// A microsite listed here is also listed in gatsby-node.js (STATIC_MICROSITES) and,
// when it should be indexed, in gatsby-config.js (STATIC_SITEMAP_PATHS).
export const STATIC_PREFIXES = [
  '/projects/pd-research-companion/',
  '/projects/posterior-aware-pd-phenotyping-miccai/',
  '/papers/',
  '/media/',
  '/static/',
]

// Other GitHub Pages projects served from the same origin: not routes of this site.
const SIBLING_SITES = ['/afc-website/']

const splitPath = to => {
  const match = /^([^?#]*)(.*)$/.exec(to)
  return [match[1], match[2]]
}

const isSitePath = path => path.startsWith('/') && !path.startsWith('//')

const hasFileExtension = path => /\.[a-z0-9]{2,5}$/i.test(path)

const isUnder = (to, prefixes) => {
  const [path] = splitPath(to)
  const directory = path.endsWith('/') ? path : `${path}/`
  return prefixes.some(prefix => directory.startsWith(prefix))
}

/** Adds the trailing slash a site path needs, in front of any ?query or #hash. */
export const withTrailingSlash = to => {
  const [path, rest] = splitPath(to)
  if (!isSitePath(path) || path.endsWith('/') || hasFileExtension(path)) return to
  return `${path}/${rest}`
}

/** True when a site path is a file or a static microsite rather than a Gatsby route. */
export const isStaticPath = to =>
  hasFileExtension(splitPath(to)[0]) || isUnder(to, STATIC_PREFIXES) || isUnder(to, SIBLING_SITES)

/**
 * kind: 'internal' (Gatsby route, trailing slash added), 'static' (file or
 * microsite under static/), 'external' (other origin, mailto:, tel:) or
 * 'anchor' (same-page #hash, ?query or a relative path, passed through).
 * An absolute URL on this site's own origin is reduced to its path first.
 */
export const resolveLink = to => {
  const raw = to === undefined || to === null ? '' : String(to).trim()
  const origin = SITE_ORIGIN.exec(raw)
  const rest = origin ? raw.slice(origin[0].length) : raw
  const local = origin && !rest.startsWith('/') ? `/${rest}` : rest
  if (origin && isUnder(local, SIBLING_SITES)) return { kind: 'external', href: raw }
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(local)) return { kind: 'external', href: local }
  if (!isSitePath(local)) return { kind: 'anchor', href: local }
  return { kind: isStaticPath(local) ? 'static' : 'internal', href: withTrailingSlash(local) }
}

// A rel passed by the caller is kept, but can never remove these two.
const safeRel = rel =>
  [...new Set(['noopener', 'noreferrer', ...(rel ? rel.split(/\s+/) : [])])]
    .filter(Boolean)
    .join(' ')

const SmartLink = ({
  to,
  newTab,
  target,
  rel,
  activeClassName,
  partiallyActive,
  state,
  replace,
  children,
  ...rest
}) => {
  const { kind, href } = resolveLink(to)
  const isWebLink = kind === 'external' && /^(?:https?:)?\/\//i.test(href)
  const opensNewTab = target === '_blank' || (newTab === undefined ? isWebLink : newTab)

  if (kind === 'internal' && !opensNewTab) {
    return (
      <Link
        to={href}
        target={target}
        rel={rel}
        activeClassName={activeClassName}
        partiallyActive={partiallyActive}
        state={state}
        replace={replace}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  const url = kind === 'internal' || kind === 'static' ? withPrefix(href) : href

  if (opensNewTab) {
    return (
      // eslint-disable-next-line react/jsx-no-target-blank -- safeRel() always includes both tokens
      <a href={url} target="_blank" rel={safeRel(rel)} {...rest}>
        {children}
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <a href={url} target={target} rel={kind === 'external' ? safeRel(rel) : rel} {...rest}>
      {children}
    </a>
  )
}

SmartLink.propTypes = {
  to: PropTypes.string.isRequired,
  newTab: PropTypes.bool,
  target: PropTypes.string,
  rel: PropTypes.string,
  activeClassName: PropTypes.string,
  partiallyActive: PropTypes.bool,
  state: PropTypes.object,
  replace: PropTypes.bool,
  children: PropTypes.node,
}

export default SmartLink
