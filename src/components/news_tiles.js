import * as React from 'react'
import PropTypes from 'prop-types'
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
import './news.css'

// Values are the `category` field of src/data/site/news.js and the ?category= value.
const CATEGORY_TABS = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'seminars', label: 'Seminars' },
]

// Hides the unfiltered server-rendered list on a hard load of a filtered URL (news.css).
const GATE_CLASS = 'news-filter-pending'

export const categoryGateScript = prepaintGateScript(GATE_CLASS, {
  category: CATEGORY_TABS.filter(tab => tab.value !== 'all').map(tab => tab.value),
})

const categoryFromUrl = () => {
  const requested = readQueryParam('category')
  return CATEGORY_TABS.some(tab => tab.value === requested) ? requested : 'all'
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

// 'YYYY-MM-DD' parsed by new Date() is UTC midnight, which formats as the previous
// day west of UTC and differs between server and client. Parse it as a local date.
const parseDate = dateStr => {
  if (typeof dateStr !== 'string') return new Date(NaN)
  const match = ISO_DATE.exec(dateStr.trim())
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
  const date = parseDate(dateStr)
  return isNaN(date.getTime()) ? null : date.getFullYear()
}

const NewsItem = ({ tile }) => {
  const dateString = formatDate(tile.date)
  const isoDate = typeof tile.date === 'string' ? tile.date.trim() : ''
  const body = (
    <>
      <h3 className="news-item-title">{tile.name}</h3>
      {tile.description && <p className="news-item-desc">{tile.description}</p>}
    </>
  )

  return (
    <li className={`news-item${tile.featured === true ? ' news-item--featured' : ''}`}>
      <div className="news-item-date">
        {ISO_DATE.test(isoDate) ? <time dateTime={isoDate}>{dateString}</time> : dateString}
      </div>
      <div className="news-item-content">
        {tile.link ? (
          <SmartLink className="news-item-link" to={tile.link}>
            {body}
          </SmartLink>
        ) : (
          <div className="news-item-body">{body}</div>
        )}
        {tile.category && (
          <span className={`news-category-badge news-category-badge--${tile.category}`}>
            {tile.category}
          </span>
        )}
      </div>
    </li>
  )
}

const NewsTiles = ({ newsTiles, locationSearch = '', locationKey }) => {
  const [activeCategory, setActiveCategory] = React.useState(() =>
    isHydrated() ? categoryFromUrl() : 'all'
  )
  const [urlSynced, setUrlSynced] = React.useState(isHydrated)

  useMarkHydrated()

  // The HTML always lists every category: apply ?category= before the first paint after
  // hydration, and again on every router navigation.
  useIsoLayoutEffect(() => {
    setActiveCategory(categoryFromUrl())
    setUrlSynced(true)
  }, [locationSearch, locationKey])

  useReleasePrepaintGate(GATE_CLASS, urlSynced)
  useRescrollToHash(urlSynced, activeCategory !== 'all')

  const sortedNewsTiles = React.useMemo(
    () =>
      (Array.isArray(newsTiles) ? [...newsTiles] : []).sort((a, b) => {
        const dateDifference = parseDate(b.date) - parseDate(a.date)
        if (dateDifference !== 0) return dateDifference
        return b.name.localeCompare(a.name)
      }),
    [newsTiles]
  )

  const yearGroups = React.useMemo(() => {
    const groups = []
    sortedNewsTiles
      .filter(tile => activeCategory === 'all' || tile.category === activeCategory)
      .forEach(tile => {
        const year = getYear(tile.date)
        const last = groups[groups.length - 1]
        if (last && (year === null || year === last.year)) last.tiles.push(tile)
        else groups.push({ year, tiles: [tile] })
      })
    return groups
  }, [sortedNewsTiles, activeCategory])

  const handleCategoryChange = value => {
    setActiveCategory(value)
    writeQueryParams({ category: value === 'all' ? '' : value })
  }

  if (sortedNewsTiles.length === 0) {
    return (
      <div className="news-container" id="news">
        <div className="page-container">
          <PageHeader title="News" />
          <div className="news-empty">
            <p>No news items found</p>
            <p>Please check back later for updates.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="news-container" id="news">
      <div className="page-container">
        <PageHeader title="News" />

        <Tabs
          className="news-tabs"
          label="Filter news by category"
          idBase="news-category"
          value={activeCategory}
          onChange={handleCategoryChange}
          items={CATEGORY_TABS}
        />

        {/* tabIndex -1: the panel holds the item links, so it is not a tab stop of its own. */}
        <div
          {...tabPanelProps('news-category', activeCategory)}
          tabIndex={-1}
          className="news-list"
        >
          {yearGroups.map(group => (
            <section
              key={group.year ?? 'undated'}
              className="news-year"
              aria-labelledby={group.year ? `news-year-${group.year}` : undefined}
            >
              {group.year && (
                <h2 id={`news-year-${group.year}`} className="news-year-header">
                  {group.year}
                </h2>
              )}
              <ul className="news-year-list">
                {group.tiles.map(tile => (
                  <NewsItem key={`${tile.date}-${tile.name}`} tile={tile} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

const newsTileShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  date: PropTypes.string,
  link: PropTypes.string,
  description: PropTypes.string,
  featured: PropTypes.bool,
  category: PropTypes.string,
})

NewsItem.propTypes = {
  tile: newsTileShape.isRequired,
}

NewsTiles.propTypes = {
  newsTiles: PropTypes.arrayOf(newsTileShape),
  locationSearch: PropTypes.string,
  locationKey: PropTypes.string,
}

export default NewsTiles
