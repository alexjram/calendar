const { defaults: tsjPreset } = require('ts-jest/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...tsjPreset,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo-sqlite$': '<rootDir>/__tests__/__mocks__/expo-sqlite.js',
    '^drizzle-orm$': '<rootDir>/__tests__/__mocks__/drizzle-orm.js',
    '^drizzle-orm/expo$': '<rootDir>/__tests__/__mocks__/drizzle-orm.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        strict: false,
        noEmitOnError: false,
        isolatedModules: true,
      },
      diagnostics: {
        ignoreCodes: [18048, 18047, 2532, 2531],
      },
    }],
  },
  collectCoverageFrom: [
    'services/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  clearMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: [
    'node_modules/(?!(dayjs|@testing-library)/)',
  ],
};
