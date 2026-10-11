import * as React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { FaChevronLeft, FaChevronRight, FaPause, FaPlay } from 'react-icons/fa'
import { useCardImage } from '../hooks/useCardImages'
import { prefersReducedMotion } from '../hooks/motion'
import SmartLink from './ui/SmartLink'
import './FeaturedResearch.css'

// Slides, in this order, looked up by project tile name. Clips are served from static/media.
const FEATURED_PROJECTS_DATA = [
  {
    name: 'PHAST',
    video: '/media/phast_monolithic_demo.mp4',
    poster: '/media/phast_monolithic_demo_poster.jpg',
  },
  {
    name: 'GRL-SNAM',
    video: null,
  },
  {
    name: 'Subsurface Flow Modeling',
    video: '/media/hydro6A80.mp4',
  },
  {
    name: 'Dynamic Belief Games',
    video: null,
  },
  {
    name: "AI4PD: Parkinson's Disease",
    video: null,
  },
]

const playQuietly = video => {
  const started = video.play()
  if (started) started.catch(() => {})
}

const FeaturedResearch = ({ projectTiles }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [allowMotion, setAllowMotion] = React.useState(false)
  const [userPaused, setUserPaused] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [hasFocus, setHasFocus] = React.useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false)
  const videoRef = React.useRef(null)

  const resolveCardImage = useCardImage()

  const featuredProjects = React.useMemo(() => {
    const featuredNames = FEATURED_PROJECTS_DATA.map(p => p.name)
    return projectTiles
      .filter(tile => featuredNames.includes(tile.name))
      .map(tile => {
        const featuredData = FEATURED_PROJECTS_DATA.find(p => p.name === tile.name)
        return {
          ...tile,
          image: tile.image || resolveCardImage(tile.img_name),
          video: featuredData?.video || null,
          poster: featuredData?.poster,
        }
      })
      .sort((a, b) => {
        // Maintain order from FEATURED_PROJECTS_DATA
        const aIndex = FEATURED_PROJECTS_DATA.findIndex(p => p.name === a.name)
        const bIndex = FEATURED_PROJECTS_DATA.findIndex(p => p.name === b.name)
        return aIndex - bIndex
      })
  }, [projectTiles, resolveCardImage])

  const currentProject = featuredProjects[currentIndex]
  const isRotating =
    allowMotion && !userPaused && !isHovered && !hasFocus && featuredProjects.length > 1

  const goToNext = React.useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % featuredProjects.length)
  }, [featuredProjects.length])

  const goToPrev = React.useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + featuredProjects.length) % featuredProjects.length)
  }, [featuredProjects.length])

  const toggleVideo = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      playQuietly(video)
    } else {
      video.pause()
    }
  }

  // Bumping the epoch re-runs the effect below, which restarts the interval.
  const [timerEpoch, setTimerEpoch] = React.useState(0)
  const resetTimer = React.useCallback(() => setTimerEpoch(epoch => epoch + 1), [])

  React.useEffect(() => {
    setAllowMotion(!prefersReducedMotion())
  }, [])

  // Auto-rotation: the effect owns the only interval, so pausing always clears it.
  React.useEffect(() => {
    if (!isRotating) return undefined
    const id = setInterval(goToNext, 3000)
    return () => clearInterval(id)
  }, [isRotating, goToNext, timerEpoch])

  // Slide clips start only when motion is allowed; the button mirrors the element.
  React.useEffect(() => {
    const video = videoRef.current
    if (video && allowMotion) playQuietly(video)
    setIsVideoPlaying(Boolean(video) && !video.paused)
  }, [currentIndex, allowMotion])

  if (featuredProjects.length === 0) {
    return null
  }

  const currentImage = currentProject ? getImage(currentProject.image) : null

  return (
    <section
      className="featured-research"
      aria-roledescription="carousel"
      aria-labelledby="featured-research-title"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false)
      }}
    >
      <div className="page-container featured-research-container">
        <h2 id="featured-research-title" className="featured-research-title">
          Featured Research
        </h2>

        <div className="featured-carousel">
          <button
            type="button"
            className="carousel-nav carousel-nav-prev"
            onClick={() => {
              goToPrev()
              resetTimer()
            }}
            aria-label="Previous project"
          >
            <FaChevronLeft aria-hidden="true" />
          </button>

          <div className="featured-card-wrapper" aria-live={isRotating ? 'off' : 'polite'}>
            {currentProject && (
              <div className="featured-card-horizontal">
                <div className="featured-media">
                  {currentProject.video ? (
                    <div className="featured-video-wrapper">
                      <video
                        key={currentProject.name}
                        ref={videoRef}
                        className="featured-video"
                        src={currentProject.video}
                        poster={currentProject.poster}
                        muted
                        loop
                        playsInline
                        tabIndex={-1}
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                      />
                      <button
                        type="button"
                        className="video-control-btn"
                        onClick={toggleVideo}
                        aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
                      >
                        {isVideoPlaying ? (
                          <FaPause aria-hidden="true" />
                        ) : (
                          <FaPlay aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="featured-image-wrapper">
                      {currentImage && (
                        <GatsbyImage
                          image={currentImage}
                          alt={`${currentProject.name} preview`}
                          className="featured-image"
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="featured-content">
                  <span className="featured-badge">Featured</span>
                  <h3 className="featured-project-title">{currentProject.name}</h3>
                  <p className="featured-project-description">{currentProject.description}</p>
                  <div className="featured-tags">
                    {(currentProject.tags || []).map(tag => (
                      <span key={tag} className="featured-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <SmartLink to={currentProject.link} className="featured-link">
                    View Project →
                  </SmartLink>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="carousel-nav carousel-nav-next"
            onClick={() => {
              goToNext()
              resetTimer()
            }}
            aria-label="Next project"
          >
            <FaChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="carousel-indicators">
          {allowMotion && featuredProjects.length > 1 && (
            <button
              type="button"
              className="carousel-toggle"
              onClick={() => setUserPaused(paused => !paused)}
              aria-label={userPaused ? 'Start slide rotation' : 'Stop slide rotation'}
            >
              {userPaused ? <FaPlay aria-hidden="true" /> : <FaPause aria-hidden="true" />}
            </button>
          )}
          {featuredProjects.map((project, index) => (
            <button
              type="button"
              key={project.name}
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentIndex(index)
                resetTimer()
              }}
              aria-label={`Go to ${project.name}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

FeaturedResearch.propTypes = {
  projectTiles: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      img_name: PropTypes.string.isRequired,
      link: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string),
      image: PropTypes.object,
    })
  ).isRequired,
}

export default FeaturedResearch
