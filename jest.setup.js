// Mock dayjs to have consistent dates in tests
jest.mock('dayjs', () => {
  const dayjs = jest.requireActual('dayjs');
  return dayjs;
});

// Global test utilities
global.testUtils = {
  // Create a mock task object for testing
  createMockTask: (overrides = {}) => ({
    id: 1,
    title: 'Test Task',
    type: 'daily',
    frequency: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    completedAt: null,
    hasReward: false,
    reward: null,
    rewardWhen: null,
    maxRewards: null,
    totalCount: 0,
    weekWeekdayCount: 0,
    weekWeekendCount: 0,
    monthCount: 0,
    completedToday: false,
    ...overrides,
  }),

  // Mock completion object
  createMockCompletion: (overrides = {}) => ({
    id: 1,
    taskId: 1,
    completedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }),
};

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
