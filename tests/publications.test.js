import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import {
  PUBLICATION_KEYS,
  entryLines,
  publicationsForPage,
  validatePublications,
} from '../src/data/publications-schema'

const ROOT = path.join(__dirname, '..')
const SOURCE = fs.readFileSync(path.join(ROOT, 'src/data/publications.yaml'), 'utf8')
const fileExists = file => fs.existsSync(path.join(ROOT, file))
const cardImages = fs.readFileSync(path.join(ROOT, 'src/hooks/useCardImages.js'), 'utf8')
const isListedImage = image => cardImages.includes(`"${image}"`)

const load = source => yaml.load(source, { schema: yaml.CORE_SCHEMA })
const check = entries => validatePublications(entries, { fileExists, isListedImage })

const valid = {
  title: 'A Paper Title',
  authors: 'A. Author, C. Bajaj',
  venue: 'Some Journal, 2024, <a href="https://doi.org/10.1000/abc">doi</a>',
  type: 'Journal Publications',
  year: 2024,
  month: 5,
  pdf: 'https://example.org/paper.pdf',
  project: '/projects/phast/',
  doi: '10.1000/abc',
  arxiv: '2402.14081',
  thumbnail: 'publications/PUB_QC-PHAST_Search',
  thumbnail_alt: 'QC-PHAST Search publication thumbnail',
  id: 1,
}
const withEntry = changes => {
  const entry = { ...valid, ...changes }
  Object.keys(entry).forEach(key => entry[key] === undefined && delete entry[key])
  return entry
}

describe('src/data/publications.yaml', () => {
  const entries = load(SOURCE)

  test('passes every check the build runs', () => {
    const { errors } = validatePublications(entries, {
      lines: entryLines(SOURCE),
      fileExists,
      isListedImage,
    })
    expect(errors).toEqual([])
    expect(entries.length).toBeGreaterThan(400)
  })

  test('gives the page the fields it renders, in file order', () => {
    const page = publicationsForPage(entries)
    expect(page).toHaveLength(entries.length)
    expect(page[0].title).toBe(entries[0].title)
    page.forEach(entry => {
      expect(typeof entry.title).toBe('string')
      expect(typeof entry.authors).toBe('string')
      expect(Number.isInteger(entry.year)).toBe(true)
      expect(entry).not.toHaveProperty('doi')
      expect(entry).not.toHaveProperty('id')
    })
  })

  test('names the line of every entry', () => {
    expect(entryLines(SOURCE)).toHaveLength(entries.length)
  })
})

describe('validatePublications', () => {
  const errorsFor = entry => check([entry]).errors

  test('accepts a complete entry', () => {
    expect(check([valid])).toEqual({ errors: [], warnings: [] })
  })

  test.each([
    ['title', 'title is missing'],
    ['authors', 'authors is missing'],
    ['type', 'type is missing'],
    ['year', 'year is missing'],
  ])('a missing %s is an error', (key, message) => {
    expect(errorsFor(withEntry({ [key]: undefined }))).toEqual([expect.stringContaining(message)])
  })

  test.each([
    [{ title: '' }, 'title is empty'],
    [{ authors: 'NULL' }, 'authors is empty'],
    [{ year: '2024' }, 'year "2024" is in quotes'],
    [{ year: 'MMXXIV' }, 'year "MMXXIV" is not a four-digit year'],
    [{ year: 24 }, 'not a four-digit year'],
    [{ year: 20245 }, 'not a four-digit year'],
    [{ pdf: '2024_AAAI_EventDeblur.pdf' }, 'the page would drop it'],
    [{ project: 'projects/phast' }, 'the page would drop it'],
    [{ project: '#method' }, 'the page would drop it'],
    [{ thumbnail: 'publications/No such image' }, 'no file src/images/publications/No such'],
    [{ thumbnail_alt: undefined }, 'thumbnail needs a thumbnail_alt'],
    [{ titel: 'Typo' }, 'unknown key "titel"'],
    [{ title: 1984 }, 'title must be text'],
    [{ arxiv: 2402.14081 }, 'arxiv must be text'],
    [{ month: 13 }, 'month "13" must be a number from 1 to 12'],
    [{ doi: 'https://doi.org/10.1000/abc' }, 'is not a DOI'],
    [{ arxiv: 'arXiv:2402.14081' }, 'is not an arXiv identifier'],
  ])('%j is an error', (changes, message) => {
    expect(errorsFor(withEntry(changes))).toEqual([expect.stringContaining(message)])
  })

  test('a thumbnail outside the processed image folders is an error unless listed', () => {
    const entry = withEntry({ thumbnail: 'projects/some_project/figure' })
    const options = { fileExists: file => file.endsWith('figure.png') }
    expect(validatePublications([entry], options).errors).toEqual([
      expect.stringContaining('src/images/projects/some_project/figure.png is not processed'),
    ])
    const listed = {
      ...options,
      isListedImage: image => image === 'projects/some_project/figure.png',
    }
    expect(validatePublications([entry], listed).errors).toEqual([])
  })

  test('the same title, year and type twice is an error naming both entries', () => {
    const second = withEntry({ title: '  A Paper  Title ', id: 2, thumbnail: undefined })
    delete second.thumbnail_alt
    expect(check([valid, second]).errors).toEqual([
      'entry 2 "A Paper Title": duplicate of entry 1 (same title, year and type)',
    ])
  })

  test('a repeated id is an error', () => {
    const second = withEntry({ title: 'Another title' })
    expect(check([valid, second]).errors).toEqual([
      expect.stringContaining('id 1 is also used by entry 1'),
    ])
  })

  test('the same title in another year or type is fine', () => {
    expect(check([valid, withEntry({ year: 2023, id: 2 })]).errors).toEqual([])
    expect(check([valid, withEntry({ type: 'arXiv', id: 2 })]).errors).toEqual([])
  })

  test('the file must be a list of mappings', () => {
    expect(check({ title: 'x' }).errors).toEqual([expect.stringContaining('must be a list')])
    expect(check(['just text']).errors).toEqual(['entry 1: is not a set of "key: value" lines'])
  })

  test('messages name the entry number, line and title', () => {
    const source = `- title: First\n  authors: A\n  type: Book\n  year: 2020\n\n- title: Second\n  authors: B\n  type: Book\n  year: 20\n`
    const { errors } = validatePublications(load(source), { lines: entryLines(source) })
    expect(errors).toEqual(['entry 2, line 6 "Second": year 20 is not a four-digit year'])
  })

  test.each([
    [{ venue: 'Journal of â€œThingsâ€' }, 'mis-decoded characters'],
    [{ type: 'Poster' }, 'extra heading at the end of its year'],
    [{ venue: '<a href="dx.dio.org/10.1/x">doi</a>' }, 'shows it as plain text'],
    [{ venue: '<a href= doi: 10.1/x>doi</a>' }, 'shows it as plain text'],
    [{ pdf: '' }, 'pdf is empty'],
    [{ pdf: null }, 'pdf is empty'],
    [{ venue: 'NULL' }, 'venue is empty'],
    [{ doi: '' }, 'doi is empty'],
    [{ pdf: '/papers/no-such-file.pdf' }, 'has no file at static/papers/no-such-file.pdf'],
    [{ thumbnail: undefined }, 'thumbnail_alt without a thumbnail'],
    [{ title: 'A Paper Title ' }, 'start or end with spaces'],
  ])('%j is only a warning', (changes, message) => {
    const { errors, warnings } = check([withEntry(changes)])
    expect(errors).toEqual([])
    expect(warnings).toEqual([expect.stringContaining(message)])
  })

  test('a year out of order is only a warning', () => {
    const { errors, warnings } = check([
      withEntry({ year: 2020 }),
      withEntry({ title: 'B', id: 2 }),
    ])
    expect(errors).toEqual([])
    expect(warnings).toEqual([expect.stringContaining('keep newest years first')])
  })

  test('documents every key it accepts', () => {
    const header = SOURCE.split('\n- ')[0]
    PUBLICATION_KEYS.forEach(key => expect(header).toMatch(new RegExp(`^#\\s+${key}\\s`, 'm')))
  })
})

describe('gatsby-node onCreatePage', () => {
  const gatsbyNode = require('../gatsby-node')
  const run = () => {
    const reporter = { warn: jest.fn(), panicOnBuild: jest.fn() }
    const actions = { deletePage: jest.fn(), createPage: jest.fn() }
    gatsbyNode.onCreatePage({
      page: { path: '/publications/', component: 'publications.js', context: {} },
      actions,
      reporter,
    })
    return { reporter, actions }
  }

  afterEach(() => jest.restoreAllMocks())

  test('hands the publications to the page as context', () => {
    const { reporter, actions } = run()
    expect(reporter.panicOnBuild).not.toHaveBeenCalled()
    expect(actions.deletePage).toHaveBeenCalledTimes(1)
    const page = actions.createPage.mock.calls[0][0]
    expect(page.path).toBe('/publications/')
    expect(page.context.publications).toEqual(publicationsForPage(load(SOURCE)))
  })

  test('fails the build with the entry when the file is wrong', () => {
    const readFileSync = fs.readFileSync
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((file, ...rest) =>
        String(file).endsWith('publications.yaml')
          ? '- title: Only\n  authors: A\n  type: Book\n  year: 99\n'
          : readFileSync(file, ...rest)
      )
    const { reporter } = run()
    expect(reporter.panicOnBuild).toHaveBeenCalledWith(
      expect.stringContaining('entry 1, line 1 "Only": year 99 is not a four-digit year')
    )
  })

  test('fails the build when a thumbnail path differs from the file name in case', () => {
    const readFileSync = fs.readFileSync
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((file, ...rest) =>
        String(file).endsWith('publications.yaml')
          ? '- title: Only\n  authors: A\n  type: Book\n  year: 2020\n  thumbnail: publications/pub_qc-phast_search\n  thumbnail_alt: Thumbnail\n'
          : readFileSync(file, ...rest)
      )
    const { reporter } = run()
    expect(reporter.panicOnBuild).toHaveBeenCalledWith(
      expect.stringContaining('no file src/images/publications/pub_qc-phast_search.png')
    )
  })

  test('fails the build when the file is not valid YAML', () => {
    const readFileSync = fs.readFileSync
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((file, ...rest) =>
        String(file).endsWith('publications.yaml')
          ? '- title: Only\n  title: Twice\n'
          : readFileSync(file, ...rest)
      )
    const { reporter } = run()
    expect(reporter.panicOnBuild).toHaveBeenCalledWith(
      expect.stringContaining('duplicated mapping key')
    )
  })

  test('leaves other pages alone', () => {
    const actions = { deletePage: jest.fn(), createPage: jest.fn() }
    gatsbyNode.onCreatePage({ page: { path: '/people/', context: {} }, actions, reporter: {} })
    expect(actions.createPage).not.toHaveBeenCalled()
  })
})
