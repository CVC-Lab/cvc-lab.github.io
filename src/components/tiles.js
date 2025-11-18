import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { Container, Tabs, Tab } from '@mui/material'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import './tiles-modern.css'

const projectTabs = [
  'All',
  'Computer Vision',
  'Reinforcement Learning',
  'Scientific ML',
  'Health AI/ML',
]

const Tiles = ({ projectTiles }) => {
  const [activeTab, setActiveTab] = React.useState('All')

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const sortedProjectTiles = React.useMemo(() => {
    if (!projectTiles || projectTiles.length === 0) {
      return []
    }
    return projectTiles.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [projectTiles])

  const { currentProjects, pastProjects } = React.useMemo(() => {
    const cutoffDate = new Date('2023-01-01')
    const current = sortedProjectTiles.filter(tile => new Date(tile.date) >= cutoffDate)
    const past = sortedProjectTiles.filter(tile => new Date(tile.date) < cutoffDate)
    return { currentProjects: current, pastProjects: past }
  }, [sortedProjectTiles])

  const filteredCurrentProjects = React.useMemo(() => {
    if (activeTab === 'All') {
      return currentProjects
    }
    return currentProjects.filter(tile => tile.tags.includes(activeTab))
  }, [currentProjects, activeTab])

  const filteredPastProjects = React.useMemo(() => {
    if (activeTab === 'All') {
      return pastProjects
    }
    return pastProjects.filter(tile => tile.tags.includes(activeTab))
  }, [pastProjects, activeTab])

  return (
    <div className="tiles-container" id="projects">
      <Container maxWidth="lg">
        <h2 className="section-title">Innovative Research</h2>
        <p className="section-subtitle">
          Discover our groundbreaking projects at the intersection of computation, visualization,
          and applied science at the Oden Institute.
        </p>

        <div className="tabs-container">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="project categories"
          >
            {projectTabs.map(tab => (
              <Tab label={tab} value={tab} key={tab} />
            ))}
          </Tabs>
        </div>

        {/* Current Projects Section */}
        {filteredCurrentProjects.length > 0 && (
          <>
            <h3 className="subsection-title">Current Projects</h3>
            <div className="projects-grid">
              {filteredCurrentProjects.map(tile => (
                <div key={tile.name}>
                  {tile.link.startsWith('http') ? (
                    <a
                      href={tile.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <ProjectCard tile={tile} />
                    </a>
                  ) : (
                    <Link to={tile.link} style={{ textDecoration: 'none' }}>
                      <ProjectCard tile={tile} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Past Projects Section */}
        {filteredPastProjects.length > 0 && (
          <>
            <h3 className="subsection-title">Past Projects</h3>
            <div className="projects-grid">
              {filteredPastProjects.map(tile => (
                <div key={tile.name}>
                  {tile.link.startsWith('http') ? (
                    <a
                      href={tile.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <ProjectCard tile={tile} />
                    </a>
                  ) : (
                    <Link to={tile.link} style={{ textDecoration: 'none' }}>
                      <ProjectCard tile={tile} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Container>
    </div>
  )
}

// Separate ProjectCard component for better organization
const ProjectCard = ({ tile }) => {
  return (
    <div className="project-card">
      <div className="project-card-image">
        {tile.image && tile.image.childImageSharp && getImage(tile.image) ? (
          <GatsbyImage
            image={getImage(tile.image)}
            alt={`${tile.name} project preview`}
            loading="lazy"
          />
        ) : (
          <img
            src={require(`../images/${tile.img_name}.png`).default}
            alt={`${tile.name} project preview`}
          />
        )}
      </div>
      <div className="project-card-content">
        <h3 className="project-card-title">{tile.name}</h3>
        <p className="project-card-description">{tile.description}</p>
        <div className="project-card-tags">
          {tile.tags.map(tag => (
            <span key={tag} className="project-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

Tiles.propTypes = {
  projectTiles: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      img_name: PropTypes.string.isRequired,
      link: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      date: PropTypes.string,
      image: PropTypes.object,
    })
  ).isRequired,
}

ProjectCard.propTypes = {
  tile: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    img_name: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    image: PropTypes.object,
  }).isRequired,
}

export default Tiles
