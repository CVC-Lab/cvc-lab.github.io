// The allFile result is shared across every component instance, so key the
// lookup off it rather than rebuilding one per rendered card.
const lookupCache = new WeakMap()

export const toLookup = nodes => {
  const cached = lookupCache.get(nodes)
  if (cached) return cached

  const lookup = {}
  nodes.forEach(node => {
    if (node.childImageSharp) {
      lookup[node.relativePath] = node
    }
  })
  lookupCache.set(nodes, lookup)
  return lookup
}

const warned = new Set()

// A missing image renders nothing, so say so where it will be seen: the browser
// console under `gatsby develop`, and the terminal while `gatsby build` renders HTML.
export const warnMissing = (hook, key, hint) => {
  const visible = process.env.NODE_ENV !== 'production' || typeof window === 'undefined'
  if (!visible || warned.has(`${hook}:${key}`)) return
  warned.add(`${hook}:${key}`)
  console.warn(`[${hook}] no processed image for "${key}". ${hint}`)
}
