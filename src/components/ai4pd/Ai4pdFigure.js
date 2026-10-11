import * as React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import Lightbox from '../ui/Lightbox'
import { useCardImage } from '../../hooks/useCardImages'
import { useWideImage } from '../../hooks/useWideImages'

// The largest file the build made for the image (the same choice the Lightbox makes): the
// zoom link's target and the widest the Lightbox will draw it.
const largestFile = image => {
  const { fallback = {}, sources = [] } = image.images
  const webp = sources.find(source => source.type === 'image/webp')
  const largest = ((webp || fallback).srcSet || '')
    .split(',')
    .map(candidate => candidate.trim().split(/\s+/))
    .filter(([, descriptor]) => /^\d+w$/.test(descriptor || ''))
    .reduce(
      (best, [url, descriptor]) => {
        const width = parseInt(descriptor, 10)
        return width > best.width ? { url, width } : best
      },
      { url: fallback.src, width: 0 }
    )
  return { url: largest.url, width: largest.width || image.width }
}

// Width the Lightbox would show the image at. Mirrors Lightbox.css: the dialog is
// min(1072px, 100vw - 2 * --page-gutter) wide with 1rem padding, and the image is capped by
// its file width and by the viewport height less 11rem of chrome, at its own ratio.
const lightboxWidth = (fileWidth, ratio) => {
  const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
  const viewport = window.innerWidth
  const gutter = Math.min(Math.max(rem, viewport * 0.04), 2.5 * rem)
  const box = Math.min(1072, viewport - 2 * gutter) - 2 * rem
  return Math.min(box, fileWidth, (window.innerHeight - 11 * rem) * ratio)
}

/**
 * A figure from src/images/projects/ai4pd. `wide` figures span the container and need
 * FULL_WIDTH data (see useWideImages). `bare` returns the image alone, for card
 * thumbnails. `zoom` links the image to its full-size file and opens it in the shared
 * lightbox instead when the lightbox can show it at least 25% larger than the page does;
 * on narrow screens the file itself opens, where it can be pinch-zoomed.
 */
const Ai4pdFigure = ({
  name,
  alt,
  caption,
  loading = 'lazy',
  wide = false,
  bare = false,
  zoom = false,
  fullSizeHref,
  sizes,
}) => {
  const resolveCardImage = useCardImage()
  const resolveWideImage = useWideImage()
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef(null)
  const key = name.startsWith('projects/') ? name : `projects/ai4pd/${name}`
  const image = getImage((wide ? resolveWideImage : resolveCardImage)(key))
  if (!image) return null

  const picture = <GatsbyImage image={image} alt={alt} loading={loading} sizes={sizes} />
  if (bare) return picture

  const file = largestFile(image)
  const href = fullSizeHref || file.url

  const openLightbox = event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    const shown = event.currentTarget.querySelector('.gatsby-image-wrapper') || event.currentTarget
    const enlarged = lightboxWidth(file.width, image.width / image.height)
    if (enlarged < shown.getBoundingClientRect().width * 1.25) return
    event.preventDefault()
    setOpen(true)
  }

  // Safari does not focus a link on click, so the dialog would hand focus back to the page.
  const closeLightbox = () => {
    setOpen(false)
    window.requestAnimationFrame(() => {
      if (triggerRef.current) triggerRef.current.focus({ preventScroll: true })
    })
  }

  return (
    <figure className={`ai4pd-figure${wide ? ' ai4pd-figure--wide' : ''}`}>
      {zoom ? (
        <a
          ref={triggerRef}
          href={href}
          className="ai4pd-figure__zoom"
          aria-label={`Enlarge figure: ${alt}`}
          onClick={openLightbox}
        >
          {picture}
        </a>
      ) : (
        picture
      )}
      {caption && <figcaption>{caption}</figcaption>}
      {zoom && (
        <Lightbox
          open={open}
          onClose={closeLightbox}
          label={alt}
          caption={caption}
          image={image}
          alt={alt}
          fullSizeHref={href}
        />
      )}
    </figure>
  )
}

Ai4pdFigure.propTypes = {
  name: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  caption: PropTypes.node,
  loading: PropTypes.oneOf(['eager', 'lazy']),
  wide: PropTypes.bool,
  bare: PropTypes.bool,
  zoom: PropTypes.bool,
  fullSizeHref: PropTypes.string,
  sizes: PropTypes.string,
}

export default Ai4pdFigure
