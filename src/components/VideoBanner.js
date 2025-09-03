import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import LaunchIcon from '@mui/icons-material/Launch'
import './VideoBanner.css'

const VideoBanner = ({ videos = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loadedVideos, setLoadedVideos] = useState(new Set([0])) // Preload first video
  const videoRef = useRef(null)

  // Preload adjacent videos
  useEffect(() => {
    const toLoad = new Set(loadedVideos)
    // Load current, previous, and next videos
    const indicesToLoad = [
      currentIndex,
      (currentIndex - 1 + videos.length) % videos.length,
      (currentIndex + 1) % videos.length,
    ]
    indicesToLoad.forEach(idx => toLoad.add(idx))
    setLoadedVideos(toLoad)
  }, [currentIndex, videos.length, loadedVideos])

  const handlePrevious = () => {
    setIsPlaying(false)
    setCurrentIndex(prev => (prev - 1 + videos.length) % videos.length)
  }

  const handleNext = () => {
    setIsPlaying(false)
    setCurrentIndex(prev => (prev + 1) % videos.length)
  }

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

  const handleVideoEnd = () => {
    setIsPlaying(false)
    // Auto-advance to next video
    handleNext()
  }

  if (!videos || videos.length === 0) {
    return null
  }

  const currentVideo = videos[currentIndex]

  return (
    <div className="video-banner">
      <div className="video-banner-container">
        <h2 className="video-banner-title">Research Highlights</h2>

        <div className="video-showcase">
          <button
            className="video-nav-button video-nav-prev"
            onClick={handlePrevious}
            aria-label="Previous video"
          >
            <ChevronLeftIcon />
          </button>

          <div className="video-wrapper">
            <video
              ref={videoRef}
              key={currentVideo.src} // Force remount on video change
              className="showcase-video"
              onEnded={handleVideoEnd}
              onClick={togglePlayPause}
              poster={currentVideo.poster}
              preload="metadata"
              muted
              playsInline
            >
              {loadedVideos.has(currentIndex) && <source src={currentVideo.src} type="video/mp4" />}
              <track kind="captions" srcLang="en" label="English captions" />
              Your browser does not support the video tag.
            </video>

            <button
              className="video-play-button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </button>

            <div className="video-info">
              <h3>{currentVideo.title}</h3>
              <p>{currentVideo.description}</p>
              {currentVideo.projectLink && (
                <Link to={currentVideo.projectLink} className="video-project-link">
                  View Project <LaunchIcon fontSize="small" />
                </Link>
              )}
            </div>
          </div>

          <button
            className="video-nav-button video-nav-next"
            onClick={handleNext}
            aria-label="Next video"
          >
            <ChevronRightIcon />
          </button>
        </div>

        <div className="video-indicators">
          {videos.map((_, index) => (
            <button
              key={index}
              className={`video-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setIsPlaying(false)
                setCurrentIndex(index)
              }}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

VideoBanner.propTypes = {
  videos: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      poster: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      projectLink: PropTypes.string,
    })
  ),
}

export default VideoBanner
