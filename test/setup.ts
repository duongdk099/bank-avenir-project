// Mock uuid to avoid ESM issues in Jest
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Date.now() + '-' + Math.random().toString(36).substring(7),
}));
