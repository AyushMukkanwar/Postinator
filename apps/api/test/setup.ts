import 'reflect-metadata';

// Global test setup that runs before all test suites
beforeAll(async () => {
  // Setup any global test configuration
  // This runs once before all tests in the entire test suite
  console.log('Setting up global test environment...');
});

afterAll(async () => {
  // Cleanup after all tests
  // This runs once after all tests in the entire test suite
  console.log('Cleaning up global test environment...');
});
