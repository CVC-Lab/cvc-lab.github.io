import * as React from 'react'
import { prefersReducedMotion } from './motion'

/**
 * State for a muted, looping `<video autoPlay>` with a play/pause control.
 * `isPlaying` follows the element rather than the button, so it stays right
 * when the browser blocks autoplay, pauses the clip off-screen, or started it
 * before hydration. Visitors who prefer reduced motion get the clip paused.
 *
 *   const { videoRef, isPlaying, toggle } = useVideoPlayback()
 *   <video ref={videoRef} autoPlay muted loop playsInline … />
 *   <button type="button" onClick={toggle}>{isPlaying ? 'Pause' : 'Play'}</button>
 */
export const useVideoPlayback = () => {
  const [video, setVideo] = React.useState(null)
  const [isPlaying, setIsPlaying] = React.useState(false)

  React.useEffect(() => {
    if (!video) return undefined
    const sync = () => setIsPlaying(!video.paused)
    if (prefersReducedMotion()) video.pause()
    sync()
    video.addEventListener('play', sync)
    video.addEventListener('pause', sync)
    return () => {
      video.removeEventListener('play', sync)
      video.removeEventListener('pause', sync)
    }
  }, [video])

  const toggle = React.useCallback(() => {
    if (!video) return
    if (video.paused) {
      const started = video.play()
      if (started && started.catch) started.catch(() => {})
    } else {
      video.pause()
    }
  }, [video])

  return { videoRef: setVideo, isPlaying: Boolean(video) && isPlaying, toggle }
}
