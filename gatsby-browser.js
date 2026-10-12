// Latin subset only: the all-subsets files declare nine @font-face rules per weight
// (cyrillic, greek, vietnamese, ...) that the site never uses.
import '@fontsource/libre-franklin/latin-300.css'
import '@fontsource/libre-franklin/latin-400.css'
import '@fontsource/libre-franklin/latin-400-italic.css'
import '@fontsource/libre-franklin/latin-500.css'
import '@fontsource/libre-franklin/latin-600.css'
import '@fontsource/libre-franklin/latin-700.css'
import '@fontsource/libre-franklin/latin-700-italic.css'
import '@fontsource/libre-franklin/latin-800.css'
import './src/styles/global.css'
import './src/styles/prose.css'

// Gatsby restores scroll itself, from the offset it saves for each history entry under the
// entry's key (sessionStorage "@@scroll|<path>|<key>"). Every entry here has a key in its state
// (see onClientEntry), so a popstate with no state is a new entry made by a # link or a typed
// hash, and any other popstate is Back or Forward.
let shownEntry = null // { pathname, key } of the route on screen
let shownOffset = 0 // its offset, as of the last scroll event
let departure = null // the entry just left by a popstate, and its offset
let traversalHref = null // URL entered by Back or Forward, until its route update

const onPopState = event => {
  // Safari scrolls to a hash itself when it enters an entry, and Chrome, Firefox and Safari
  // scroll to the target of a # link, before the router knows the entry changed: Gatsby then
  // saves the new offset for the entry that was left. The scroll event comes after this one.
  departure = shownEntry && { ...shownEntry, offset: shownOffset }
  if (event.state === null) {
    // A new entry for a hash on this page. Without a key of its own Gatsby would file its
    // offset under "initial", the key of the entry the page was loaded into.
    window.history.replaceState({ key: String(Date.now()) }, '')
  } else {
    traversalHref = window.location.href
  }
}

// Called once the router shows the new entry, after Gatsby's misplaced save.
const restoreDeparture = () => {
  if (!departure) return
  const { pathname, key, offset } = departure
  departure = null
  try {
    window.sessionStorage.setItem(`@@scroll|${pathname}|${key}`, JSON.stringify(offset))
  } catch {
    // Without sessionStorage Gatsby keeps offsets in memory only.
  }
}

// Firefox does not scroll a control that is already partly in view when it takes focus, so a
// control reached from the keyboard can stay half under the sticky header or sub-bar. Move it
// clear as the other engines do. Its scroll-margin-top (global.css) is the clearance: 0 inside
// the bars and dialogs. Only focus that follows keyboard input is moved. After a press the page
// must not move under the pointer, whether the press focused a field (text fields match
// :focus-visible on a click too) or a script then moved the focus (a Clear button focuses its
// search field).
let keyboardInput = true
const onFocusIn = event => {
  const control = event.target
  if (!keyboardInput || !(control instanceof Element)) return
  try {
    if (!control.matches(':focus-visible')) return
  } catch {
    return
  }
  window.requestAnimationFrame(() => {
    if (document.activeElement !== control) return
    const clearance = parseFloat(window.getComputedStyle(control).scrollMarginTop) || 0
    if (!clearance) return
    const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
    const box = control.getBoundingClientRect()
    const covered = box.top < clearance - 0.75 * rem && box.bottom > 0
    if (covered && box.height <= window.innerHeight - clearance) {
      window.scrollBy(0, box.top - clearance)
    }
  })
}

// Left on 'auto', Firefox and Safari also scroll the outgoing page before the route has
// rendered, and Gatsby saves that offset for the wrong history entry.
export const onClientEntry = () => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  // The router already calls this entry "initial"; writing that key into its state lets a
  // later popstate tell it apart from a new hash entry.
  if (!window.history.state?.key) {
    window.history.replaceState({ ...window.history.state, key: 'initial' }, '')
  }
  // The popstate and scroll listeners are registered before the router's own, so they run first.
  window.addEventListener('popstate', onPopState)
  window.addEventListener(
    'scroll',
    () => {
      shownOffset = window.scrollY
    },
    { passive: true }
  )
  document.addEventListener(
    'keydown',
    () => {
      keyboardInput = true
    },
    { capture: true, passive: true }
  )
  document.addEventListener(
    'pointerdown',
    () => {
      keyboardInput = false
    },
    { capture: true, passive: true }
  )
  document.addEventListener('focusin', onFocusIn)
}

const navigationType = () => {
  try {
    return window.performance.getEntriesByType('navigation')[0]?.type
  } catch {
    return undefined
  }
}

const hashTarget = hash => {
  try {
    return document.getElementById(decodeURI(hash.slice(1)))
  } catch {
    return null
  }
}

// Whether the page sits where a scroll to the URL's hash puts it.
const atHash = () => {
  const target = hashTarget(window.location.hash)
  if (!target) return false
  const margin = parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0
  const end = document.documentElement.scrollHeight - window.innerHeight
  const y = window.scrollY + target.getBoundingClientRect().top - margin
  return Math.abs(Math.min(Math.max(y, 0), end) - window.scrollY) < 2
}

// The first scroll of a document can still be undone while it loads: web fonts re-wrap the text
// above the target (scroll anchoring makes up for part of it), and WebKit scrolls to the URL's
// hash once more when the document has loaded. Scroll now, and again once the document and its
// fonts have loaded, unless the visitor has scrolled, typed, pressed anything or moved on by then.
// A scroll with none of those events (a scrollbar drag, assistive technology) is told apart by
// its distance: re-wrapped text moves the page through scroll anchoring, by no more than the
// page's height has changed. WebKit's scroll to the hash can go further, and lands the page at
// the hash.
const scrollOnceLoaded = land => {
  land()
  const landed = window.scrollY
  const height = document.documentElement.scrollHeight
  const href = window.location.href
  const visitor = new window.AbortController()
  const { signal } = visitor
  ;['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(type =>
    window.addEventListener(type, () => visitor.abort(), { capture: true, passive: true, signal })
  )
  new Promise(resolve => {
    if (document.readyState === 'complete') resolve()
    else window.addEventListener('load', resolve, { once: true, signal })
  })
    .then(() => document.fonts?.ready)
    .then(() => {
      // WebKit's scroll to the hash comes with the first rendering after the load event.
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => {
          if (signal.aborted) return
          visitor.abort()
          if (window.location.href !== href) return
          const reflow = Math.abs(document.documentElement.scrollHeight - height)
          const moved = Math.abs(window.scrollY - landed) > window.innerHeight / 2 + reflow
          if (!moved || atHash()) land()
        })
      )
    })
}

// Returning false means the scrolling, if any, has been done here.
export const shouldUpdateScroll = ({
  prevRouterProps,
  routerProps: { location },
  getSavedScrollPosition,
}) => {
  const [, saved] = getSavedScrollPosition(location)
  if (!prevRouterProps) {
    // A reload, or Back/Forward from another site, returns to the saved offset even when the
    // URL has a hash. A new visit starts at the hash or the top, never at an offset saved by
    // an earlier visit in this tab.
    const type = navigationType()
    if ((type === 'reload' || type === 'back_forward') && saved) {
      scrollOnceLoaded(() => window.scrollTo(0, saved))
      return false
    }
    if (location.hash) {
      scrollOnceLoaded(() => hashTarget(location.hash)?.scrollIntoView())
      return false
    }
    return type !== 'navigate'
  }
  if (traversalHref !== location.href) return true
  // Back or Forward: the offset the visitor left, not the hash target.
  if (saved) {
    window.scrollTo(0, saved)
    return false
  }
  return true
}

// A link to a section (/#about) scrolls there but leaves focus on the link, so the next Tab
// starts again from the top of the page. Move focus to the target instead.
let releaseFocus = () => {}
export const onRouteUpdate = ({ location, prevLocation }) => {
  restoreDeparture()
  releaseFocus()
  shownEntry = { pathname: location.pathname, key: location.key }
  shownOffset = window.scrollY
  const traversal = traversalHref === location.href
  traversalHref = null
  if (!prevLocation || traversal || !location.hash) return
  window.requestAnimationFrame(() => {
    const section = hashTarget(location.hash)
    if (!section) return
    // A focusable target (the skip link's main) keeps the focus; a section hands it to its
    // heading.
    const focusable = 'a[href], button, input, select, textarea, summary, [tabindex]'
    const headings = 'h1, h2, h3, h4, h5, h6'
    const target =
      section.matches(focusable) || section.matches(headings)
        ? section
        : section.querySelector(headings) || section
    const focusTarget = () => {
      if (!target.matches(focusable)) {
        target.setAttribute('tabindex', '-1')
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
      }
      target.focus({ preventScroll: true })
    }
    focusTarget()
    // On a new page the router focuses its page wrapper from an effect, which in a production
    // build can run after this frame. Hand the focus back then, unless the visitor acted first.
    const wrapper = document.getElementById('gatsby-focus-wrapper')
    if (!wrapper || location.pathname === prevLocation.pathname) return
    const pending = new window.AbortController()
    const { signal } = pending
    releaseFocus = () => pending.abort()
    wrapper.addEventListener(
      'focus',
      () => {
        releaseFocus()
        focusTarget()
      },
      { signal }
    )
    ;['keydown', 'pointerdown'].forEach(type =>
      window.addEventListener(type, releaseFocus, { capture: true, signal })
    )
  })
}
