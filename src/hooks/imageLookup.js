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
