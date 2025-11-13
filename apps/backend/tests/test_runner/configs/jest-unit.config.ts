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

  // Test pattern - only .spec.ts files in unit test folders
  // This matches unit tests in src/modules/**/tests/unit/*.spec.ts
  testRegex: 'src/modules/.*/tests/unit/.*\\.spec\\.ts$',

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

  // Test timeout for unit tests (shorter than integration/e2e)
  testTimeout: parseInt(process.env.JEST_TIMEOUT || '10000', 10),

  // Run tests in parallel (unit tests are independent)
  maxWorkers: 4,

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
