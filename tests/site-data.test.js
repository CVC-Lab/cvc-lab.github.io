import fs from 'fs'
import path from 'path'
import projects from '../src/data/site/projects'
import news from '../src/data/site/news'
import people from '../src/data/site/people'
import software from '../src/data/site/software'
import { ROOT, normalizeRoute, knownRoutes, staticExists, isInternal } from './helpers'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
// Labels of the theme tabs on /projects/ (PROJECT_TABS in src/components/tiles.js).
const THEMES = ['Healthcare AI', 'World Models', 'AI for Science']
const routes = knownRoutes()
const resolves = link => routes.has(normalizeRoute(link)) || staticExists(link)
const duplicates = values => values.filter((value, index) => values.indexOf(value) !== index)

describe('projects data', () => {
  test('every project has the fields the tiles render', () => {
    expect(projects.length).toBeGreaterThan(0)
    for (const project of projects) {
      expect(typeof project.name).toBe('string')
      expect(project.name.trim()).not.toBe('')
      expect(typeof project.description).toBe('string')
      expect(project.date).toMatch(ISO_DATE)
      expect(Array.isArray(project.tags)).toBe(true)
    }
  })

  test('every project belongs to at least one known theme', () => {
    const bad = projects
      .filter(
        project =>
          !Array.isArray(project.themes) ||
          project.themes.length === 0 ||
          project.themes.some(theme => !THEMES.includes(theme))
      )
      .map(project => project.name)
    expect(bad).toEqual([])
  })

  test('featured ranks are unique positive numbers', () => {
    const ranks = projects.filter(p => p.featuredRank !== undefined).map(p => p.featuredRank)
    expect(ranks.every(rank => Number.isInteger(rank) && rank > 0)).toBe(true)
    expect(duplicates(ranks)).toEqual([])
  })

  test('project names are unique', () => {
    expect(duplicates(projects.map(project => project.name))).toEqual([])
  })

  test('every internal project link resolves to a page, a markdown slug or a static file', () => {
    const broken = projects.filter(p => isInternal(p.link) && !resolves(p.link)).map(p => p.link)
    expect(broken).toEqual([])
  })

  test('every project image exists and is in the scope of useCardImages', () => {
    const hook = fs.readFileSync(path.join(ROOT, 'src/hooks/useCardImages.js'), 'utf8')
    const ARTWORK_DIRS = ['publications', 'project_tiles', 'projects']
    const missing = projects
      .filter(project => project.img_name)
      .filter(project => {
        const file = ['png', 'jpg', 'jpeg']
          .map(ext => `${project.img_name}.${ext}`)
          .find(relative => fs.existsSync(path.join(ROOT, 'src/images', relative)))
        if (!file) return true
        return !ARTWORK_DIRS.includes(path.dirname(file)) && !hook.includes(`"${file}"`)
      })
      .map(project => project.img_name)
    expect(missing).toEqual([])
  })
})

describe('news data', () => {
  test('every item has a name, a category and an ISO date', () => {
    expect(news.length).toBeGreaterThan(0)
    for (const item of news) {
      expect(typeof item.name).toBe('string')
      expect(['news', 'seminars']).toContain(item.category)
      expect(item.date).toMatch(ISO_DATE)
    }
  })

  test('every internal news link resolves', () => {
    const broken = news.filter(n => isInternal(n.link) && !resolves(n.link)).map(n => n.link)
    expect(broken).toEqual([])
  })
})

describe('people data', () => {
  test('every person has a name and a known status', () => {
    expect(people.length).toBeGreaterThan(0)
    for (const person of people) {
      expect(typeof person.name).toBe('string')
      expect(['current', 'alumni']).toContain(person.status)
    }
  })

  test('every portrait exists under src/images/people', () => {
    const missing = people
      .filter(person => person.image)
      .filter(person => !fs.existsSync(path.join(ROOT, 'src/images/people', person.image)))
      .map(person => person.image)
    expect(missing).toEqual([])
  })
})

describe('software data', () => {
  const items = software.flatMap(group => group.items)
  // Same rule as slugFor() in src/components/software_list.js.
  const slugFor = item => item.slug || item.name.replace(/[\s/]+/g, '-').toLowerCase()

  test('every category has items with a unique name', () => {
    expect(software.length).toBeGreaterThan(0)
    for (const group of software) {
      expect(typeof group.category).toBe('string')
      expect(group.items.length).toBeGreaterThan(0)
    }
    expect(duplicates(items.map(item => item.name))).toEqual([])
  })

  test('every software item without an href has a page at /software/<slug>/', () => {
    const broken = items
      .filter(item => !item.href)
      .map(item => `/software/${slugFor(item)}/`)
      .filter(route => !routes.has(route))
    expect(broken).toEqual([])
  })
})
