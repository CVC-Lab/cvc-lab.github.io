import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import './tiles.css'

const NewsTiles = ({ newsTiles }) => {
  // Always declare hooks at the top level
  const [currentPage, setCurrentPage] = useState(1)

  // Wrap the initialization of safeNewsTiles in its own useMemo
  const safeNewsTiles = React.useMemo(() => {
    return Array.isArray(newsTiles) ? newsTiles : []
  }, [newsTiles])

  // Sort the news tiles by date (always run, even if empty array)
  const sortedNewsTiles = React.useMemo(() => {
    if (safeNewsTiles.length === 0) return []

    return [...safeNewsTiles].sort((a, b) => {
      const dateDifference = new Date(b.date) - new Date(a.date)
      if (dateDifference !== 0) return dateDifference
      return b.name.localeCompare(a.name)
    })
  }, [safeNewsTiles])

  const tilesPerPage = 20
  const lastTile = currentPage * tilesPerPage
  const firstTile = lastTile - tilesPerPage

  // Calculate current page of tiles (always run, even if empty array)
  const currentTiles = React.useMemo(() => {
    return sortedNewsTiles.slice(firstTile, lastTile)
  }, [sortedNewsTiles, firstTile, lastTile])

  const paginate = pageNumber => setCurrentPage(pageNumber)

  // Render placeholder if no news items
  if (safeNewsTiles.length === 0) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No news items found</h2>
        <p>Please check back later for updates.</p>
      </div>
    )
  }

  return (
    <div
      className="publications-class"
      id="news"
      style={{
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: `left`,
      }}
    >
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 1050,
          paddingBottom: `1.45rem`,
          marginLeft: `1.25rem`,
          marginRight: `1.25rem`,
          width: `100%`,
        }}
      >
        <h1
          className="header-subtitle"
          style={{
            color: `#333f48`,
            fontSize: `1.5rem`,
            fontWeight: `700`,
            margin: `auto`,
            textAlign: `center`,
            paddingBottom: `1.0rem`,
            paddingTop: `2.0rem`,
            marginBottom: '1rem',
          }}
        >
          News
        </h1>
        <div>
          {currentTiles.map(tile => {
            // Ensure date is valid
            let dateString = ''
            try {
              const date = new Date(tile.date)
              if (!isNaN(date.getTime())) {
                dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
              } else {
                dateString = 'Date unknown'
              }
            } catch {
              dateString = 'Date unknown'
            }

            const isExternalLink =
              tile.link && (tile.link.startsWith('http://') || tile.link.startsWith('https://'))

            return (
              <div key={tile.name} style={{ display: 'flex', marginBottom: '1.5rem' }}>
                <div
                  className="lower-container-pubs"
                  style={{ width: '120px', textAlign: 'right' }}
                >
                  <h3>{dateString}</h3>
                </div>
                <div style={{ flexBasis: '80%' }}>
                  {isExternalLink ? (
                    <a
                      style={{
                        color: `#333f48`,
                        textDecoration: `none`,
                        fontSize: `.73rem`,
                      }}
                      href={tile.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="lower-container-pubs">
                        <h3>{tile.name}</h3>
                        {tile.description && <h4>{tile.description}</h4>}
                      </div>
                    </a>
                  ) : (
                    <Link
                      style={{
                        color: `#333f48`,
                        textDecoration: `none`,
                        fontSize: `.73rem`,
                      }}
                      to={tile.link || '#'}
                    >
                      <div className="lower-container-pubs">
                        <h3>{tile.name}</h3>
                        {tile.description && <h4>{tile.description}</h4>}
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          {[...Array(Math.ceil(sortedNewsTiles.length / tilesPerPage)).keys()].map(pageNumber => (
            <button
              key={pageNumber + 1}
              onClick={() => paginate(pageNumber + 1)}
              style={{
                backgroundColor: currentPage === pageNumber + 1 ? '#333f48' : 'transparent',
                color: currentPage === pageNumber + 1 ? '#fff' : '#333f48',
                border: '1px solid #333f48',
                padding: '0.5rem',
                margin: '0.5rem',
                cursor: 'pointer',
              }}
            >
              {pageNumber + 1}
            </button>
          ))}
        </div>
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
    })
  ),
}

export default NewsTiles
