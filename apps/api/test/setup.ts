import 'reflect-metadata';

// Global test setup that runs before all test suites
beforeAll(async () => {
  // Setup any global test configuration
  // This runs once before all tests in the entire test suite
  console.log('Setting up global test environment...');
  process.env.ENCRYPTION_KEY =
    'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'; // 32-byte hex
});

afterAll(async () => {
  // Cleanup after all tests
  // This runs once after all tests in the entire test suite
  console.log('Cleaning up global test environment...');
});
