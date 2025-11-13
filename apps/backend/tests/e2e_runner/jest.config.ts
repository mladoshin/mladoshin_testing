import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest for TypeScript transformation
  preset: 'ts-jest',
  testEnvironment: 'allure-jest/node',

  // Root directory for tests
  rootDir: '.',

  // Module path aliases
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Allow absolute imports
  moduleDirectories: ['node_modules', '<rootDir>'],

  // File extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Test pattern - only .spec.ts files in e2e folders
  // This matches end-to-end tests that verify complete system behavior
  testRegex: '/e2e/.*\\.spec\\.ts$',

  // Transform TypeScript files
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Coverage settings (disabled for e2e tests by default)
  collectCoverage: false,

  // Test timeout for e2e tests (longer than integration tests)
  testTimeout: parseInt(process.env.JEST_TIMEOUT || '60000', 10),

  // Run tests serially by default (to avoid conflicts)
  maxWorkers: 1,

  // Verbose output
  verbose: true,

  // Setup files
  setupFilesAfterEnv: [],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
