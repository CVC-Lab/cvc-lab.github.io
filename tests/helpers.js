const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

// Gatsby's File System Route API slugifies each segment of frontmatter.slug.
const slugifySegment = segment =>
  segment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeRoute = route => {
  const [pathname] = String(route).split(/[?#]/)
  const segments = pathname.split('/').filter(Boolean)
  return `/${segments.join('/')}${segments.length ? '/' : ''}`
}

const markdownRoutes = () =>
  walk(path.join(ROOT, 'src/markdown'))
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const match = /^slug:\s*["']?([^"'\n]+)["']?\s*$/m.exec(fs.readFileSync(file, 'utf8'))
      return match && normalizeRoute(match[1].split('/').map(slugifySegment).join('/'))
    })
    .filter(Boolean)

const pageRoutes = () =>
  walk(path.join(ROOT, 'src/pages'))
    .filter(file => file.endsWith('.js') && !path.basename(file).startsWith('{'))
    .map(file => {
      const relative = path.relative(path.join(ROOT, 'src/pages'), file).replace(/\.js$/, '')
      return normalizeRoute(relative.replace(/(^|\/)index$/, ''))
    })

const staticExists = route => {
  const target = path.join(ROOT, 'static', route.split(/[?#]/)[0])
  if (!fs.existsSync(target)) return false
  return fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html'))
}

const knownRoutes = () => new Set([...markdownRoutes(), ...pageRoutes()])

const isInternal = link =>
  typeof link === 'string' && link.startsWith('/') && !link.startsWith('//')

module.exports = { ROOT, walk, normalizeRoute, knownRoutes, staticExists, isInternal }
