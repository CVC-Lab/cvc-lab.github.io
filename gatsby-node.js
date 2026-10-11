const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const {
  entryLines,
  publicationsForPage,
  validatePublications,
} = require('./src/data/publications-schema')

// Plain-HTML microsites under static/projects/ (one index.html per directory). The same list
// lives in STATIC_PREFIXES (src/components/ui/SmartLink.js); indexable ones are also in
// STATIC_SITEMAP_PATHS (gatsby-config.js).
const STATIC_MICROSITES = [
  'pd-research-companion',
  'posterior-aware-pd-phenotyping-miccai',
  'dynamic-belief-games/DBG_progress',
]

exports.onPreInit = ({ reporter }) => {
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major < 22 || (major === 22 && minor < 14) || major >= 26) {
    reporter.warn(
      `Node ${process.versions.node} is outside the range this site supports (>=22.14 <26). Run "nvm use" (see .nvmrc).`
    )
  }
  if (!process.env.GATSBY_INTERNAL_LINKS_PASSWORD) {
    reporter.warn(
      'GATSBY_INTERNAL_LINKS_PASSWORD is not set: /internal/ will stay locked for everyone in this build'
    )
  }
}

const PUBLICATIONS_FILE = 'src/data/publications.yaml'

// Whether a path relative to the repository exists with exactly this spelling. macOS ignores
// case in file names; the image query and GitHub Pages do not.
const fileExistsExactly = file => {
  let dir = __dirname
  return file.split('/').every(name => {
    let names
    try {
      names = fs.readdirSync(dir)
    } catch {
      return false
    }
    dir = path.join(dir, name)
    return names.includes(name)
  })
}

// Reads and checks the publication list. A problem is reported with its entry number, line and
// title; an error fails `gatsby build` (develop prints it and keeps running).
const readPublications = reporter => {
  let source
  let entries
  try {
    source = fs.readFileSync(path.join(__dirname, PUBLICATIONS_FILE), 'utf8')
    entries = yaml.load(source, { schema: yaml.CORE_SCHEMA, filename: PUBLICATIONS_FILE })
  } catch (error) {
    reporter.panicOnBuild(`${PUBLICATIONS_FILE} could not be read: ${error.message}`)
    return []
  }
  const cardImages = fs.readFileSync(path.join(__dirname, 'src/hooks/useCardImages.js'), 'utf8')
  const { errors, warnings } = validatePublications(entries, {
    lines: entryLines(source),
    fileExists: fileExistsExactly,
    isListedImage: image => cardImages.includes(`"${image}"`),
  })
  warnings.forEach(warning => reporter.warn(`${PUBLICATIONS_FILE}: ${warning}`))
  if (errors.length > 0) {
    reporter.panicOnBuild(
      `${PUBLICATIONS_FILE} has ${errors.length} problem(s) to fix:\n${errors.join('\n')}`
    )
  }
  return publicationsForPage(entries)
}

// The list reaches /publications/ as page context, so it is only in that page's page-data.
// In develop an edit of the file updates the context; reload the page to see it.
let publicationsPage = null
exports.onCreatePage = ({ page, actions, reporter }) => {
  if (page.path !== '/publications/') return
  const createWithPublications = () =>
    actions.createPage({
      ...publicationsPage,
      context: { ...publicationsPage.context, publications: readPublications(reporter) },
    })
  if (publicationsPage === null && process.env.gatsby_executing_command === 'develop') {
    fs.watchFile(
      path.join(__dirname, PUBLICATIONS_FILE),
      { interval: 1000 },
      createWithPublications
    )
  }
  publicationsPage = page
  actions.deletePage(page)
  createWithPublications()
}

// `gatsby develop` serves static files without directory indexes, so a microsite URL such as
// /projects/pd-research-companion/ would fall through to the dev 404 page. Production hosts
// resolve index.html themselves.
exports.onCreateDevServer = ({ app }) => {
  const express = require('express')
  for (const name of STATIC_MICROSITES) {
    app.use(
      `/projects/${name}`,
      express.static(path.join(__dirname, 'static', 'projects', name), {
        extensions: ['html'],
        index: ['index.html'],
      })
    )
  }
}

exports.onCreateWebpackConfig = ({ stage, actions, getConfig, reporter }) => {
  const config = getConfig()

  // Gatsby inlines font files under 10 KB as base64. KaTeX ships 14 of them, which put 119 KB
  // into the stylesheet that is inlined into every page. Emit every font as a file instead
  // (same static/[name]-[hash].[ext] names, so the preloads in gatsby-ssr.js still match).
  const fontRule = config.module.rules.find(
    rule => rule.test instanceof RegExp && rule.test.test('font.woff2')
  )
  const fontLoader =
    fontRule && [].concat(fontRule.use).find(use => use && use.options && 'limit' in use.options)
  if (fontLoader) {
    fontLoader.options.limit = false
  } else {
    reporter.warn('Font loader rule not found: small fonts are still inlined into the CSS')
  }

  // Webpack's cache logs a "Serializing big strings" warning for every cached string over
  // 100 KiB (several dependencies have one) after each rebuild in develop.
  if (stage === 'develop' || stage === 'develop-html') {
    config.infrastructureLogging = { ...config.infrastructureLogging, level: 'error' }
  }

  actions.replaceWebpackConfig(config)
}
