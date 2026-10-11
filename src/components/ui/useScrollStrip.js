import * as React from 'react'
import { scrollBehavior } from '../../hooks/motion'
import './scroll-strip.css'

/**
 * For a horizontally scrolling row of controls (tab strip, sub-navigation, year
 * bar). Reports which edges hide content, so `.ui-scroll-strip[data-fade]` can
 * fade them, and keeps the active item in view by moving the row only:
 * scrollIntoView would also scroll the page.
 *
 *   const { ref, fade } = useScrollStrip({ active: '[aria-current="page"]' })
 *   <ul ref={ref} className="… ui-scroll-strip" data-fade={fade}>
 *
 * `active` is a selector inside the strip. That item is centred on mount, again
 * whenever `watch` changes, and after a resize or a late web font for as long as
 * the visitor has not scrolled the strip themselves.
 */
export const useScrollStrip = ({ active, watch } = {}) => {
  const ref = React.useRef(null)
  const hasMounted = React.useRef(false)
  // Where the last centring put the strip; null until there is an active item.
  const centredAt = React.useRef(null)
  const [fade, setFade] = React.useState('none')
  // Whether the strip's tabindex is this hook's to set; decided on the first update.
  const ownsTabIndex = React.useRef(null)

  const update = React.useCallback(() => {
    const strip = ref.current
    if (!strip) return
    const max = strip.scrollWidth - strip.clientWidth
    const start = strip.scrollLeft > 1
    const end = strip.scrollLeft < max - 1
    setFade(start && end ? 'both' : start ? 'start' : end ? 'end' : 'none')
    // Firefox makes an overflowing scroller a tab stop of its own. A strip of links or buttons
    // needs none, its items are the stops, so it gets tabindex="-1" while it overflows. Only
    // then: a click focuses a strip that has a tabindex, and Firefox then starts the next Tab
    // at the top of the page. A tabindex the consumer set is kept.
    if (ownsTabIndex.current === null) ownsTabIndex.current = !strip.hasAttribute('tabindex')
    if (!ownsTabIndex.current) return
    if (max > 1 && strip.querySelector('a[href], button')) strip.setAttribute('tabindex', '-1')
    else strip.removeAttribute('tabindex')
  }, [])

  const centre = React.useCallback(
    behavior => {
      const strip = ref.current
      const item = strip && active ? strip.querySelector(active) : null
      if (!item) return
      const max = strip.scrollWidth - strip.clientWidth
      if (max <= 0) {
        centredAt.current = 0
        return
      }
      const stripBox = strip.getBoundingClientRect()
      const itemBox = item.getBoundingClientRect()
      const left =
        strip.scrollLeft + itemBox.left - stripBox.left - (stripBox.width - itemBox.width) / 2
      centredAt.current = Math.min(Math.max(left, 0), max)
      strip.scrollTo({ left, behavior })
    },
    [active]
  )

  // Chromium does not scroll a partly visible element into view when it takes
  // focus, so a control focused from the keyboard is moved clear of the faded
  // edges here. Pointer focus is left alone: the target must not move mid-click.
  const reveal = React.useCallback(
    item => {
      const strip = ref.current
      if (!strip || item === strip || item !== document.activeElement) return
      if (active && item.matches(active)) {
        centre(scrollBehavior())
        return
      }
      const edge = parseFloat(window.getComputedStyle(strip).scrollPaddingInlineStart) || 0
      const stripBox = strip.getBoundingClientRect()
      const itemBox = item.getBoundingClientRect()
      const start = itemBox.left - (stripBox.left + edge)
      const end = itemBox.right - (stripBox.right - edge)
      if (start < 0) strip.scrollBy({ left: start, behavior: scrollBehavior() })
      else if (end > 0) strip.scrollBy({ left: Math.min(end, start), behavior: scrollBehavior() })
    },
    [active, centre]
  )

  // A render can change what the strip holds without changing the strip's own size.
  React.useEffect(update)

  React.useEffect(() => {
    const strip = ref.current
    if (!strip) return undefined

    const onResize = () => {
      update()
      if (centredAt.current === null) return
      // Still where the last centring left it (or clamped there by a wider strip)?
      const expected = Math.min(centredAt.current, strip.scrollWidth - strip.clientWidth)
      if (Math.abs(strip.scrollLeft - expected) <= 2) centre('auto')
    }
    const onFocusIn = event => {
      const item = event.target
      let fromKeyboard = false
      try {
        fromKeyboard = item.matches(':focus-visible')
      } catch {
        fromKeyboard = false
      }
      // Next frame: after the browser's own focus scrolling, if it did any.
      if (fromKeyboard) window.requestAnimationFrame(() => reveal(item))
    }

    strip.addEventListener('scroll', update, { passive: true })
    strip.addEventListener('focusin', onFocusIn)
    // Items are observed too: a late web font changes their width, not the strip's.
    const observer = window.ResizeObserver ? new window.ResizeObserver(onResize) : null
    if (observer) {
      observer.observe(strip)
      Array.from(strip.children).forEach(child => observer.observe(child))
    }
    return () => {
      strip.removeEventListener('scroll', update)
      strip.removeEventListener('focusin', onFocusIn)
      if (observer) observer.disconnect()
    }
  }, [update, centre, reveal])

  React.useEffect(() => {
    centre(hasMounted.current ? scrollBehavior() : 'auto')
    hasMounted.current = true
  }, [centre, watch])

  return { ref, fade }
}
