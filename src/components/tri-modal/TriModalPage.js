import * as React from 'react'
import PropTypes from 'prop-types'
import { navigate } from 'gatsby'
import Layout from '../layout'
import BackLink from '../ui/BackLink'
import { resolveLink } from '../ui/SmartLink'
import 'katex/dist/katex.min.css'
import './tri-modal.css'

// Without scripts the chart cannot draw and the tabs cannot switch: drop both and show every panel.
const NO_SCRIPT_CSS =
  '.trimod-page .anim-panel,.trimod-page .anim-caption,.trimod-page .sde-tabs .ui-tabs{display:none}' +
  '.trimod-page .tab-panel[hidden]{display:block !important}'

// Rendered width of a .fig-wrap image (the .content column in tri-modal.css), for srcset.
export const figureSizes =
  '(max-width: 640px) calc(100vw - 2rem), (max-width: 860px) calc(100vw - 3rem), 812px'

const SCROLLERS = '.table-wrap, .katex-display'

const TriModalPage = ({ children }) => {
  const pageRef = React.useRef(null)

  // The article body is an HTML string, so its links are plain anchors. Hand the
  // ones that point at Gatsby routes to the router instead of reloading the document.
  React.useEffect(() => {
    const page = pageRef.current
    const handleClick = event => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target.closest('a[href]')
      if (!anchor || anchor.target) return
      const { kind, href } = resolveLink(anchor.getAttribute('href'))
      if (kind !== 'internal') return
      event.preventDefault()
      navigate(href)
    }
    page.addEventListener('click', handleClick)
    return () => page.removeEventListener('click', handleClick)
  }, [])

  // A table or equation that scrolls sideways becomes a tab stop while it overflows, so
  // keyboard users can scroll it (Safari does not do this on its own).
  React.useEffect(() => {
    const scrollers = Array.from(pageRef.current.querySelectorAll(SCROLLERS))
    const markScrollers = () =>
      scrollers.forEach(el => {
        if (el.scrollWidth > el.clientWidth + 1) el.setAttribute('tabindex', '0')
        else el.removeAttribute('tabindex')
      })
    let observer = null
    if (window.ResizeObserver) {
      observer = new window.ResizeObserver(markScrollers)
      scrollers.forEach(el => {
        observer.observe(el)
        if (el.firstElementChild) observer.observe(el.firstElementChild)
      })
    } else {
      markScrollers()
    }
    let active = true
    if (document.fonts) document.fonts.ready.then(() => active && markScrollers())
    return () => {
      active = false
      if (observer) observer.disconnect()
    }
  }, [])

  return (
    <Layout headerVariant="compact">
      <article className="trimod-page" ref={pageRef}>
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: NO_SCRIPT_CSS }} />
        </noscript>
        <div className="back">
          <BackLink to="/projects/">Back to Projects</BackLink>
        </div>
        {children}
      </article>
    </Layout>
  )
}

TriModalPage.propTypes = {
  children: PropTypes.node.isRequired,
}

export default TriModalPage
