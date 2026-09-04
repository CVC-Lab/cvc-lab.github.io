import * as React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { useCardImage } from '../../hooks/useCardImages'
import { Link } from 'gatsby'
import { FaArrowRight, FaPause, FaPlay } from 'react-icons/fa'

const ThemeStillImage = ({ theme }) => {
  const resolveCardImage = useCardImage()
  const image = theme.visualImage ? getImage(resolveCardImage(theme.visualImage)) : null

  if (image) {
    return <GatsbyImage image={image} alt={theme.visualAlt} loading="lazy" />
  }

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
  const [isPlaying, setIsPlaying] = React.useState(Boolean(theme.video))

  React.useEffect(() => {
    if (!theme.video || typeof window === 'undefined' || !videoRef.current) {
      return undefined
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      videoRef.current.pause()
      setIsPlaying(false)
    }

    return undefined
  }, [theme.video])

  const toggleVideo = () => {
    if (!videoRef.current) return

    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
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
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${theme.title} animated research preview`}
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

const ThemeProjectLink = ({ project }) => {
  const linkContent = (
    <>
      {project.label} <FaArrowRight aria-hidden="true" />
    </>
  )

  if (project.href.startsWith('http')) {
    return (
      <a href={project.href} target="_blank" rel="noreferrer">
        {linkContent}
      </a>
    )
  }

  return <Link to={project.href}>{linkContent}</Link>
}

ThemeProjectLink.propTypes = {
  project: PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
  }).isRequired,
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

const ThemeBanners = ({ themes }) => (
  <section className="research-theme-banners" id="research-themes">
    <div className="research-themes-shell">
      <div className="research-theme-banners__heading">
        <p className="research-themes-section-eyebrow">Research themes</p>
        <h2>Three ways into the lab</h2>
        <p>
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
              <div className="research-theme-banner__tags" aria-label={`${theme.title} topics`}>
                {theme.tags.map(tag => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
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
              <Link to={theme.href} className="research-theme-banner__link">
                {theme.ctaLabel} <FaArrowRight aria-hidden="true" />
              </Link>
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
