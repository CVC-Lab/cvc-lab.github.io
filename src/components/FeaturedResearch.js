import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { FaChevronLeft, FaChevronRight, FaPlay, FaPause } from 'react-icons/fa'
import './FeaturedResearch.css'

// Featured projects with their associated videos
const FEATURED_PROJECTS_DATA = [
  {
    name: 'PHAST',
    video: null,
    gif: 'projects/phast/phast_monolithic_demo.gif',
  },
  {
    name: 'GRL-SNAM',
    video: null,
  },
  {
    name: 'Subsurface Flow Modeling',
    video: 'hydro6A80.mp4',
  },
  {
    name: 'Dynamic Belief Games',
    video: null,
  },
  {
    name: "Parkinson's Disease / Healthcare AI",
    video: null,
  },
]

const FeaturedResearch = ({ projectTiles }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(true)
  const [isPaused, setIsPaused] = React.useState(false)
  const videoRef = React.useRef(null)
  const timerRef = React.useRef(null)

  // Get featured projects from projectTiles
  const featuredProjects = React.useMemo(() => {
    const featuredNames = FEATURED_PROJECTS_DATA.map(p => p.name)
    return projectTiles
      .filter(tile => featuredNames.includes(tile.name))
      .map(tile => {
        const featuredData = FEATURED_PROJECTS_DATA.find(p => p.name === tile.name)
        return {
          ...tile,
          video: featuredData?.video || null,
          gif: featuredData?.gif || null,
        }
      })
      .sort((a, b) => {
        // Maintain order from FEATURED_PROJECTS_DATA
        const aIndex = FEATURED_PROJECTS_DATA.findIndex(p => p.name === a.name)
        const bIndex = FEATURED_PROJECTS_DATA.findIndex(p => p.name === b.name)
        return aIndex - bIndex
      })
  }, [projectTiles])

  const currentProject = featuredProjects[currentIndex]

  const goToNext = React.useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % featuredProjects.length)
  }, [featuredProjects.length])

  const goToPrev = React.useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + featuredProjects.length) % featuredProjects.length)
  }, [featuredProjects.length])

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = setInterval(goToNext, 3000)
  }, [goToNext])

  // Auto-rotation
  React.useEffect(() => {
    if (isPaused || featuredProjects.length <= 1) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }
    timerRef.current = setInterval(goToNext, 3000)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPaused, goToNext, featuredProjects.length])

  if (featuredProjects.length === 0) {
    return null
  }

  return (
    <div className="featured-research">
      <div className="featured-research-container">
        <h2 className="featured-research-title">Featured Research</h2>

        <div
          className="featured-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation - Previous */}
          <button
            className="carousel-nav carousel-nav-prev"
            onClick={() => {
              goToPrev()
              resetTimer()
            }}
            aria-label="Previous project"
          >
            <FaChevronLeft />
          </button>

          {/* Main Card */}
          <div className="featured-card-wrapper">
            {currentProject && (
              <div className="featured-card-horizontal">
                {/* Media Section */}
                <div className="featured-media">
                  {currentProject.video ? (
                    <div className="featured-video-wrapper">
                      <video
                        ref={videoRef}
                        className="featured-video"
                        src={require(`../videos/${currentProject.video}`).default}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                      <button
                        className="video-control-btn"
                        onClick={togglePlayPause}
                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                      </button>
                    </div>
                  ) : currentProject.gif ? (
                    <div className="featured-image-wrapper">
                      <img
                        src={require(`../images/${currentProject.gif}`).default}
                        alt={`${currentProject.name} preview`}
                        className="featured-image"
                      />
                    </div>
                  ) : (
                    <div className="featured-image-wrapper">
                      {currentProject.image &&
                      currentProject.image.childImageSharp &&
                      getImage(currentProject.image) ? (
                        <GatsbyImage
                          image={getImage(currentProject.image)}
                          alt={`${currentProject.name} preview`}
                          className="featured-image"
                        />
                      ) : (
                        <img
                          src={require(`../images/${currentProject.img_name}.png`).default}
                          alt={`${currentProject.name} preview`}
                          className="featured-image"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="featured-content">
                  <span className="featured-badge">Featured</span>
                  <h3 className="featured-project-title">{currentProject.name}</h3>
                  <p className="featured-project-description">{currentProject.description}</p>
                  <div className="featured-tags">
                    {currentProject.tags.map(tag => (
                      <span key={tag} className="featured-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {currentProject.link.startsWith('http') ? (
                    <a
                      href={currentProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="featured-link"
                    >
                      View Project →
                    </a>
                  ) : (
                    <Link to={currentProject.link} className="featured-link">
                      View Project →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation - Next */}
          <button
            className="carousel-nav carousel-nav-next"
            onClick={() => {
              goToNext()
              resetTimer()
            }}
            aria-label="Next project"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Indicators */}
        <div className="carousel-indicators">
          {featuredProjects.map((project, index) => (
            <button
              key={project.name}
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentIndex(index)
                resetTimer()
              }}
              aria-label={`Go to ${project.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

FeaturedResearch.propTypes = {
  projectTiles: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      img_name: PropTypes.string.isRequired,
      link: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      image: PropTypes.object,
    })
  ).isRequired,
}

export default FeaturedResearch
