import fs from 'fs'
import path from 'path'
import { ROOT, walk } from './helpers'

// Custom properties that are defined but still broken in files this test does not own.
// Remove an entry when its stylesheet is fixed; the test fails if an entry is stale.
const KNOWN_ISSUES = []

const SRC = path.join(ROOT, 'src')
const files = walk(SRC)
const read = file => fs.readFileSync(file, 'utf8')
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '')

const cssFiles = files.filter(file => file.endsWith('.css'))
const jsFiles = files.filter(file => file.endsWith('.js'))

const defined = new Set()
const selfReferences = []
const usages = []

for (const file of cssFiles) {
  const css = stripComments(read(file))
  const name = path.relative(ROOT, file)
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) {
    defined.add(match[1])
    if (new RegExp(`var\\(\\s*${match[1]}\\s*[,)]`).test(match[2])) {
      selfReferences.push(`${name}: ${match[1]}`)
    }
  }
  for (const match of css.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
    usages.push({ file: name, token: match[1], hasFallback: match[2] === ',' })
  }
}

// Properties set from JavaScript (inline style objects or style.setProperty).
for (const file of jsFiles) {
  for (const match of read(file).matchAll(/['"`](--[\w-]+)['"`]/g)) defined.add(match[1])
}

describe('CSS custom properties', () => {
  test('no custom property is defined in terms of itself', () => {
    expect(selfReferences.filter(entry => !KNOWN_ISSUES.includes(entry))).toEqual([])
  })

  test('every var() without a fallback refers to a defined custom property', () => {
    const undefinedUses = [
      ...new Set(
        usages
          .filter(use => !use.hasFallback && !defined.has(use.token))
          .map(use => `${use.file}: ${use.token}`)
      ),
    ]
    expect(undefinedUses.filter(entry => !KNOWN_ISSUES.includes(entry))).toEqual([])
  })

  test('the known-issues list has no stale entries', () => {
    const current = new Set([
      ...selfReferences,
      ...usages
        .filter(use => !use.hasFallback && !defined.has(use.token))
        .map(use => `${use.file}: ${use.token}`),
    ])
    expect(KNOWN_ISSUES.filter(entry => !current.has(entry))).toEqual([])
  })
})
