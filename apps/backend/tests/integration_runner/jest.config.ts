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

  // Test pattern - only .http.spec.ts files in integration folders
  // This ensures we only run lightweight HTTP tests, not NestJS TestingModule tests
  testRegex: '/integration/.*\\.http\\.spec\\.ts$',

  // Transform TypeScript files
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Coverage settings (disabled for integration tests by default)
  collectCoverage: false,

  // Test timeout for integration tests (longer than unit tests)
  testTimeout: parseInt(process.env.JEST_TIMEOUT || '30000', 10),

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
