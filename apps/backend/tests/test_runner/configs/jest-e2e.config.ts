import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest for TypeScript transformation
  preset: 'ts-jest',
  testEnvironment: 'allure-jest/node',

  // Root directory for tests (parent of configs directory)
  rootDir: '..',

  // Module path aliases (must match tsconfig.json paths)
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Allow absolute imports
  moduleDirectories: ['node_modules', '<rootDir>'],

  // File extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Test pattern - only .spec.ts files in e2e folders
  // This matches end-to-end tests in src/modules/**/tests/e2e/*.spec.ts
  testRegex: 'src/modules/.*/tests/e2e/.*\\.spec\\.ts$',

  // Transform TypeScript files
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2023',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        skipLibCheck: true,
        strictNullChecks: true,
        resolveJsonModule: true,
        forceConsistentCasingInFileNames: true,
        noImplicitAny: false,
        baseUrl: '.',
        paths: {
          'src/*': ['src/*'],
          '@modules/*': ['src/modules/*'],
        },
        types: ['jest', 'node'],
      },
    }],
  },

  // Coverage settings (disabled for e2e tests by default)
  collectCoverage: false,

  // Test timeout for e2e tests (longer than integration tests)
  testTimeout: parseInt(process.env.JEST_TIMEOUT || '60000', 10),

  // Run tests serially by default (to avoid conflicts)
  maxWorkers: 1,

  // Verbose output
  verbose: true,

  // Prevent worker crashes with limited concurrency
  maxConcurrency: 1,

  // Setup files
  setupFilesAfterEnv: [],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
