import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../..',
  testEnvironment: 'allure-jest/node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src(.*)$': '<rootDir>/src$1',
    '^@components(.*)$': '<rootDir>/shared/components$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testTimeout: 30000,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

export default config;
