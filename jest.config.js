module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { url: 'https://cvc-lab.github.io/' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp|avif|mp4|webm|pdf|woff2?)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/\\.cache/', '/public/'],
  modulePathIgnorePatterns: ['<rootDir>/\\.cache/', '<rootDir>/public/'],
  collectCoverageFrom: ['src/**/*.js', '!src/pages/**'],
  coverageDirectory: 'coverage',
}
