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
    '^@/db/schema$': '<rootDir>/__tests__/__mocks__/db-schema.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^expo-sqlite$': '<rootDir>/__tests__/__mocks__/expo-sqlite.js',
    '^drizzle-orm$': '<rootDir>/__tests__/__mocks__/drizzle-orm.js',
    '^drizzle-orm/expo$': '<rootDir>/__tests__/__mocks__/drizzle-orm.js',
    '^drizzle-orm/sqlite-core$': '<rootDir>/__tests__/__mocks__/drizzle-orm-sqlite-core.js',
    '^react-native$': '<rootDir>/__tests__/__mocks__/react-native.js',
    '^expo-notifications$': '<rootDir>/__tests__/__mocks__/expo-notifications.js',
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
    'hooks/**/*.ts',
    'hooks/**/*.tsx',
    'context/**/*.ts',
    'app/**/*.ts',
    'app/**/*.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/*.test.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    './services/': {
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
