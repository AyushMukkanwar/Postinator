module.exports = {
  displayName: 'api',
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).ts',
    '<rootDir>/src/**/*.(test|spec).ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/test/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\.ts
: 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)
: '<rootDir>/src/$1',
    '^@repo/db/prisma/generated/prisma
: '<rootDir>/../../packages/db/prisma/generated/prisma',
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
