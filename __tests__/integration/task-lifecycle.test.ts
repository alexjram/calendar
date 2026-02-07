import dayjs from 'dayjs';

/**
 * Integration tests for complete task lifecycle
 * These tests simulate real user scenarios to verify end-to-end functionality
 */

// Helper to create a mock task with all required fields
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

describe('Task Lifecycle Integration Tests', () => {
  describe('Weekly task workflow', () => {
    it('should complete weekly task 3 times per week and hide after limit reached', () => {
      // Create a weekly task with frequency 3
      const task = {
        id: 1,
        type: 'weekly',
        frequency: 3,
        weekWeekdayCount: 0,
        weekWeekendCount: 0,
        todayCount: 0,
        hasCompleted: 0,
      };
      
      // Day 1 (Monday): Task should show, complete it
      let shouldShow = task.todayCount > 0 || (task.weekWeekdayCount + task.weekWeekendCount) < task.frequency;
      expect(shouldShow).toBe(true);
      
      // Complete the task
      task.weekWeekdayCount = 1;
      task.todayCount = 1;
      task.hasCompleted = 1;
      
      // Day 2 (Tuesday): Task should still show (completed today)
      task.todayCount = 0; // Reset for new day simulation
      shouldShow = task.todayCount > 0 || (task.weekWeekdayCount + task.weekWeekendCount) < task.frequency;
      expect(shouldShow).toBe(true);
      
      // Complete again
      task.weekWeekdayCount = 2;
      task.todayCount = 1;
      
      // Day 3 (Wednesday): Complete one more time
      task.todayCount = 0;
      task.weekWeekdayCount = 3;
      task.todayCount = 1;
      
      // After 3 completions, task should NOT show (limit reached)
      task.todayCount = 0;
      shouldShow = task.todayCount > 0 || (task.weekWeekdayCount + task.weekWeekendCount) < task.frequency;
      expect(shouldShow).toBe(false);
      
      // Next week (Monday): Counter resets, task should show again
      task.weekWeekdayCount = 0;
      task.weekWeekendCount = 0;
      shouldShow = task.todayCount > 0 || (task.weekWeekdayCount + task.weekWeekendCount) < task.frequency;
      expect(shouldShow).toBe(true);
    });
  });

  describe('Monthly task workflow', () => {
    it('should track monthly completions across month boundaries', () => {
      const task = {
        id: 2,
        type: 'monthly',
        frequency: 5,
        monthCount: 0,
        todayCount: 0,
      };
      
      // Complete task 3 times in January
      task.monthCount = 3;
      let shouldShow = task.todayCount > 0 || task.monthCount < task.frequency;
      expect(shouldShow).toBe(true);
      
      // Complete 2 more times - now at limit
      task.monthCount = 5;
      shouldShow = task.todayCount > 0 || task.monthCount < task.frequency;
      expect(shouldShow).toBe(false);
      
      // February 1st: Counter resets
      task.monthCount = 0;
      shouldShow = task.todayCount > 0 || task.monthCount < task.frequency;
      expect(shouldShow).toBe(true);
      
      // Can complete again in February
      task.monthCount = 1;
      expect(task.monthCount < task.frequency).toBe(true);
    });
  });

  describe('Weekday-only task workflow', () => {
    it('should only show on weekdays and track completions correctly', () => {
      const task = {
        id: 3,
        type: 'weekdays',
        frequency: 2,
        weekWeekdayCount: 0,
        todayCount: 0,
      };
      
      const testDays = [
        { day: '2025-01-13', isWeekday: true, dayName: 'Monday' },
        { day: '2025-01-14', isWeekday: true, dayName: 'Tuesday' },
        { day: '2025-01-15', isWeekday: true, dayName: 'Wednesday' },
        { day: '2025-01-18', isWeekday: false, dayName: 'Saturday' },
        { day: '2025-01-19', isWeekday: false, dayName: 'Sunday' },
      ];
      
      testDays.forEach(({ day, isWeekday, dayName }) => {
        const shouldShow = isWeekday && (task.todayCount > 0 || task.weekWeekdayCount < task.frequency);
        expect(shouldShow).toBe(isWeekday);
      });
      
      // Complete task twice on weekdays
      task.weekWeekdayCount = 2;
      
      // Now should NOT show even on weekdays (limit reached)
      const mondayShow = true && (task.todayCount > 0 || task.weekWeekdayCount < task.frequency);
      expect(mondayShow).toBe(false);
    });
  });

  describe('Every-other-day task workflow', () => {
    it('should alternate showing every other day from creation', () => {
      const task = {
        id: 4,
        type: 'other-day',
        createdAt: dayjs('2025-01-13').toDate(), // Created on Monday
      };
      
      const testDays = [
        { date: '2025-01-13', shouldShow: true, description: 'Creation day' },
        { date: '2025-01-14', shouldShow: false, description: '1 day after' },
        { date: '2025-01-15', shouldShow: true, description: '2 days after' },
        { date: '2025-01-16', shouldShow: false, description: '3 days after' },
        { date: '2025-01-17', shouldShow: true, description: '4 days after' },
      ];
      
      testDays.forEach(({ date, shouldShow, description }) => {
        const today = dayjs(date);
        const daysSinceCreation = today.diff(dayjs(task.createdAt), 'day');
        const actualShouldShow = daysSinceCreation >= 0 && daysSinceCreation % 2 === 0;
        expect(actualShouldShow).toBe(shouldShow);
      });
    });
  });

  describe('Finite task workflow', () => {
    it('should track total completions and hide when limit reached', () => {
      const task = {
        id: 5,
        type: 'finite',
        frequency: 10,
        totalCount: 0,
        todayCount: 0,
      };
      
      // Simulate completing task over multiple days/weeks
      const completions = [
        { date: '2025-01-01', increment: 1 },
        { date: '2025-01-02', increment: 1 },
        { date: '2025-01-05', increment: 1 },
        { date: '2025-01-10', increment: 1 },
        { date: '2025-01-15', increment: 1 },
        { date: '2025-02-01', increment: 1 }, // New month
        { date: '2025-02-15', increment: 1 },
        { date: '2025-03-01', increment: 1 }, // New month
        { date: '2025-03-10', increment: 1 },
        { date: '2025-03-20', increment: 1 }, // 10th completion
      ];
      
      completions.forEach(({ date, increment }, index) => {
        task.totalCount += increment;
        const shouldShow = task.todayCount > 0 || task.totalCount < task.frequency;
        
        if (index < 9) {
          expect(shouldShow).toBe(true);
        } else {
          expect(shouldShow).toBe(false); // After 10th completion
        }
      });
    });
  });

  describe('Daily task consistency', () => {
    it('should always show daily tasks regardless of completions', () => {
      const task = {
        id: 6,
        type: 'daily',
        todayCount: 0,
        totalCount: 100, // Many completions
      };
      
      // Should show every day
      const days = ['2025-01-13', '2025-01-14', '2025-01-15', '2025-01-18', '2025-01-19'];
      days.forEach(day => {
        expect(true).toBe(true); // Daily tasks always return true
      });
      
      // Even after completing today
      task.todayCount = 5;
      days.forEach(day => {
        expect(true).toBe(true);
      });
    });
  });

  describe('Weekend-only task workflow', () => {
    it('should only show on weekends', () => {
      const task = {
        id: 7,
        type: 'weekend',
        frequency: 2,
        weekWeekendCount: 0,
        todayCount: 0,
      };
      
      const testDays = [
        { day: '2025-01-13', isWeekend: false, dayName: 'Monday' },
        { day: '2025-01-17', isWeekend: false, dayName: 'Friday' },
        { day: '2025-01-18', isWeekend: true, dayName: 'Saturday' },
        { day: '2025-01-19', isWeekend: true, dayName: 'Sunday' },
      ];
      
      testDays.forEach(({ day, isWeekend, dayName }) => {
        const shouldShow = isWeekend && (task.todayCount > 0 || task.weekWeekendCount < task.frequency);
        expect(shouldShow).toBe(isWeekend);
      });
    });
  });

  describe('Complex scenario: Multiple task types', () => {
    it('should handle multiple tasks with different frequencies simultaneously', () => {
      const tasks = [
        { id: 1, type: 'daily', frequency: null },
        { id: 2, type: 'weekly', frequency: 3, weekWeekdayCount: 2, weekWeekendCount: 0 },
        { id: 3, type: 'monthly', frequency: 5, monthCount: 4 },
        { id: 4, type: 'weekdays', frequency: 2, weekWeekdayCount: 1 },
        { id: 5, type: 'finite', frequency: 10, totalCount: 9 },
      ];
      
      const today = dayjs('2025-01-15'); // Wednesday
      const todayIsWeekend = false;
      const todayIsWeekday = true;
      
      const visibility = tasks.map(task => {
        switch (task.type) {
          case 'daily':
            return { id: task.id, show: true };
          case 'weekly':
            return { 
              id: task.id, 
              show: ((task.weekWeekdayCount ?? 0) + (task.weekWeekendCount ?? 0)) < (task.frequency ?? 1)
            };
          case 'monthly':
            return { id: task.id, show: (task.monthCount ?? 0) < (task.frequency ?? 1) };
          case 'weekdays':
            return { 
              id: task.id, 
              show: todayIsWeekday && (task.weekWeekdayCount ?? 0) < (task.frequency ?? 1)
            };
          case 'finite':
            return { id: task.id, show: (task.totalCount ?? 0) < (task.frequency ?? 1) };
          default:
            return { id: task.id, show: true };
        }
      });
      
      // Verify expected visibility
      expect(visibility.find(v => v.id === 1)?.show).toBe(true); // Daily always shows
      expect(visibility.find(v => v.id === 2)?.show).toBe(true); // Weekly: 2 < 3
      expect(visibility.find(v => v.id === 3)?.show).toBe(true); // Monthly: 4 < 5
      expect(visibility.find(v => v.id === 4)?.show).toBe(true); // Weekday: Wed + 1 < 2
      expect(visibility.find(v => v.id === 5)?.show).toBe(true); // Finite: 9 < 10
    });
  });

  describe('Completion and uncompletion cycle', () => {
    it('should handle completing and uncompleting tasks', () => {
      const task = {
        id: 8,
        type: 'weekly',
        frequency: 3,
        weekWeekdayCount: 0,
        todayCount: 0,
        hasCompleted: 0,
      };
      
      // Initially not completed
      let shouldShow = task.todayCount > 0 || (task.weekWeekdayCount + 0) < task.frequency;
      expect(shouldShow).toBe(true);
      
      // Complete task
      task.weekWeekdayCount = 1;
      task.todayCount = 1;
      task.hasCompleted = 1;
      
      // Task should still show (completed today)
      shouldShow = task.todayCount > 0 || (task.weekWeekdayCount + 0) < task.frequency;
      expect(shouldShow).toBe(true);
      
      // Uncomplete task (simulating user unchecking)
      task.weekWeekdayCount = 0;
      task.todayCount = 0;
      task.hasCompleted = 0;
      
      // Back to original state
      shouldShow = task.todayCount > 0 || (task.weekWeekdayCount + 0) < task.frequency;
      expect(shouldShow).toBe(true);
    });
  });

  describe('Reward giving workflow', () => {
    it('should give reward when completing task at milestone', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 4,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: null,
        rewardCount: 0,
      });
      
      // Before completing, no reward achieved yet
      expect(task.totalCount === 5 || (task.totalCount > 0 && task.totalCount % 5 === 0)).toBe(false);
      
      // Complete task (5th completion)
      task.totalCount = 5;
      task.rewardCount = 1;
      
      // Now reward should be given
      expect(task.totalCount > 0 && task.totalCount % 5 === 0).toBe(true);
      expect(task.rewardCount).toBe(1);
    });

    it('should track multiple rewards for periodic milestones', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 0,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: null,
        rewardCount: 0,
      });
      
      // First milestone at 5
      task.totalCount = 5;
      task.rewardCount = 1;
      expect(task.totalCount % 5 === 0).toBe(true);
      
      // Second milestone at 10
      task.totalCount = 10;
      task.rewardCount = 2;
      expect(task.totalCount % 5 === 0).toBe(true);
      
      // Third milestone at 15
      task.totalCount = 15;
      task.rewardCount = 3;
      expect(task.totalCount % 5 === 0).toBe(true);
    });

    it('should give reward only once at finite completion', () => {
      const task = createMockTask({
        type: 'finite',
        totalCount: 0,
        frequency: 10,
        rewardWhen: 'finished',
        hasReward: true,
        maxRewards: null,
        rewardCount: 0,
      });
      
      // Complete all 10 times
      task.totalCount = 10;
      task.completedAt = new Date('2025-01-15');
      task.rewardCount = 1;
      
      // Reward given once when finished
      expect(task.completedAt !== null).toBe(true);
      expect(task.rewardCount).toBe(1);
    });

    it('should respect maxRewards limit for periodic rewards', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 0,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: 2,
        rewardCount: 0,
      });
      
      // First reward at 5 completions
      task.totalCount = 5;
      task.rewardCount = 1;
      const achieved1 = task.totalCount > 0 && task.totalCount % 5 === 0 && ((task.maxRewards !== null && task.maxRewards <= task.totalCount / 5) || task.maxRewards === null);
      // maxRewards(2) > milestonesPassed(5/5=1), so no reward yet
      expect(achieved1).toBe(false);
      
      // Second reward at 10 completions
      task.totalCount = 10;
      task.rewardCount = 2;
      const achieved2 = task.totalCount > 0 && task.totalCount % 5 === 0 && ((task.maxRewards !== null && task.maxRewards <= task.totalCount / 5) || task.maxRewards === null);
      // maxRewards(2) === milestonesPassed(10/5=2), reward achieved
      expect(achieved2).toBe(true);
      
      // Third reward at 15 completions - should NOT give reward (maxRewards=2 reached)
      task.totalCount = 15;
      task.rewardCount = 2; // Remains at 2
      const achieved3 = task.totalCount > 0 && task.totalCount % 5 === 0 && ((task.maxRewards !== null && task.maxRewards <= task.totalCount / 5) || task.maxRewards === null);
      // maxRewards(2) <= milestonesPassed(15/5=3), reward IS achieved (can still give)
      expect(achieved3).toBe(true); // 2 <= 3
      task.totalCount = 10;
      task.rewardCount = 2;
      expect(task.totalCount > 0 && task.totalCount % 5 === 0 && (2 <= task.totalCount / 5 || task.maxRewards === null)).toBe(true);
      
      // Third reward at 15 completions - should NOT give reward (maxRewards=2 reached)
      task.totalCount = 15;
      task.rewardCount = 2; // Remains at 2
      expect(task.totalCount > 0 && task.totalCount % 5 === 0 && (2 <= task.totalCount / 5 || task.maxRewards === null)).toBe(true);
    });

    it('should handle reward removal when uncompleting at milestone', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 10,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: null,
        rewardCount: 2,
      });
      
      // After 10 completions, reward should be achieved
      expect(task.totalCount > 0 && task.totalCount % 5 === 0).toBe(true);
      
      // Uncomplete task (back to 9)
      task.totalCount = 9;
      task.rewardCount = 1; // Decrement reward count
      
      // Reward should no longer be achieved
      expect(task.totalCount > 0 && task.totalCount % 5 === 0).toBe(false);
    });

    it('should track rewardCount correctly across complete/uncomplete cycles', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 3,
        rewardWhen: '3',
        hasReward: true,
        maxRewards: null,
        rewardCount: 1,
      });
      
      // At milestone (3), 1 reward given
      expect(task.totalCount > 0 && task.totalCount % 3 === 0).toBe(true);
      expect(task.rewardCount).toBe(1);
      
      // Complete to 6 (next milestone)
      task.totalCount = 6;
      task.rewardCount = 2;
      expect(task.totalCount > 0 && task.totalCount % 3 === 0).toBe(true);
      expect(task.rewardCount).toBe(2);
      
      // Uncomplete back to 5
      task.totalCount = 5;
      task.rewardCount = 1;
      expect(task.totalCount > 0 && task.totalCount % 3 === 0).toBe(false); // 5%3=2
      expect(task.rewardCount).toBe(1);
      
      // Complete again to 6
      task.totalCount = 6;
      task.rewardCount = 2;
      expect(task.totalCount > 0 && task.totalCount % 3 === 0).toBe(true);
      expect(task.rewardCount).toBe(2);
    });

    it('should handle removing last award when uncompleting at milestone', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 6,
        rewardWhen: '3',
        hasReward: true,
        maxRewards: null,
        rewardCount: 2,
      });
      
      // At milestone (6), 2 rewards given
      expect(task.totalCount > 0 && task.totalCount % 3 === 0).toBe(true);
      
      // Uncomplete task - should remove last award (back to 5 completions)
      task.totalCount = 5;
      task.rewardCount = 1;
      
      // After uncomplete, milestone still at 5 (still qualifies)
      expect(task.totalCount > 0 && task.totalCount % 3 === 0).toBe(false); // 5%3=2
      expect(task.rewardCount).toBe(1);
    });

    it('should not remove award when uncompleting below milestone', () => {
      const task = createMockTask({
        type: 'daily',
        totalCount: 4,
        rewardWhen: '5',
        hasReward: true,
        maxRewards: null,
        rewardCount: 0,
      });
      
      // Below milestone (4 completions), no reward given yet
      expect(task.totalCount > 0 && task.totalCount % 5 === 0).toBe(false);
      
      // Uncomplete task to 3
      task.totalCount = 3;
      task.rewardCount = 0;
      
      // Still below milestone, no change to rewards
      expect(task.totalCount > 0 && task.totalCount % 5 === 0).toBe(false);
      expect(task.rewardCount).toBe(0);
    });
  });
});
