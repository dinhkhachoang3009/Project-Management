 export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  // H3: measured floors (2026-10-22). NOTE: jest applies threshold keys
  // PER FILE, so the floor = weakest controller file - 1
  // (auth-controller 71.91/64.7/71.3, workspace branch 62.06, project funcs 86.66),
  // well above the spec's controllers≥60 floor. Update deliberately, with numbers.
  coverageThreshold: {
    'controllers/**': {
      statements: 70,
      branches: 61,
      functions: 85,
      lines: 70,
    },
  },
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.mjs'
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
