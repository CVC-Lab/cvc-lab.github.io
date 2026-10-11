import * as React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { FaArrowRight, FaSearch, FaTimes } from 'react-icons/fa'
import { useCardImage } from '../hooks/useCardImages'
import PageHeader from './ui/PageHeader'
import SmartLink from './ui/SmartLink'
import Tabs, { tabPanelProps } from './ui/Tabs'
import {
  isHydrated,
  prepaintGateScript,
  readQueryParam,
  useIsoLayoutEffect,
  useMarkHydrated,
  useReleasePrepaintGate,
  useRescrollToHash,
  writeQueryParams,
} from './query-state'
import './tiles-modern.css'

// Values are the ?theme= slugs; labels match the `themes` entries in src/data/site/projects.js.
const PROJECT_TABS = [
  { value: 'all', label: 'All' },
  { value: 'healthcare-ai', label: 'Healthcare AI' },
  { value: 'world-models', label: 'World Models' },
  { value: 'ai-for-science', label: 'AI for Science' },
]

const PAST_PROJECTS_BEFORE = new Date('2023-01-01')

// Hides the unfiltered server-rendered list on a hard load of a filtered URL (tiles-modern.css).
const GATE_CLASS = 'projects-filter-pending'

export const filterGateScript = prepaintGateScript(GATE_CLASS, {
  q: true,
  theme: PROJECT_TABS.filter(tab => tab.value !== 'all').map(tab => tab.value),
})

const CARD_SIZES =
  '(min-width: 1200px) 300px, (min-width: 960px) 31vw, (min-width: 600px) 47vw, 92vw'
const FEATURED_CARD_SIZES =
  '(min-width: 1200px) 400px, (min-width: 960px) 31vw, (min-width: 600px) 47vw, 92vw'

// Lower case without accents; curly apostrophes made straight and dashes made spaces, so
// "port hamiltonian" finds "Port-Hamiltonian".
const normalise = value =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[-\u2010-\u2015]/g, ' ')

const projectCount = count => `${count} project${count === 1 ? '' : 's'}`

const isCurrent = tile => new Date(tile.date) >= PAST_PROJECTS_BEFORE

const themeFromUrl = () => {
  const theme = readQueryParam('theme')
  return PROJECT_TABS.some(tab => tab.value === theme) ? theme : 'all'
}

const queryFromUrl = () => readQueryParam('q') || ''

const ProjectCardLink = ({ tile, children }) => (
  <SmartLink to={tile.link} className="project-card-link">
    {children}
  </SmartLink>
)

const ProjectCard = ({ tile, featured = false }) => {
  const image = getImage(tile.image)

  return (
    <div className="project-card">
      <div className="project-card-image">
        <div className="project-card-image-frame">
          {image && (
            <GatsbyImage
              image={image}
              alt=""
              loading={featured ? 'eager' : 'lazy'}
              objectFit="contain"
              sizes={featured ? FEATURED_CARD_SIZES : CARD_SIZES}
            />
          )}
        </div>
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
        <div className="project-card-action" aria-hidden="true">
          <span>View Project</span>
          <FaArrowRight className="project-card-action-icon" />
        </div>
      </div>
    </div>
  )
}

const ProjectGrid = ({ tiles, className = 'projects-grid', featured = false }) => (
  <ul className={className}>
    {tiles.map(tile => (
      <li key={tile.name}>
        <ProjectCardLink tile={tile}>
          <ProjectCard tile={tile} featured={featured} />
        </ProjectCardLink>
      </li>
    ))}
  </ul>
)

const Tiles = ({ projectTiles, locationSearch = '', locationKey }) => {
  const [activeTab, setActiveTab] = React.useState(() => (isHydrated() ? themeFromUrl() : 'all'))
  const [searchInput, setSearchInput] = React.useState(() => (isHydrated() ? queryFromUrl() : ''))
  const [urlSynced, setUrlSynced] = React.useState(isHydrated)
  const [announcement, setAnnouncement] = React.useState('')
  const announcedSummary = React.useRef(null)
  const inputRef = React.useRef(null)

  useMarkHydrated()

  // Apply the URL before the first paint after hydration, and again on every router
  // navigation (Back, or the header link while filtered).
  useIsoLayoutEffect(() => {
    setActiveTab(themeFromUrl())
    setSearchInput(queryFromUrl())
    setUrlSynced(true)
  }, [locationSearch, locationKey])

  useReleasePrepaintGate(GATE_CLASS, urlSynced)

  const searchLabel = searchInput.trim()
  // Words of the query, single-space separated; a project matches when it contains every one.
  const query = normalise(searchLabel).split(/\s+/).filter(Boolean).join(' ')
  const hasQuery = query !== ''
  const activeTabLabel = PROJECT_TABS.find(tab => tab.value === activeTab).label
  const hasActiveFilters = activeTab !== 'all' || hasQuery

  useRescrollToHash(urlSynced, hasActiveFilters)

  React.useEffect(() => {
    if (!urlSynced) return undefined
    const timer = setTimeout(() => writeQueryParams({ q: searchLabel }), 300)
    return () => clearTimeout(timer)
  }, [urlSynced, searchLabel])

  const handleTabChange = value => {
    setActiveTab(value)
    writeQueryParams({ theme: value === 'all' ? '' : value })
  }

  const clearSearch = () => {
    setSearchInput('')
    writeQueryParams({ q: '' })
    inputRef.current?.focus({ preventScroll: true })
  }

  const clearFilters = () => {
    setActiveTab('all')
    setSearchInput('')
    writeQueryParams({ theme: '', q: '' })
    inputRef.current?.focus({ preventScroll: true })
  }

  const resolveCardImage = useCardImage()

  const sortedProjectTiles = React.useMemo(
    () =>
      projectTiles
        .map(tile => ({
          ...tile,
          image: resolveCardImage(tile.img_name),
          searchText: normalise(
            [tile.name, tile.description, ...tile.tags, ...tile.themes].join(' ')
          ),
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [projectTiles, resolveCardImage]
  )

  const featuredProjects = React.useMemo(
    () =>
      sortedProjectTiles
        .filter(tile => tile.featuredRank)
        .sort((a, b) => a.featuredRank - b.featuredRank),
    [sortedProjectTiles]
  )

  const visibleProjects = React.useMemo(() => {
    const words = query ? query.split(' ') : []
    return sortedProjectTiles.filter(
      tile =>
        (activeTab === 'all' || tile.themes.includes(activeTabLabel)) &&
        words.every(word => tile.searchText.includes(word))
    )
  }, [sortedProjectTiles, activeTab, activeTabLabel, query])

  const showFeaturedProjects = !hasActiveFilters && featuredProjects.length > 0
  const gridProjects = showFeaturedProjects
    ? visibleProjects.filter(tile => !tile.featuredRank)
    : visibleProjects
  const currentProjects = gridProjects.filter(isCurrent)
  const pastProjects = gridProjects.filter(tile => !isCurrent(tile))
  const totalVisibleProjects = visibleProjects.length

  let resultsSummary
  if (hasQuery && activeTab !== 'all') {
    resultsSummary = `Showing ${projectCount(totalVisibleProjects)} for "${searchLabel}" in ${activeTabLabel}`
  } else if (hasQuery) {
    resultsSummary = `Showing ${projectCount(totalVisibleProjects)} for "${searchLabel}"`
  } else if (activeTab !== 'all') {
    resultsSummary = `Showing ${projectCount(totalVisibleProjects)} in ${activeTabLabel}`
  } else {
    const currentCount = sortedProjectTiles.filter(isCurrent).length
    resultsSummary = `Showing ${sortedProjectTiles.length} projects: ${currentCount} current and ${
      sortedProjectTiles.length - currentCount
    } past`
  }

  // One status message per settled result, none per keystroke and none for the initial state.
  React.useEffect(() => {
    if (!urlSynced) return undefined
    if (announcedSummary.current === null) {
      announcedSummary.current = resultsSummary
      return undefined
    }
    if (resultsSummary === announcedSummary.current) return undefined
    const timer = setTimeout(() => {
      announcedSummary.current = resultsSummary
      setAnnouncement(resultsSummary)
    }, 500)
    return () => clearTimeout(timer)
  }, [urlSynced, resultsSummary])

  return (
    <div className="tiles-container" id="projects">
      <div className="page-container">
        <PageHeader
          title="All Projects"
          lede="Browse current research across Healthcare AI, World Models, and AI for Science."
        />

        <div className="project-controls">
          <div className="project-search-wrapper" role="search">
            <FaSearch className="project-search-icon" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              className="project-search-input"
              placeholder="Search projects..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape' && searchInput !== '') {
                  e.preventDefault()
                  clearSearch()
                }
              }}
              onBlur={() => writeQueryParams({ q: searchLabel })}
              aria-label="Search projects"
            />
            {searchInput !== '' && (
              <button
                type="button"
                className="project-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimes aria-hidden="true" />
              </button>
            )}
          </div>

          <Tabs
            className="project-tabs"
            label="Filter projects by theme"
            idBase="project-theme"
            value={activeTab}
            onChange={handleTabChange}
            items={PROJECT_TABS}
            wrap
          />

          <div className="project-controls-footer">
            <p className="project-results-summary">{resultsSummary}</p>
            <p className="visually-hidden" role="status">
              {announcement}
            </p>
            {/* Always rendered, so the first filter does not push the results down. Idle, it is only
                hidden: Firefox would restore a disabled state on reload, against the server HTML. */}
            <button
              type="button"
              className={`project-clear-filters-button${hasActiveFilters ? '' : ' project-clear-filters-button--idle'}`}
              onClick={clearFilters}
              aria-hidden={hasActiveFilters ? undefined : 'true'}
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* tabIndex -1: the panel holds 41 links, so it is not a tab stop of its own. */}
        <div
          {...tabPanelProps('project-theme', activeTab)}
          tabIndex={-1}
          className="project-results"
        >
          {showFeaturedProjects && (
            <section className="project-section" aria-labelledby="featured-projects-title">
              <h2 id="featured-projects-title" className="project-section-heading">
                Featured Projects
              </h2>
              <ProjectGrid tiles={featuredProjects} className="featured-projects-grid" featured />
            </section>
          )}

          {currentProjects.length > 0 && (
            <section className="project-section" aria-labelledby="current-projects-title">
              <h2 id="current-projects-title" className="project-section-heading visually-hidden">
                Current Projects
              </h2>
              <ProjectGrid tiles={currentProjects} />
            </section>
          )}

          {pastProjects.length > 0 && (
            <section
              className="project-section past-projects-section"
              aria-labelledby="past-projects-title"
            >
              <h2 id="past-projects-title" className="project-section-heading">
                Past Projects
              </h2>
              <ProjectGrid tiles={pastProjects} />
            </section>
          )}

          {totalVisibleProjects === 0 && hasQuery && (
            <p className="project-empty">No projects found matching &ldquo;{searchLabel}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  )
}

const tileShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  img_name: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  themes: PropTypes.arrayOf(PropTypes.string).isRequired,
  featuredRank: PropTypes.number,
  date: PropTypes.string,
  image: PropTypes.object,
})

Tiles.propTypes = {
  projectTiles: PropTypes.arrayOf(tileShape).isRequired,
  locationSearch: PropTypes.string,
  locationKey: PropTypes.string,
}

ProjectCardLink.propTypes = {
  tile: PropTypes.shape({ link: PropTypes.string.isRequired }).isRequired,
  children: PropTypes.node.isRequired,
}

ProjectCard.propTypes = {
  tile: tileShape.isRequired,
  featured: PropTypes.bool,
}

ProjectGrid.propTypes = {
  tiles: PropTypes.arrayOf(tileShape).isRequired,
  className: PropTypes.string,
  featured: PropTypes.bool,
}

export default Tiles
