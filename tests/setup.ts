import { beforeAll, afterAll, beforeEach } from 'vitest';
import { vi } from 'vitest';

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
  
  console.log('🧪 Setting up test environment');
});

afterAll(async () => {
  console.log('🧪 Cleaning up test environment');
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

// Global test timeout
vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 30000,
});