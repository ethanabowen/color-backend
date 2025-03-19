module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  // Run tests sequentially to reduce overhead
  maxWorkers: 1,
  // Cache test results
  cache: true,
  // Show test coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  // Only run tests that have changed since last run
  onlyChanged: true,
}; 