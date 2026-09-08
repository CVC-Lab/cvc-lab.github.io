import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { Tabs, Tab } from '@mui/material'
import './tiles-modern.css'

const categoryTabs = ['All', 'News', 'Seminars']

// 'YYYY-MM-DD' parsed by new Date() is UTC midnight, which formats as the previous
// day west of UTC and differs between server and client. Parse it as a local date.
const parseDate = dateStr => {
  if (typeof dateStr !== 'string') return new Date(NaN)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim())
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return new Date(dateStr)
}

const formatDate = dateStr => {
  try {
    const date = parseDate(dateStr)
    if (isNaN(date.getTime())) return 'Date unknown'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return 'Date unknown'
  }
}

const getYear = dateStr => {
  try {
    const date = parseDate(dateStr)
    if (isNaN(date.getTime())) return null
    return date.getFullYear()
  } catch {
    return null
  }
}

const NewsTiles = ({ newsTiles }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [activeCategory, setActiveCategory] = useState('All')

  const safeNewsTiles = React.useMemo(() => {
    return Array.isArray(newsTiles) ? newsTiles : []
  }, [newsTiles])

  const sortedNewsTiles = React.useMemo(() => {
    if (safeNewsTiles.length === 0) return []
    return [...safeNewsTiles].sort((a, b) => {
      const dateDifference = parseDate(b.date) - parseDate(a.date)
      if (dateDifference !== 0) return dateDifference
      return b.name.localeCompare(a.name)
    })
  }, [safeNewsTiles])

  const filteredTiles = React.useMemo(() => {
    if (activeCategory === 'All') return sortedNewsTiles
    const categoryKey = activeCategory.toLowerCase()
    return sortedNewsTiles.filter(tile => tile.category === categoryKey)
  }, [sortedNewsTiles, activeCategory])

  const tilesPerPage = 20
  const totalPages = Math.ceil(filteredTiles.length / tilesPerPage)
  const lastTile = currentPage * tilesPerPage
  const firstTile = lastTile - tilesPerPage

  const currentTiles = React.useMemo(() => {
    return filteredTiles.slice(firstTile, lastTile)
  }, [filteredTiles, firstTile, lastTile])

  // Group current page tiles by year
  const tilesWithYearHeaders = React.useMemo(() => {
    const result = []
    let lastYear = null
    currentTiles.forEach(tile => {
      const year = getYear(tile.date)
      if (year && year !== lastYear) {
        result.push({ type: 'year-header', year })
        lastYear = year
      }
      result.push({ type: 'tile', tile })
    })
    return result
  }, [currentTiles])

  const handleCategoryChange = (_event, newValue) => {
    setActiveCategory(newValue)
    setCurrentPage(1)
  }

  const paginate = pageNumber => setCurrentPage(pageNumber)

  if (safeNewsTiles.length === 0) {
    return (
      <div className="news-empty">
        <h2>No news items found</h2>
        <p>Please check back later for updates.</p>
      </div>
    )
  }

  return (
    <div className="news-container" id="news">
      <div className="news-inner">
        <h1 className="news-page-title">News</h1>

        <div className="news-tabs-container">
          <Tabs
            value={activeCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="news categories"
          >
            {categoryTabs.map(tab => (
              <Tab label={tab} value={tab} key={tab} />
            ))}
          </Tabs>
        </div>

        <div className="news-list">
          {tilesWithYearHeaders.map((item, idx) => {
            if (item.type === 'year-header') {
              return (
                <div key={`year-${item.year}`} className="news-year-header">
                  <span>{item.year}</span>
                </div>
              )
            }

            const tile = item.tile
            const dateString = formatDate(tile.date)
            const isExternalLink =
              tile.link && (tile.link.startsWith('http://') || tile.link.startsWith('https://'))
            const isFeatured = tile.featured === true

            return (
              <div
                key={`${tile.name}-${idx}`}
                className={`news-item ${isFeatured ? 'news-item--featured' : ''}`}
              >
                <div className="news-item-date">
                  <span>{dateString}</span>
                </div>
                <div className="news-item-content">
                  {isExternalLink ? (
                    <a
                      className="news-item-link"
                      href={tile.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <h3 className="news-item-title">{tile.name}</h3>
                      {tile.description && <p className="news-item-desc">{tile.description}</p>}
                    </a>
                  ) : tile.link ? (
                    <Link className="news-item-link" to={tile.link}>
                      <h3 className="news-item-title">{tile.name}</h3>
                      {tile.description && <p className="news-item-desc">{tile.description}</p>}
                    </Link>
                  ) : (
                    <div className="news-item-link">
                      <h3 className="news-item-title">{tile.name}</h3>
                      {tile.description && <p className="news-item-desc">{tile.description}</p>}
                    </div>
                  )}
                  {tile.category && (
                    <span className={`news-category-badge news-category-badge--${tile.category}`}>
                      {tile.category}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div className="news-pagination">
            {[...Array(totalPages).keys()].map(pageNumber => (
              <button
                key={pageNumber + 1}
                onClick={() => paginate(pageNumber + 1)}
                className={`news-page-btn ${currentPage === pageNumber + 1 ? 'news-page-btn--active' : ''}`}
              >
                {pageNumber + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

NewsTiles.propTypes = {
  newsTiles: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      date: PropTypes.string,
      link: PropTypes.string,
      description: PropTypes.string,
      featured: PropTypes.bool,
      category: PropTypes.string,
    })
  ),
}

export default NewsTiles
