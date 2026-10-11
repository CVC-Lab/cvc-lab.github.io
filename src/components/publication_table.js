import * as React from 'react'
import PropTypes from 'prop-types'
import DOMPurify from 'isomorphic-dompurify'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { FaArrowUp } from 'react-icons/fa'
import { useCardImage } from '../hooks/useCardImages'
import { scrollBehavior } from '../hooks/motion'
import { PUBLICATION_TYPES, isPresent, normalizeTitle } from '../data/publications-schema'
import PageHeader from './ui/PageHeader'
import SmartLink, { resolveLink } from './ui/SmartLink'
import Lightbox from './ui/Lightbox'
import { useIsoLayoutEffect } from './query-state'
import { useIsClientRender } from './useIsClientRender'
import './publication_table.css'

const NEW_TAB_NOTE = ' (opens in a new tab)'

// Lower case without accents, so "vitanyi" also finds "Vitányi".
const foldText = text =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const toDoiOrg = href => href.replace(/^http:\/\/dx\.doi\.org\//i, 'https://doi.org/')

const resolvePdfLink = pdfLink => {
  if (!isPresent(pdfLink)) return null
  const href = pdfLink.trim()
  return /^(https?:\/\/|\/)/i.test(href) ? toDoiOrg(href) : null
}

const PREPRINT_LOCATION_PATTERN = /^\s*(arXiv|bioRxiv|medRxiv)/i

const getPaperLink = publication => {
  const href = resolvePdfLink(publication.pdf)
  if (!href) return null

  const isPreprint =
    publication.type === 'arXiv' || PREPRINT_LOCATION_PATTERN.test(publication.venue || '')
  // Outside the preprint servers a link is only called PDF when it points at one.
  const isPdf = !isPreprint && /pdf/i.test(href)

  return {
    href,
    className: isPreprint ? 'pub-link-paper' : 'pub-link-pdf',
    iconId: isPdf ? 'pub-icon-pdf' : 'pub-icon-paper',
    label: isPdf ? 'PDF' : 'Paper',
  }
}

const resolveProjectLink = projectLink => {
  if (!isPresent(projectLink)) return null
  const to = projectLink.trim()
  const { kind } = resolveLink(to)
  if (kind === 'anchor') return null
  return { to, external: kind === 'external' }
}

// Venue cells may carry markup. Sanitised once per record: links that are not
// http(s) become plain text, dx.doi.org links move to https://doi.org/, and the
// rest open in a new tab and say so. `text` is the venue without that note.
const sanitizeVenue = location => {
  const body = DOMPurify.sanitize(`<i>${location}</i>`, { RETURN_DOM: true })
  const text = body.textContent

  body.querySelectorAll('a').forEach(link => {
    const href = (link.getAttribute('href') || '').trim()
    if (!/^https?:\/\//i.test(href)) {
      link.replaceWith(...Array.from(link.childNodes))
      return
    }
    link.setAttribute('href', toDoiOrg(href))
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
    const note = body.ownerDocument.createElement('span')
    note.className = 'visually-hidden'
    note.textContent = NEW_TAB_NOTE
    link.appendChild(note)
  })

  return { html: body.innerHTML, text }
}

const getThumbnail = (publication, resolveCardImage) => {
  if (!isPresent(publication.thumbnail)) return null
  const image = getImage(resolveCardImage(publication.thumbnail.trim()))
  return image ? { image, alt: publication.thumbnail_alt } : null
}

// Entries come from src/data/publications.yaml, checked by gatsby-node.js.
const preparePublications = (publicationData, resolveCardImage) =>
  publicationData.map((publication, index) => {
    const title = normalizeTitle(publication.title)
    const year = String(publication.year).trim()
    const type = (publication.type || '').trim()
    const venue = isPresent(publication.venue) ? sanitizeVenue(publication.venue) : null

    return {
      id: index,
      year,
      type,
      title,
      authors: publication.authors,
      venueHtml: venue ? venue.html : '',
      pdf: getPaperLink(publication),
      project: resolveProjectLink(publication.project),
      thumbnail: getThumbnail(publication, resolveCardImage),
      haystack: foldText(
        [title, publication.authors || '', venue ? venue.text : '', year, type].join(' ')
      ),
    }
  })

// Types are listed in a fixed order, but anything the data carries that is not
// in that list is appended rather than dropped — a publication with an
// unexpected type would otherwise never render at all.
const orderTypes = types => {
  const known = PUBLICATION_TYPES.filter(type => types.includes(type))
  const unknown = types.filter(type => !PUBLICATION_TYPES.includes(type)).sort()
  return [...known, ...unknown]
}

// [{ year, types: [{ type, items }] }], newest year first.
const groupByYearAndType = publications => {
  const years = new Map()
  publications.forEach(publication => {
    if (!years.has(publication.year)) years.set(publication.year, new Map())
    const types = years.get(publication.year)
    if (!types.has(publication.type)) types.set(publication.type, [])
    types.get(publication.type).push(publication)
  })

  return [...years.keys()]
    .sort((a, b) => Number(b) - Number(a))
    .map(year => {
      const types = years.get(year)
      return {
        year,
        types: orderTypes([...types.keys()]).map(type => ({ type, items: types.get(type) })),
      }
    })
}

// The filter is kept in this history entry's state, not in the URL, so Back to the page
// renders the same list before Gatsby restores the saved scroll offset.
const EMPTY_FILTER = { query: '', type: '' }

const readSavedFilter = () => {
  const saved = window.history.state?.pubFilter
  return {
    query: typeof saved?.query === 'string' ? saved.query : '',
    type: typeof saved?.type === 'string' ? saved.type : '',
  }
}

const saveFilter = (query, type) => {
  const { pubFilter: saved, ...state } = window.history.state || {}
  const isFiltered = query !== '' || type !== ''
  if (isFiltered ? saved?.query === query && saved?.type === type : !saved) return
  try {
    // Same state otherwise (Gatsby's location key) and same URL.
    window.history.replaceState(isFiltered ? { ...state, pubFilter: { query, type } } : state, '')
  } catch {
    // Safari throws after 100 history calls in 30 seconds; the next change writes again.
  }
}

// A reload, or Back/Forward into this document: the cases in which the shell restores the saved
// scroll offset too (gatsby-browser.js). Chromium and WebKit also keep history.state when a
// link or the address bar loads the URL already shown; that is a new visit.
const isHistoryLoad = () => {
  try {
    const type = window.performance.getEntriesByType('navigation')[0]?.type
    return type === 'reload' || type === 'back_forward'
  } catch {
    return false
  }
}

// The offset Gatsby saved for this history entry, which the shell restores on such a load
// (gatsby-browser.js writes the same sessionStorage key).
const savedOffset = () => {
  try {
    const key = `@@scroll|${window.location.pathname}|${window.history.state?.key}`
    const offset = JSON.parse(window.sessionStorage.getItem(key))
    return Number.isFinite(offset) ? offset : null
  } catch {
    return null
  }
}

// Without JavaScript the search and type controls cannot filter anything.
const NO_SCRIPT_CSS = '.pub-filter{display:none}'

const jumpToYear = (event, year) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }
  const section = document.getElementById(`year-${year}`)
  if (!section) return
  event.preventDefault()
  // Always instant: a smooth jump across this page lands short in WebKit.
  section.scrollIntoView({ behavior: 'instant', block: 'start' })
  // Same history entry and state, so Gatsby's scroll bookkeeping survives.
  window.history.replaceState(window.history.state, '', `#year-${year}`)
  section.querySelector('.year-header')?.focus({ preventScroll: true })
}

// One <symbol> per icon, referenced with <use>. Rendering react-icons inline put
// a full SVG in every one of the ~800 link buttons: 340 KB of HTML on this page.
const PubIconSprite = () => (
  <svg aria-hidden="true" focusable="false" style={{ display: 'none' }}>
    <symbol id="pub-icon-pdf" viewBox="0 0 384 512">
      <path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z" />
    </symbol>
    <symbol id="pub-icon-paper" viewBox="0 0 384 512">
      <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-64c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-72v8c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm96-114.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z" />
    </symbol>
    <symbol id="pub-icon-external" viewBox="0 0 512 512">
      <path d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" />
    </symbol>
  </svg>
)

const PubIcon = ({ id }) => (
  <svg className="pub-link-icon" aria-hidden="true" focusable="false">
    <use href={`#${id}`} />
  </svg>
)

PubIcon.propTypes = { id: PropTypes.string.isRequired }

const publicationShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  authors: PropTypes.string,
  venueHtml: PropTypes.string,
  pdf: PropTypes.shape({
    href: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
    iconId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }),
  project: PropTypes.shape({
    to: PropTypes.string.isRequired,
    external: PropTypes.bool.isRequired,
  }),
  thumbnail: PropTypes.shape({
    image: PropTypes.object.isRequired,
    alt: PropTypes.string,
  }),
})

// The content of one card. Memoised: opening the preview, scrolling or filtering
// never re-renders (or re-sanitises) the cards themselves.
const PublicationCard = React.memo(function PublicationCard({ publication, onPreview }) {
  const { title, authors, venueHtml, pdf, project, thumbnail } = publication

  return (
    <>
      {thumbnail && (
        <button
          type="button"
          className="publication-thumbnail"
          onClick={event => onPreview(publication, event.currentTarget)}
          aria-label={`Preview thumbnail for ${title}`}
        >
          <GatsbyImage
            image={thumbnail.image}
            alt={thumbnail.alt}
            sizes="235px"
            objectFit="contain"
          />
        </button>
      )}
      <div className="lower-container-pubs">
        <h4 className="pub-title">{title}</h4>
        <p className="pub-authors">{authors}</p>
        {venueHtml && <p className="pub-venue" dangerouslySetInnerHTML={{ __html: venueHtml }} />}
        {(pdf || project) && (
          <div className="pub-links">
            {pdf && (
              <a
                href={pdf.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`pub-link-btn ${pdf.className}`}
                aria-label={`${pdf.label}: ${title}${NEW_TAB_NOTE}`}
              >
                <PubIcon id={pdf.iconId} />
                {pdf.label}
              </a>
            )}
            {project && (
              <SmartLink
                to={project.to}
                newTab={project.external}
                className="pub-link-btn pub-link-project"
                aria-label={`Project Page: ${title}${project.external ? NEW_TAB_NOTE : ''}`}
              >
                <PubIcon id="pub-icon-external" />
                Project Page
              </SmartLink>
            )}
          </div>
        )}
      </div>
    </>
  )
})

PublicationCard.propTypes = {
  publication: publicationShape.isRequired,
  onPreview: PropTypes.func.isRequired,
}

// Every card stays mounted; a filter only toggles `hidden`, so clearing it does
// not rebuild 480 cards. `matches` is null when nothing is filtered.
const PublicationList = React.memo(function PublicationList({ groups, matches, onPreview }) {
  const isShown = publication => !matches || matches.has(publication.id)

  return (
    <div className="publication-list">
      {groups.map(({ year, types }) => (
        <div
          key={year}
          id={`year-${year}`}
          className="year-section"
          hidden={!types.some(({ items }) => items.some(isShown))}
        >
          <h2 className="year-header" tabIndex={-1}>
            {year}
          </h2>
          <hr className="year-divider" aria-hidden="true" />
          {types.map(({ type, items }) => (
            <div key={type} className="type-section" hidden={!items.some(isShown)}>
              <h3 className="type-header">{type}</h3>
              <ul className="pub-type-list">
                {items.map(publication => (
                  <li
                    key={publication.id}
                    className="publication-card"
                    hidden={!isShown(publication)}
                  >
                    <PublicationCard publication={publication} onPreview={onPreview} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
})

PublicationList.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      year: PropTypes.string.isRequired,
      types: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string.isRequired,
          items: PropTypes.arrayOf(publicationShape).isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  matches: PropTypes.instanceOf(Set),
  onPreview: PropTypes.func.isRequired,
}

const YearNav = React.memo(function YearNav({ years }) {
  if (years.length === 0) return null

  return (
    <nav className="year-nav" aria-label="Jump to year">
      {years.map(year => (
        <a
          key={year}
          className="year-nav-btn"
          href={`#year-${year}`}
          onClick={event => jumpToYear(event, year)}
        >
          {year}
        </a>
      ))}
    </nav>
  )
})

YearNav.propTypes = {
  years: PropTypes.arrayOf(PropTypes.string).isRequired,
}

const PublicationFilters = ({
  query,
  type,
  typeOptions,
  total,
  shown,
  onQueryChange,
  onTypeChange,
  onClear,
  onBlur,
  restored,
}) => {
  const inputRef = React.useRef(null)
  const isFiltered = query !== '' || type !== ''
  const countText =
    shown === null ? `${total} publications` : `Showing ${shown} of ${total} publications`

  // One status message once typing has paused, not one per keystroke; none for the first render
  // or for a filter restored after a reload.
  const [announcement, setAnnouncement] = React.useState('')
  const announced = React.useRef(null)
  React.useEffect(() => {
    if (announced.current === null || restored) {
      announced.current = countText
      return undefined
    }
    const timer = setTimeout(() => {
      if (countText === announced.current) return
      announced.current = countText
      setAnnouncement(countText)
    }, 500)
    return () => clearTimeout(timer)
  }, [countText, query, type, restored])

  const clear = () => {
    onClear()
    inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <form
      className="pub-filter"
      role="search"
      aria-label="Filter publications"
      onSubmit={event => event.preventDefault()}
      onBlur={onBlur}
    >
      <div className="pub-filter__field pub-filter__field--search">
        <label className="pub-filter__label" htmlFor="pub-filter-q">
          Search
        </label>
        <input
          ref={inputRef}
          id="pub-filter-q"
          className="pub-filter__input"
          type="search"
          placeholder="Title, author or venue"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={event => onQueryChange(event.target.value)}
        />
      </div>
      <div className="pub-filter__field pub-filter__field--type">
        <label className="pub-filter__label" htmlFor="pub-filter-type">
          Type
        </label>
        <select
          id="pub-filter-type"
          className="pub-filter__select"
          value={type}
          onChange={event => onTypeChange(event.target.value)}
        >
          <option value="">All types ({total})</option>
          {typeOptions.map(option => (
            <option key={option.type} value={option.type}>
              {option.type} ({option.count})
            </option>
          ))}
        </select>
      </div>
      <div className="pub-filter__status">
        <p className="pub-filter__count">{countText}</p>
        <p className="visually-hidden" role="status">
          {announcement}
        </p>
        {/* Always laid out, so the first keystroke does not move the page. Hidden, not disabled:
            Firefox carries a button's disabled state across a reload, past the server HTML. */}
        <button
          type="button"
          className={`pub-filter__clear${isFiltered ? '' : ' pub-filter__clear--idle'}`}
          onClick={clear}
        >
          Clear
        </button>
      </div>
    </form>
  )
}

PublicationFilters.propTypes = {
  query: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  typeOptions: PropTypes.arrayOf(
    PropTypes.shape({ type: PropTypes.string.isRequired, count: PropTypes.number.isRequired })
  ).isRequired,
  total: PropTypes.number.isRequired,
  shown: PropTypes.number,
  onQueryChange: PropTypes.func.isRequired,
  onTypeChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  restored: PropTypes.bool.isRequired,
}

const BackToTop = () => {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const update = () => setVisible(window.scrollY > 400)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (!visible) return null

  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search
      )
    }
    // Keyboard users continue from the top of the page, not from the vanished button.
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }

  return (
    <button type="button" className="back-to-top" onClick={backToTop} aria-label="Back to top">
      <FaArrowUp aria-hidden="true" focusable="false" />
    </button>
  )
}

const PublicationTable = ({ publicationData = [] }) => {
  const resolveCardImage = useCardImage()
  const publications = React.useMemo(
    () => preparePublications(publicationData, resolveCardImage),
    [publicationData, resolveCardImage]
  )
  const groups = React.useMemo(() => groupByYearAndType(publications), [publications])
  const typeOptions = React.useMemo(() => {
    const counts = new Map()
    publications.forEach(({ type }) => counts.set(type, (counts.get(type) || 0) + 1))
    return orderTypes([...counts.keys()]).map(type => ({ type, count: counts.get(type) }))
  }, [publications])

  const isClientRender = useIsClientRender()
  const [hydrating] = React.useState(!isClientRender)
  const [initialFilter] = React.useState(() => (isClientRender ? readSavedFilter() : EMPTY_FILTER))
  const [query, setQuery] = React.useState(initialFilter.query)
  const [type, setType] = React.useState(initialFilter.type)
  // A filter restored after hydration is listed at once, without the delay typing gets.
  const [restoredFilter, setRestoredFilter] = React.useState(null)
  const deferredQuery = React.useDeferredValue(query)
  const deferredType = React.useDeferredValue(type)
  const listQuery = restoredFilter ? restoredFilter.query : deferredQuery
  const listType = restoredFilter ? restoredFilter.type : deferredType

  // The server HTML, and so the hydrating render, is unfiltered. After a reload, or Back to this
  // document from another one, the entry's saved filter is applied before the next paint, and
  // the saved offset, which the shell has just restored against the unfiltered list, is
  // restored again against the filtered one. On a new visit a filter left in the entry is
  // dropped.
  const restoredOffset = React.useRef(null)
  useIsoLayoutEffect(() => {
    if (!hydrating) return
    const saved = readSavedFilter()
    if (saved.query === '' && saved.type === '') return
    if (!isHistoryLoad()) {
      saveFilter('', '')
      return
    }
    restoredOffset.current = savedOffset()
    setRestoredFilter(saved)
    setQuery(saved.query)
    setType(saved.type)
  }, [hydrating])
  useIsoLayoutEffect(() => {
    if (restoredFilter === null || restoredOffset.current === null) return
    window.scrollTo(0, restoredOffset.current)
    restoredOffset.current = null
  }, [restoredFilter])

  const matches = React.useMemo(() => {
    const tokens = foldText(listQuery).split(/\s+/).filter(Boolean)
    if (tokens.length === 0 && !listType) return null
    return new Set(
      publications
        .filter(
          publication =>
            (!listType || publication.type === listType) &&
            tokens.every(token => publication.haystack.includes(token))
        )
        .map(publication => publication.id)
    )
  }, [publications, listQuery, listType])

  const years = React.useMemo(
    () =>
      groups
        .filter(
          ({ types }) =>
            !matches || types.some(({ items }) => items.some(({ id }) => matches.has(id)))
        )
        .map(({ year }) => year),
    [groups, matches]
  )

  const changeQuery = React.useCallback(value => {
    setRestoredFilter(null)
    setQuery(value)
  }, [])
  const changeType = React.useCallback(value => {
    setRestoredFilter(null)
    setType(value)
  }, [])
  const clearFilters = React.useCallback(() => {
    setRestoredFilter(null)
    setQuery('')
    setType('')
  }, [])

  // Saved once typing pauses and when focus leaves the controls (before a click on a link), and
  // only to the history entry the change was made on. Nothing is saved on mount: the entry
  // already holds what the first render shows or what the restore above applies.
  const filterEntry = React.useRef(undefined)
  const saveToEntry = React.useCallback(() => {
    if (window.history.state?.key === filterEntry.current) saveFilter(query, type)
  }, [query, type])
  const isFirstSave = React.useRef(true)
  React.useEffect(() => {
    filterEntry.current = window.history.state?.key
    if (isFirstSave.current) {
      isFirstSave.current = false
      return undefined
    }
    const timer = setTimeout(saveToEntry, 250)
    return () => clearTimeout(timer)
  }, [saveToEntry])
  // The entry can change while this page stays on screen (the skip link's #main-content, the
  // header's Publications link, which replaces it, Back between them): it gets the filter too.
  const pagePath = React.useRef(null)
  React.useEffect(() => {
    if (pagePath.current === null) pagePath.current = window.location.pathname
    const key = window.history.state?.key
    if (key === filterEntry.current || window.location.pathname !== pagePath.current) return
    filterEntry.current = key
    saveFilter(query, type)
  })

  const [preview, setPreview] = React.useState(null)
  const previewOpener = React.useRef(null)
  const openPreview = React.useCallback((publication, opener) => {
    previewOpener.current = opener
    setPreview({
      title: publication.title,
      image: publication.thumbnail.image,
      alt: publication.thumbnail.alt,
    })
  }, [])
  const closePreview = React.useCallback(() => {
    setPreview(null)
    // Safari does not focus a clicked button, so the dialog would hand focus back to <main>.
    window.requestAnimationFrame(() => previewOpener.current?.focus({ preventScroll: true }))
  }, [])

  return (
    <div className="publications-class" id="publications">
      <PubIconSprite />
      <div className="page-container">
        <PageHeader title="Publications" />
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: NO_SCRIPT_CSS }} />
        </noscript>
        <PublicationFilters
          query={query}
          type={type}
          typeOptions={typeOptions}
          total={publications.length}
          shown={matches ? matches.size : null}
          onQueryChange={changeQuery}
          onTypeChange={changeType}
          onClear={clearFilters}
          onBlur={saveToEntry}
          restored={restoredFilter !== null}
        />
        <YearNav years={years} />
        {matches && matches.size === 0 && <p className="pub-empty">No publications match.</p>}
        <PublicationList groups={groups} matches={matches} onPreview={openPreview} />
      </div>

      <BackToTop />

      <Lightbox
        open={Boolean(preview)}
        onClose={closePreview}
        label={preview ? `Preview image for ${preview.title}` : 'Image preview'}
        caption={preview?.title}
        image={preview?.image}
        alt={preview?.alt}
      />
    </div>
  )
}

PublicationTable.propTypes = {
  publicationData: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      authors: PropTypes.string,
      venue: PropTypes.string,
      type: PropTypes.string,
      year: PropTypes.number,
      pdf: PropTypes.string,
      project: PropTypes.string,
      thumbnail: PropTypes.string,
      thumbnail_alt: PropTypes.string,
    })
  ),
}

export default PublicationTable
