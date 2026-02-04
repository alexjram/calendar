import { getIfRewardAchieved } from '@/services/TaskUtils';

// Helper to create a mock task
const createMockTask = (overrides: Partial<ITask> = {}): ITask => ({
  id: 1,
  title: 'Test Task',
  type: 'daily',
  frequency: 1,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  completedAt: null,
  hasReward: false,
  reward: null,
  rewardWhen: 'never',
  maxRewards: null,
  totalCount: 0,
  todayCount: 0,
  weekWeekdayCount: 0,
  weekWeekendCount: 0,
  monthCount: 0,
  hasCompleted: 0,
  rewardCount: 0,
  ...overrides,
});

describe('getIfRewardAchieved', () => {
  describe('rewardWhen = "never"', () => {
    it.each([
      { totalCount: 0, expected: false },
      { totalCount: 5, expected: false },
      { totalCount: 10, expected: false },
    ])('should return false when rewardWhen is "never" (totalCount: $totalCount)', ({ totalCount, expected }) => {
      const task = createMockTask({
        rewardWhen: 'never',
        totalCount,
        hasReward: true,
      });
      expect(getIfRewardAchieved(task)).toBe(expected);
    });
  });

  describe('rewardWhen = "finished"', () => {
    it.each([
      { completedAt: null, expected: false },
      { completedAt: new Date('2025-01-15'), expected: true },
    ])('should return $expected when completedAt is $completedAt', ({ completedAt, expected }) => {
      const task = createMockTask({
        rewardWhen: 'finished',
        completedAt,
        hasReward: true,
      });
      expect(getIfRewardAchieved(task)).toBe(expected);
    });
  });

  describe('finite tasks with numeric rewardWhen', () => {
    it.each([
      { totalCount: 0, rewardWhen: '5', expected: false },
      { totalCount: 3, rewardWhen: '5', expected: false },
      { totalCount: 5, rewardWhen: '5', expected: true },
      { totalCount: 6, rewardWhen: '5', expected: false },
      { totalCount: 10, rewardWhen: '10', expected: true },
    ])('should return $expected for finite task with totalCount=$totalCount and rewardWhen=$rewardWhen', ({ totalCount, rewardWhen, expected }) => {
      const task = createMockTask({
        type: 'finite',
        totalCount,
        rewardWhen,
        frequency: parseInt(rewardWhen),
        hasReward: true,
      });
      expect(getIfRewardAchieved(task)).toBe(expected);
    });
  });

  describe('periodic tasks (daily, weekly, monthly, etc.) with numeric rewardWhen', () => {
    it.each([
      // Every 5 completions
      { totalCount: 0, rewardWhen: '5', expected: false, description: '0 completions - not achieved' },
      { totalCount: 4, rewardWhen: '5', expected: false, description: '4 completions - not achieved' },
      { totalCount: 5, rewardWhen: '5', expected: true, description: '5 completions - achieved' },
      { totalCount: 10, rewardWhen: '5', expected: true, description: '10 completions - achieved again' },
      { totalCount: 15, rewardWhen: '5', expected: true, description: '15 completions - achieved again' },
      // Every 3 completions
      { totalCount: 3, rewardWhen: '3', expected: true, description: '3 completions - achieved' },
      { totalCount: 6, rewardWhen: '3', expected: true, description: '6 completions - achieved again' },
      { totalCount: 9, rewardWhen: '3', expected: true, description: '9 completions - achieved again' },
    ])('$description', ({ totalCount, rewardWhen, expected }) => {
      const task = createMockTask({
        type: 'daily',
        totalCount,
        rewardWhen,
        hasReward: true,
        maxRewards: null,
      });
      expect(getIfRewardAchieved(task)).toBe(expected);
    });

    it.each([
      // Max rewards = 2, every 5 completions
      // Logic: maxRewards <= totalCount / rewardWhen
      // At count 5: 2 <= 1? No -> no reward
      // At count 10: 2 <= 2? Yes -> reward
      // At count 15: 2 <= 3? Yes -> reward
      { totalCount: 5, rewardWhen: '5', maxRewards: 2, expected: false, description: 'no reward at 5 (below threshold)' },
      { totalCount: 10, rewardWhen: '5', maxRewards: 2, expected: true, description: 'reward at 10 (at threshold)' },
      { totalCount: 15, rewardWhen: '5', maxRewards: 2, expected: true, description: 'reward at 15 (above threshold)' },
      { totalCount: 20, rewardWhen: '5', maxRewards: 2, expected: true, description: 'reward at 20 (above threshold)' },
      // Max rewards = 1, every 3 completions
      // At count 3: 1 <= 1? Yes -> reward
      // At count 6: 1 <= 2? Yes -> reward
      { totalCount: 3, rewardWhen: '3', maxRewards: 1, expected: true, description: 'reward at 3 (at threshold)' },
      { totalCount: 6, rewardWhen: '3', maxRewards: 1, expected: true, description: 'reward at 6 (above threshold)' },
    ])('$description with maxRewards=$maxRewards', ({ totalCount, rewardWhen, maxRewards, expected }) => {
      const task = createMockTask({
        type: 'daily',
        totalCount,
        rewardWhen,
        hasReward: true,
        maxRewards,
      });
      expect(getIfRewardAchieved(task)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it.each([
      { rewardWhen: 'invalid', expected: false },
      { rewardWhen: '', expected: false },
      { rewardWhen: 'abc', expected: false },
      { rewardWhen: null as any, expected: false },
    ])('should return false for invalid rewardWhen value: "$rewardWhen"', ({ rewardWhen, expected }) => {
      const task = createMockTask({
        rewardWhen,
        totalCount: 5,
        hasReward: true,
      });
      expect(getIfRewardAchieved(task)).toBe(expected);
    });

    it('should handle maxRewards = 0 as unlimited', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 10,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: 0,
      });
      // maxRewards === 0 should be treated as unlimited
      expect(getIfRewardAchieved(task)).toBe(true);
    });

    it('should handle negative maxRewards as unlimited', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 10,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: -1,
      });
      expect(getIfRewardAchieved(task)).toBe(true);
    });
  });

  describe('uncomplete behavior', () => {
    it('should still show reward achieved after uncompleting if totalCount still qualifies', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 5,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: null,
        rewardCount: 1,
      });
      expect(getIfRewardAchieved(task)).toBe(true);
    });

    it('should not show reward achieved after uncompleting if no longer qualifies', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 4,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: null,
        rewardCount: 0,
      });
      expect(getIfRewardAchieved(task)).toBe(false);
    });

    it('should handle rewardCount tracking correctly', () => {
      // With maxRewards=3, rewards can only be given after all 3 are exhausted
      const task = createMockTask({
        type: 'weekly',
        totalCount: 10,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: 3,
        rewardCount: 2,
      });
      // Current logic: maxRewards(3) <= rewardsGiven(10/5=2) is false
      // Reward only eligible after 3rd milestone (15 completions)
      expect(getIfRewardAchieved(task)).toBe(false);
      
      // At 15 completions (3rd milestone): 3 <= 3 is true
      task.totalCount = 15;
      expect(getIfRewardAchieved(task)).toBe(true);
    });
  });

  describe('task type variations', () => {
    it.each([
      { type: 'daily', totalCount: 5, expected: true },
      { type: 'weekly', totalCount: 5, expected: true },
      { type: 'monthly', totalCount: 5, expected: true },
      { type: 'weekdays', totalCount: 5, expected: true },
      { type: 'weekend', totalCount: 5, expected: true },
      { type: 'other-day', totalCount: 5, expected: true },
    ])('should work for $type tasks', ({ type, totalCount, expected }) => {
      const task = createMockTask({
        type: type as ITask['type'],
        totalCount,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: null,
      });
      expect(getIfRewardAchieved(task)).toBe(expected);
    });
  });
});
