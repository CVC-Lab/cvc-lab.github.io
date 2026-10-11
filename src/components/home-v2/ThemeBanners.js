import * as React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { FaArrowRight, FaPause, FaPlay } from 'react-icons/fa'
import { useCardImage } from '../../hooks/useCardImages'
import { prefersReducedMotion } from '../../hooks/motion'
import SmartLink from '../ui/SmartLink'

// Three cards in a row from 1041px, the figure column of a stacked card from 721px.
const STILL_SIZES = '(min-width: 1041px) 400px, (min-width: 721px) 46vw, 100vw'

const playQuietly = video => {
  const started = video.play()
  if (started) started.catch(() => {})
}

const ThemeStillImage = ({ theme }) => {
  const resolveCardImage = useCardImage()
  const image = theme.visualImage ? getImage(resolveCardImage(theme.visualImage)) : null

  if (image) {
    return <GatsbyImage image={image} alt={theme.visualAlt} loading="lazy" sizes={STILL_SIZES} />
  }

  if (!theme.visual) return null

  return <img src={theme.visual} alt={theme.visualAlt} loading="lazy" decoding="async" />
}

ThemeStillImage.propTypes = {
  theme: PropTypes.shape({
    visual: PropTypes.string,
    visualImage: PropTypes.string,
    visualAlt: PropTypes.string.isRequired,
  }).isRequired,
}

const ThemeVisual = ({ theme }) => {
  const videoRef = React.useRef(null)
  const userPausedRef = React.useRef(false)
  const [isPlaying, setIsPlaying] = React.useState(false)

  // Opt-in motion: the clip loads and plays only while it is on screen, and never
  // starts by itself for visitors who ask for reduced motion.
  React.useEffect(() => {
    const video = videoRef.current
    if (!video || !window.IntersectionObserver || prefersReducedMotion()) return undefined

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          video.pause()
        } else if (!userPausedRef.current) {
          playQuietly(video)
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const toggleVideo = () => {
    const video = videoRef.current
    if (!video) return
    userPausedRef.current = !video.paused
    if (video.paused) {
      playQuietly(video)
    } else {
      video.pause()
    }
  }

  return (
    <figure className="research-theme-banner__figure">
      <div className="research-theme-banner__media">
        {theme.video ? (
          <video
            ref={videoRef}
            src={theme.video}
            poster={theme.visual}
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            aria-label={theme.visualAlt}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <ThemeStillImage theme={theme} />
        )}

        {theme.video && (
          <button
            type="button"
            className="research-theme-banner__video-control"
            onClick={toggleVideo}
            aria-label={
              isPlaying ? `Pause ${theme.title} animation` : `Play ${theme.title} animation`
            }
            title={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
          </button>
        )}
      </div>
      <figcaption>{theme.visualCaption}</figcaption>
    </figure>
  )
}

ThemeVisual.propTypes = {
  theme: PropTypes.shape({
    title: PropTypes.string.isRequired,
    visual: PropTypes.string,
    visualImage: PropTypes.string,
    visualAlt: PropTypes.string.isRequired,
    visualCaption: PropTypes.string.isRequired,
    video: PropTypes.string,
  }).isRequired,
}

const ThemeProjectLink = ({ project }) => (
  <SmartLink to={project.href}>
    {project.label} <FaArrowRight aria-hidden="true" />
  </SmartLink>
)

ThemeProjectLink.propTypes = {
  project: PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
  }).isRequired,
}

const ThemeBanners = ({ themes }) => (
  <section className="research-theme-banners" id="research-themes">
    <div className="page-container research-themes-shell">
      <div className="research-theme-banners__heading">
        <p className="research-themes-section-eyebrow">Research themes</p>
        <h2>Three ways into the lab</h2>
        <p className="research-themes-section-lede">
          Start with the kind of system you want to understand. Follow a theme into projects,
          visuals, and the papers that support the work.
        </p>
      </div>

      <div className="research-theme-banners__grid" role="list" aria-label="Research themes">
        {themes.map(theme => (
          <article
            key={theme.id}
            className={`research-theme-banner research-theme-banner--${theme.id}`}
            role="listitem"
          >
            <ThemeVisual theme={theme} />
            <div className="research-theme-banner__content">
              <div className="research-theme-banner__topline">
                <span className="research-theme-banner__index">{theme.index}</span>
                <span className="research-theme-banner__kicker">{theme.kicker}</span>
              </div>
              <h3>{theme.title}</h3>
              <p>{theme.summary}</p>
              <div
                className="research-theme-banner__tags"
                role="group"
                aria-label={`${theme.title} topics`}
              >
                {theme.tags.map(tag => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="research-theme-banner__footer">
                {theme.featuredProjects?.length > 0 && (
                  <div className="research-theme-banner__projects">
                    <span className="research-theme-banner__projects-label">Selected projects</span>
                    <div className="research-theme-banner__projects-list">
                      {theme.featuredProjects.map(project => (
                        <ThemeProjectLink key={project.href} project={project} />
                      ))}
                    </div>
                  </div>
                )}
                <SmartLink to={theme.href} className="research-theme-banner__link">
                  {theme.ctaLabel} <FaArrowRight aria-hidden="true" />
                </SmartLink>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
)

ThemeBanners.propTypes = {
  themes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      index: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      kicker: PropTypes.string.isRequired,
      summary: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      visual: PropTypes.string,
      visualImage: PropTypes.string,
      visualAlt: PropTypes.string.isRequired,
      visualCaption: PropTypes.string.isRequired,
      video: PropTypes.string,
      featuredProjects: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          href: PropTypes.string.isRequired,
        })
      ),
      href: PropTypes.string.isRequired,
      ctaLabel: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export default ThemeBanners
