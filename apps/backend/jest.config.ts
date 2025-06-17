// jest.config.ts
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const config: Config = {
  // 1) Используем ts-jest для трансформации TypeScript :contentReference[oaicite:0]{index=0}
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 2) Автоматически мапим alias"ы из tsconfig.paths → moduleNameMapper :contentReference[oaicite:1]{index=1}
  moduleNameMapper: {
    '^src(.*)$': '<rootDir>/src$1',
    '^@components(.*)$': '<rootDir>/shared/components$1',
  },

  // 3) Позволяем абсолютные импорты из src/ без alias :contentReference[oaicite:3]{index=3}
  moduleDirectories: ['node_modules', '<rootDir>/src'],

  // 4) Расширения файлов, которые обрабатывает Jest :contentReference[oaicite:4]{index=4}
  moduleFileExtensions: ['ts', 'js', 'json'],

  // 5) Паттерн для поиска тестов (можно настроить по вкусу)
  testRegex: '.*\\.spec\\.ts$',

  // 6) Преобразование (трансформер) для файлов .ts
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // 7) Настройки покрытия кода
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: 'coverage',

  // 8) Настройки отчётов покрытия
  coverageReporters: ['text', 'lcov'],

  // 10) Дополнительно: настраиваем таймауты, если нужно
  testTimeout: 30000,
};

export default config;
