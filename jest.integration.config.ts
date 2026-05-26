import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFiles: ['<rootDir>/jest.integration.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setupAfterEnv.ts'],
  globalSetup: '<rootDir>/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/jest.globalTeardown.ts',
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(query-string|decode-uri-component|filter-obj|split-on-first)/)',
  ],
  testTimeout: 30000,
  coverageProvider: 'v8',
};

export default config;
