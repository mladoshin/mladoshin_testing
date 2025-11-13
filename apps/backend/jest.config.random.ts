import baseConfig from './jest.config';
import type { Config } from 'jest';

const randomConfig: Config = {
  ...baseConfig,
  testSequencer: '<rootDir>/src/common/tests/utils/random-test-sequencer.ts',
};

export default randomConfig;
