/**
 * Rules for src/data/publications.yaml, the list on /publications/.
 *
 * gatsby-node.js reads the file, checks it with validatePublications (an error fails the build,
 * a warning is printed) and hands publicationsForPage to the page. The Jest tests use the same
 * checks. The publications page imports PUBLICATION_TYPES, so this module stays free of Node
 * APIs: callers pass the file system checks in.
 */

// Each type is a heading on the page, in this order within a year. Any other value still
// shows, as an extra heading at the end of its year.
const PUBLICATION_TYPES = [
  'Journal Publications',
  'arXiv',
  'Conference Presentations & Publications',
  'Technical Reports',
  'Book',
  'Edited Books',
  'Book Chapters',
  'Multimedia',
]

const PUBLICATION_KEYS = [
  'title',
  'authors',
  'venue',
  'type',
  'year',
  'month',
  'pdf',
  'project',
  'doi',
  'arxiv',
  'thumbnail',
  'thumbnail_alt',
  'id',
]

const REQUIRED_KEYS = ['title', 'authors', 'type', 'year']

const TEXT_KEYS = [
  'title',
  'authors',
  'venue',
  'type',
  'pdf',
  'project',
  'doi',
  'arxiv',
  'thumbnail',
  'thumbnail_alt',
]

// What the page renders; the other keys are kept as records only.
const PAGE_KEYS = [
  'title',
  'authors',
  'venue',
  'type',
  'year',
  'pdf',
  'project',
  'thumbnail',
  'thumbnail_alt',
]

// Image folders that src/hooks/useCardImages.js processes as a whole; an image anywhere else
// must be listed in that file.
const ARTWORK_DIRS = ['publications', 'project_tiles', 'projects']
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg']

// UTF-8 punctuation decoded as Windows-1252, for example "â€™" for "’".
const MOJIBAKE = '\u00e2\u20ac'

const DOI = /^10\.\d{4,9}\/\S+$/
const ARXIV = /^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/

/** An empty value or the text NULL counts as absent, on the page as here. */
const isPresent = value =>
  typeof value === 'string' && value.trim() !== '' && value.trim() !== 'NULL'

const normalizeTitle = title => (typeof title === 'string' ? title : '').trim().replace(/\s+/g, ' ')

// The page keeps a pdf or project link only when it is a full http(s) URL or a site path.
const isWebLink = value => /^(?:https?:\/\/|\/)/i.test(value.trim())

const isSitePath = value => value.startsWith('/') && !value.startsWith('//')

const hasValue = value => value !== undefined && value !== null

const isMapping = value => value !== null && typeof value === 'object' && !Array.isArray(value)

const isFourDigitYear = value => Number.isInteger(value) && value >= 1000 && value <= 9999

// The href of every <a> in a venue ('' when it has none).
const venueHrefs = venue =>
  (venue.match(/<a\b[^>]*>/gi) || []).map(tag => {
    const match = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag)
    if (!match) return ''
    return [match[1], match[2], match[3]].find(value => value !== undefined)
  })

/**
 * Line number (1-based) of each top-level entry, for messages; empty when the file is not
 * written as a block list ("- title: ...").
 */
const entryLines = source => {
  const lines = []
  source.split(/\r?\n/).forEach((line, index) => {
    if (/^-(?:\s|$)/.test(line)) lines.push(index + 1)
  })
  return lines
}

/**
 * Checks the parsed file. Returns { errors, warnings }, one message per problem, each naming
 * the entry. An error is something the page would get wrong or drop; a warning is shown
 * correctly but probably not meant.
 *
 * options.lines          entryLines(source), to name the line of each entry
 * options.fileExists     path relative to the repository root -> boolean
 * options.isListedImage  path relative to src/images -> boolean (listed in useCardImages.js)
 */
const validatePublications = (entries, options) => {
  const settings = options || {}
  const lines = settings.lines || []
  const fileExists = settings.fileExists || (() => true)
  const isListedImage = settings.isListedImage || (() => false)
  const errors = []
  const warnings = []

  if (!Array.isArray(entries)) {
    errors.push('the file must be a list of entries, each starting with "- title:"')
    return { errors, warnings }
  }

  const seenTitles = new Map()
  const seenIds = new Map()
  let untrimmed = 0
  let previousYear = null

  entries.forEach((entry, index) => {
    const number = index + 1
    const line = lines.length === entries.length ? `, line ${lines[index]}` : ''
    const name =
      isMapping(entry) && typeof entry.title === 'string' && entry.title.trim()
        ? ` "${normalizeTitle(entry.title).slice(0, 60)}"`
        : ''
    const where = `entry ${number}${line}${name}`
    const error = message => errors.push(`${where}: ${message}`)
    const warn = message => warnings.push(`${where}: ${message}`)

    if (!isMapping(entry)) {
      error('is not a set of "key: value" lines')
      return
    }

    // A string value that isPresent; other types are reported below.
    const filled = key => typeof entry[key] === 'string' && isPresent(entry[key])

    Object.keys(entry).forEach(key => {
      if (!PUBLICATION_KEYS.includes(key)) {
        error(`unknown key "${key}" (allowed: ${PUBLICATION_KEYS.join(', ')})`)
      } else if (
        !REQUIRED_KEYS.includes(key) &&
        (!hasValue(entry[key]) || (typeof entry[key] === 'string' && !isPresent(entry[key])))
      ) {
        warn(`${key} is empty; leave the key out`)
      }
    })

    TEXT_KEYS.forEach(key => {
      const value = entry[key]
      if (!hasValue(value)) return
      if (typeof value !== 'string') {
        error(`${key} must be text; put the value in quotes`)
        return
      }
      if (value !== value.trim()) untrimmed += 1
      if (value.includes(MOJIBAKE)) {
        warn(`${key} contains mis-decoded characters ("${MOJIBAKE}"); retype them`)
      }
    })

    REQUIRED_KEYS.forEach(key => {
      if (!hasValue(entry[key])) error(`${key} is missing`)
      else if (typeof entry[key] === 'string' && !isPresent(entry[key])) error(`${key} is empty`)
    })

    if (isFourDigitYear(entry.year)) {
      if (previousYear !== null && entry.year > previousYear) {
        warn(
          `year ${entry.year} comes after an entry from ${previousYear}; keep newest years first`
        )
      }
      previousYear = entry.year
    } else if (typeof entry.year === 'string' && /^\d{4}$/.test(entry.year.trim())) {
      error(`year "${entry.year}" is in quotes; write the number alone: year: ${entry.year.trim()}`)
    } else if (hasValue(entry.year)) {
      error(`year ${JSON.stringify(entry.year)} is not a four-digit year`)
    }

    if (
      hasValue(entry.month) &&
      !(Number.isInteger(entry.month) && entry.month >= 1 && entry.month <= 12)
    ) {
      error(`month "${entry.month}" must be a number from 1 to 12`)
    }

    if (hasValue(entry.id)) {
      if (!Number.isInteger(entry.id) || entry.id < 1) {
        error(`id "${entry.id}" must be a whole number`)
      } else if (seenIds.has(entry.id)) {
        error(`id ${entry.id} is also used by entry ${seenIds.get(entry.id)}`)
      } else {
        seenIds.set(entry.id, number)
      }
    }

    if (filled('type')) {
      if (!PUBLICATION_TYPES.includes(entry.type.trim())) {
        warn(
          `type "${entry.type}" is not one of the known types; it shows as an extra heading at the end of its year`
        )
      }
    }

    ;['pdf', 'project'].forEach(key => {
      if (!filled(key)) return
      const link = entry[key].trim()
      if (!isWebLink(link)) {
        error(
          `${key} "${link}" is neither a full http(s) URL nor a site path starting with /; the page would drop it`
        )
      } else if (key === 'pdf' && isSitePath(link)) {
        const file = link.split(/[?#]/)[0].replace(/^\/+/, '')
        if (!fileExists(`static/${file}`)) warn(`pdf "${link}" has no file at static/${file}`)
      }
    })

    if (filled('venue')) {
      venueHrefs(entry.venue).forEach(href => {
        if (!/^https?:\/\//i.test(href.trim())) {
          warn(`venue link href "${href}" is not an http(s) URL; the page shows it as plain text`)
        }
      })
    }

    if (filled('doi') && !DOI.test(entry.doi)) {
      error(
        `doi "${entry.doi}" is not a DOI such as 10.1145/3337680 (no https://doi.org/ in front)`
      )
    }
    if (filled('arxiv') && !ARXIV.test(entry.arxiv)) {
      error(`arxiv "${entry.arxiv}" is not an arXiv identifier such as 2402.14081`)
    }

    if (filled('thumbnail')) {
      const image = entry.thumbnail.trim()
      const found = IMAGE_EXTENSIONS.map(extension => `${image}${extension}`).find(file =>
        fileExists(`src/images/${file}`)
      )
      if (!found) {
        error(`thumbnail "${image}": no file src/images/${image}.png (or .jpg, .jpeg)`)
      } else if (
        !ARTWORK_DIRS.includes(found.split('/').slice(0, -1).join('/')) &&
        !isListedImage(found)
      ) {
        error(
          `thumbnail src/images/${found} is not processed, so the page would drop it; move it to src/images/publications/`
        )
      }
      if (!filled('thumbnail_alt')) error('thumbnail needs a thumbnail_alt text')
    } else if (filled('thumbnail_alt')) {
      warn('thumbnail_alt without a thumbnail is not used')
    }

    if (
      typeof entry.title === 'string' &&
      isFourDigitYear(entry.year) &&
      typeof entry.type === 'string'
    ) {
      const key = `${normalizeTitle(entry.title)}\n${entry.year}\n${entry.type.trim()}`
      if (seenTitles.has(key)) {
        error(`duplicate of entry ${seenTitles.get(key)} (same title, year and type)`)
      } else {
        seenTitles.set(key, number)
      }
    }
  })

  if (untrimmed > 0) {
    warnings.push(
      `${untrimmed} value(s) start or end with spaces or line breaks (harmless; the page trims them)`
    )
  }

  return { errors, warnings }
}

/** The fields the page renders, in file order. */
const publicationsForPage = entries =>
  (Array.isArray(entries) ? entries : []).filter(isMapping).map(entry => {
    const fields = {}
    PAGE_KEYS.forEach(key => {
      if (hasValue(entry[key])) fields[key] = entry[key]
    })
    return fields
  })

module.exports = {
  PUBLICATION_TYPES,
  PUBLICATION_KEYS,
  isPresent,
  normalizeTitle,
  entryLines,
  validatePublications,
  publicationsForPage,
}
