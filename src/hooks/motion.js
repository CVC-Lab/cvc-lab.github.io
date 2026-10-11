// Call these from effects and event handlers, never during render: the server
// cannot know the visitor's preference.
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

// For scrollTo / scrollIntoView: animate only when the visitor has not asked for less motion.
export const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth')
