import * as React from 'react'
import PropTypes from 'prop-types'
import { useScrollLock } from '../../hooks/useScrollLock'
import './Lightbox.css'

// Widest the image is ever laid out: the dialog's width less its padding (Lightbox.css).
const MAX_DISPLAY_WIDTH = 1040

// gatsbyImageData -> what a plain <img> needs to show the largest file the build
// produced, whole (GatsbyImage defaults to object-fit: cover) and never upscaled.
const toPreview = image => {
  const { fallback = {}, sources = [] } = image.images
  const webp = sources.find(source => source.type === 'image/webp')
  const srcSet = (webp || fallback).srcSet || ''
  const largest = srcSet
    .split(',')
    .map(candidate => candidate.trim().split(/\s+/))
    .filter(([, descriptor]) => /^\d+w$/.test(descriptor || ''))
    .map(([url, descriptor]) => ({ url, width: parseInt(descriptor, 10) }))
    .reduce((best, candidate) => (candidate.width > best.width ? candidate : best), {
      url: fallback.src,
      width: 0,
    })
  // FULL_WIDTH data reports width 1 and height 1/ratio, so only the ratio is taken from it.
  const ratio = image.width / image.height
  const width = largest.width || image.width
  return {
    src: fallback.src,
    srcSet: srcSet || undefined,
    width,
    height: Math.round(width / ratio),
    ratio: Number(ratio.toFixed(4)),
    fullSize: largest.url,
  }
}

/**
 * Modal preview built on the native <dialog>: top layer, inert page, focus moved
 * in and returned to the opener, Esc to close. Render it unconditionally and
 * toggle `open`. Pass `image` (gatsbyImageData) or any `children`.
 */
const Lightbox = ({ open, onClose, label, caption, image, alt = '', fullSizeHref, children }) => {
  const dialogRef = React.useRef(null)
  const pressStartedOnBackdrop = React.useRef(false)
  useScrollLock(open)

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (dialog.showModal) dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (dialog.close) dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  const preview = open && image ? toPreview(image) : null
  const href = fullSizeHref || (preview && preview.fullSize)

  return (
    // A click on the backdrop lands on the dialog itself. Esc is the keyboard equivalent.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className="ui-lightbox"
      aria-label={label}
      onClose={open ? onClose : undefined}
      onPointerDown={event => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={event => {
        if (event.target === event.currentTarget && pressStartedOnBackdrop.current) onClose()
      }}
    >
      {open && (
        <div className="ui-lightbox__content">
          <div className="ui-lightbox__bar">
            {caption && <p className="ui-lightbox__caption">{caption}</p>}
            <button
              type="button"
              className="ui-lightbox__close"
              onClick={onClose}
              aria-label="Close preview"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="ui-lightbox__media">
            {preview ? (
              <img
                className="ui-lightbox__image"
                src={preview.src}
                srcSet={preview.srcSet}
                sizes={`min(${Math.min(preview.width, MAX_DISPLAY_WIDTH)}px, 92vw, calc((100vh - 11rem) * ${preview.ratio}))`}
                width={preview.width}
                height={preview.height}
                style={{
                  '--ui-lightbox-image-width': `${preview.width}px`,
                  '--ui-lightbox-image-ratio': String(preview.ratio),
                }}
                alt={alt}
                decoding="async"
              />
            ) : (
              children
            )}
          </div>
          {href && (
            <a className="ui-lightbox__full" href={href} target="_blank" rel="noopener noreferrer">
              Open image in a new tab
            </a>
          )}
        </div>
      )}
    </dialog>
  )
}

Lightbox.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  caption: PropTypes.node,
  image: PropTypes.object,
  alt: PropTypes.string,
  fullSizeHref: PropTypes.string,
  children: PropTypes.node,
}

export default Lightbox
