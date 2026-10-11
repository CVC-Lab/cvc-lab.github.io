import * as React from 'react'

// Copies text and reports 'idle' | 'copied' | 'failed'. On failure (no Clipboard API, an
// insecure origin, an unfocused document) the fallback node's text is selected instead, so
// the reader can still copy it by hand.
const useCopyText = (resetMs = 3000) => {
  const [status, setStatus] = React.useState('idle')
  const timer = React.useRef(null)

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async (text, fallbackNode) => {
    let next = 'copied'
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      next = 'failed'
      if (fallbackNode) window.getSelection().selectAllChildren(fallbackNode)
    }
    setStatus(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setStatus('idle'), resetMs)
  }

  return [status, copy]
}

export default useCopyText
