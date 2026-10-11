import * as React from 'react'

export const useIsoLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

let hydrated = false

// The server HTML is always the unfiltered state, so a component that takes part in hydration
// must render that first and apply the URL in a layout effect. A component that mounts after
// hydration (client-side navigation, Back/Forward) can read the URL during its first render;
// then Gatsby restores the saved scroll position against the filtered layout, not the
// unfiltered one.
export const isHydrated = () => hydrated

export const useMarkHydrated = () => {
  React.useEffect(() => {
    hydrated = true
  }, [])
}

export const readQueryParam = name => {
  if (typeof window === 'undefined') return null
  return new window.URLSearchParams(window.location.search).get(name)
}

// Browsers cap history calls (Safari 100 per 30 s, Firefox 200 per 10 s) and then throw or
// ignore them. So the first write after a quiet spell goes out at once, later ones within
// WRITE_INTERVAL are merged into one trailing write, and a write the browser refused is retried
// until the URL matches what is on screen. A link click or pagehide sends a waiting write
// first, so the history entry being left keeps the visible state.
const WRITE_INTERVAL = 250
const RETRY_DELAY = 1000
const MAX_RETRIES = 40
let pendingWrite = null
let writeTimer = null
let lastWriteAt = -Infinity
let listening = false

const flushWrite = () => {
  clearTimeout(writeTimer)
  writeTimer = null
  const write = pendingWrite
  pendingWrite = null
  if (!write) return
  const { location, history } = window
  // The reader has moved on (another page, or a new history entry for this one).
  if (location.pathname !== write.pathname || history.state?.key !== write.key) return

  const url = new window.URL(location.href)
  Object.entries(write.params).forEach(([name, value]) => {
    if (value) url.searchParams.set(name, value)
    else url.searchParams.delete(name)
  })
  if (url.href === location.href) return

  lastWriteAt = Date.now()
  try {
    // history.state keeps Gatsby's location key, which its scroll restoration is stored under.
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`)
  } catch {
    // Rate limited: retried below.
  }
  if (location.href !== url.href && write.retries < MAX_RETRIES) {
    pendingWrite = { ...write, retries: write.retries + 1 }
    writeTimer = setTimeout(flushWrite, RETRY_DELAY)
  }
}

const flushBeforeLeaving = event => {
  if (!pendingWrite) return
  if (event.type === 'click' && !event.target.closest?.('a[href]')) return
  flushWrite()
}

// Empty values delete the parameter. No history entry is added.
export const writeQueryParams = params => {
  if (typeof window === 'undefined') return
  if (!listening) {
    listening = true
    document.addEventListener('click', flushBeforeLeaving, true)
    window.addEventListener('pagehide', flushBeforeLeaving)
  }
  const pathname = window.location.pathname
  const key = window.history.state?.key
  const merge = pendingWrite && pendingWrite.pathname === pathname && pendingWrite.key === key
  pendingWrite = {
    pathname,
    key,
    params: { ...(merge ? pendingWrite.params : {}), ...params },
    retries: 0,
  }
  if (writeTimer) return
  const wait = lastWriteAt + WRITE_INTERVAL - Date.now()
  if (wait > 0) writeTimer = setTimeout(flushWrite, wait)
  else flushWrite()
}

// Inline <head> script for a page whose server HTML shows the unfiltered state: when the URL
// asks for a filter, it marks <html> with `className` at parse time so the page stylesheet can
// hide what hydration is about to change. `params` maps a query parameter to the values that
// set the class (true: any non-empty value). The page component removes the class once the URL
// is applied (useReleasePrepaintGate). Failsafes, so content never stays hidden: at window load
// Gatsby's async bundles have run or failed, so without its runtime (window.___loader) the class
// goes at once; with it, hydration follows once page data has arrived (seconds later on slow
// networks) unless a script error or rejected promise says it will not (Gatsby rejects when page
// data cannot be loaded), which also removes the class; 15 s is the limit whatever happens. The
// script runs only during parsing (a client-side navigation re-inserts it after the page has
// rendered). It must stay free of & and <, which the SSR head handler would escape.
export const prepaintGateScript = (className, params) =>
  `(function(){try{if(document.readyState!=='loading')return;var p=new URLSearchParams(location.search),r=${JSON.stringify(
    params
  )},c=document.documentElement.classList,n=${JSON.stringify(
    className
  )},k,v;for(k in r){v=p.get(k);if(v)if(r[k]===true||r[k].indexOf(v)!==-1){c.add(n);var f=function(){c.remove(n)};addEventListener('load',function(){window.___loader||f()});addEventListener('error',f);addEventListener('unhandledrejection',f);setTimeout(f,15000);return}}}catch(e){}})()`

export const useReleasePrepaintGate = (className, ready) => {
  React.useEffect(() => {
    if (ready) document.documentElement.classList.remove(className)
  }, [className, ready])
}

// On a hard load the browser and Gatsby scroll to the #hash against the unfiltered server HTML.
// Call with `applied` turning true in the commit that renders the URL's filter: if that commit
// changed the layout (`filtered`), the target is scrolled to again before the next paint, and
// once more when web fonts still loading re-wrap the text above it (the result lists opt out of
// scroll anchoring), unless the reader has scrolled meanwhile.
export const useRescrollToHash = (applied, filtered) => {
  const pending = React.useRef(!isHydrated())
  useIsoLayoutEffect(() => {
    if (!applied || !pending.current) return
    pending.current = false
    if (!filtered || !window.location.hash) return
    let target
    try {
      target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
    } catch {
      return
    }
    if (!target) return
    target.scrollIntoView({ block: 'start' })
    if (document.fonts?.status !== 'loading') return
    // The re-wrap can also clamp scrollY, so the reader's own input is what cancels the re-scroll.
    const readerInput = new window.AbortController()
    const cancel = () => readerInput.abort()
    ;['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(type =>
      window.addEventListener(type, cancel, { passive: true, signal: readerInput.signal })
    )
    document.fonts.ready.then(() => {
      if (readerInput.signal.aborted || !target.isConnected) return
      readerInput.abort()
      target.scrollIntoView({ block: 'start' })
    })
  }, [applied, filtered])
}
