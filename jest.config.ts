import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  automock: false,
  testPathIgnorePatterns: ['<rootDir>/.*/__fixtures__/.*']
};

export default config;
