import React from 'react'
import franklin400 from '@fontsource/libre-franklin/files/libre-franklin-latin-400-normal.woff2'
import franklin700 from '@fontsource/libre-franklin/files/libre-franklin-latin-700-normal.woff2'
import franklin800 from '@fontsource/libre-franklin/files/libre-franklin-latin-800-normal.woff2'
import { PasswordProvider, ProtectedRoute } from './src/components/password-protect/PasswordContext'

// Every route gets a language attribute, including pages that export no Head. The two faces
// that carry body text and headings are preloaded; the URLs are the ones the stylesheet uses.
// The tri-modal pages set their hero title in the 800 face, which on a phone (their 640px
// layout) would otherwise arrive late enough to re-wrap it. Wider screens do not need it, and
// at 768px the third download delays the 700 face enough to re-wrap a note on the audit page.
export const onRenderBody = ({ pathname, setHtmlAttributes, setHeadComponents }) => {
  setHtmlAttributes({ lang: 'en' })
  const faces = [{ href: franklin400 }, { href: franklin700 }]
  if (pathname && pathname.startsWith('/projects/tri-modal-')) {
    faces.push({ href: franklin800, media: '(max-width: 640px)' })
  }
  setHeadComponents(
    faces.map(({ href, media }) => (
      <link
        key={href}
        rel="preload"
        as="font"
        type="font/woff2"
        href={href}
        media={media}
        crossOrigin="anonymous"
      />
    ))
  )
}

// A markdown page with math preloads two KaTeX faces from its Head, which Gatsby places after the
// inlined stylesheet (about 30 KB compressed). The main face sets most of each formula, so its
// arrival after the first layout re-wraps the paragraphs around inline math; its preload moves
// ahead of the stylesheet to be requested with the first bytes of the page. The italic face
// keeps its place, so the two do not split the bandwidth.
const isKatexMainPreload = element =>
  element &&
  element.type === 'link' &&
  element.props.rel === 'preload' &&
  /\/KaTeX_Main-Regular[-.]/.test(element.props.href || '')

export const onPreRenderHTML = ({ getHeadComponents, replaceHeadComponents }) => {
  const head = getHeadComponents()
  const early = head.filter(isKatexMainPreload)
  if (!early.length) return
  const rest = head.filter(element => !isKatexMainPreload(element))
  const firstStyle = rest.findIndex(element => element && element.type === 'style')
  rest.splice(firstStyle < 0 ? rest.length : firstStyle, 0, ...early)
  replaceHeadComponents(rest)
}

// Wrap the app with the password provider
export const wrapRootElement = ({ element }) => {
  return <PasswordProvider>{element}</PasswordProvider>
}

// Wrap the page element with the protected route
export const wrapPageElement = ({ element, props }) => {
  return <ProtectedRoute {...props}>{element}</ProtectedRoute>
}
