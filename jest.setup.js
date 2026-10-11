import '@testing-library/jest-dom'

// Gatsby injects this at build time.
global.__PATH_PREFIX__ = ''

// jsdom has no matchMedia; components that read motion or width preferences need one. Suites
// that run in the node environment (server rendering) have no window at all.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}
