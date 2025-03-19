import '@jest/globals';
import { beforeEach } from 'node:test';
import { jest } from '@jest/globals';

// Mock environment variables
process.env.TABLE_NAME = 'FavoriteColors';

// Mock console.error to keep test output clean
console.error = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 