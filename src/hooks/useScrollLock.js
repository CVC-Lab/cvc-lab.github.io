import * as React from 'react'

let lockCount = 0
let previous = null

/**
 * Stops the page scrolling behind a modal surface while `active` is true.
 * The lock goes on <html> as an inline style, because <html> is the element
 * whose overflow the viewport takes; `scrollbar-gutter` keeps the layout from
 * shifting when a classic scrollbar disappears. Nested locks are counted.
 */
export const useScrollLock = active => {
  React.useEffect(() => {
    if (!active) return undefined
    const { style } = document.documentElement
    if (lockCount === 0) {
      previous = { overflow: style.overflow, scrollbarGutter: style.scrollbarGutter }
      style.overflow = 'hidden'
      style.scrollbarGutter = 'stable'
    }
    lockCount += 1
    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        style.overflow = previous.overflow
        style.scrollbarGutter = previous.scrollbarGutter
      }
    }
  }, [active])
}
