// Import the filtering logic for testing
// Note: We'll test the filtering logic directly by extracting it from the hook

import dayjs from 'dayjs';

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

// Extract the filtering logic from useDB.ts for testing
// This mirrors the logic in useDB.ts lines 68-113
function shouldShowTask(
  task: ITask,
  today: dayjs.Dayjs,
  todayIsWeekend: boolean,
  todayIsWeekday: boolean
): boolean {
  const completedToday = task.todayCount > 0;
  
  switch (task.type) {
    case 'daily':
      return true;
    case 'weekly':
      return (
        completedToday ||
        (task.weekWeekdayCount ?? 0) + (task.weekWeekendCount ?? 0) < (task.frequency ?? 1)
      );
    case 'monthly':
      return completedToday || task.monthCount < (task.frequency ?? 1);
    case 'weekdays':
      return (
        todayIsWeekday &&
        (completedToday || (task.weekWeekdayCount ?? 0) < (task.frequency ?? 1))
      );
    case 'weekend':
      return (
        todayIsWeekend &&
        (completedToday || (task.weekWeekendCount ?? 0) < (task.frequency ?? 1))
      );
    case 'other-day':
      const daysSinceCreation = today.diff(dayjs(task.createdAt), 'day');
      const shouldShowOnDay = daysSinceCreation >= 0 && daysSinceCreation % 2 === 0;
      return shouldShowOnDay;
    case 'finite':
      return (
        completedToday || (task.totalCount ?? 0) < (task.frequency ?? 1)
      );
    default:
      return true;
  }
}

describe('Task Filtering Logic', () => {
  describe('Daily tasks', () => {
    it.each([
      { todayCount: 0, description: 'not completed today' },
      { todayCount: 1, description: 'completed today' },
      { todayCount: 5, description: 'completed multiple times today' },
    ])('should always show daily tasks regardless of completion status ($description)', ({ todayCount }) => {
      const task = createMockTask({ type: 'daily', todayCount });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(true);
    });

    it.each([
      { day: '2025-01-13', isWeekend: false }, // Monday
      { day: '2025-01-18', isWeekend: true },  // Saturday
      { day: '2025-01-19', isWeekend: true },  // Sunday
    ])('should show on any day of the week', ({ day, isWeekend }) => {
      const task = createMockTask({ type: 'daily' });
      const today = dayjs(day);
      expect(shouldShowTask(task, today, isWeekend, !isWeekend)).toBe(true);
    });
  });

  describe('Weekly tasks', () => {
    it.each([
      { 
        weekWeekdayCount: 0, 
        weekWeekendCount: 0, 
        frequency: 3, 
        expected: true,
        description: 'no completions, freq=3' 
      },
      { 
        weekWeekdayCount: 2, 
        weekWeekendCount: 0, 
        frequency: 3, 
        expected: true,
        description: '2 completions, freq=3' 
      },
      { 
        weekWeekdayCount: 3, 
        weekWeekendCount: 0, 
        frequency: 3, 
        expected: false,
        description: '3 completions (at limit), freq=3' 
      },
      { 
        weekWeekdayCount: 2, 
        weekWeekendCount: 1, 
        frequency: 3, 
        expected: false,
        description: '3 completions total (at limit), freq=3' 
      },
      { 
        weekWeekdayCount: 4, 
        weekWeekendCount: 0, 
        frequency: 3, 
        expected: false,
        description: '4 completions (over limit), freq=3' 
      },
      { 
        weekWeekdayCount: 0, 
        weekWeekendCount: 0, 
        frequency: 1, 
        expected: true,
        description: 'no completions, freq=1' 
      },
      { 
        weekWeekdayCount: 1, 
        weekWeekendCount: 0, 
        frequency: 1, 
        expected: false,
        description: '1 completion (at limit), freq=1' 
      },
    ])('should return $expected for weekly task with $description', ({ weekWeekdayCount, weekWeekendCount, frequency, expected }) => {
      const task = createMockTask({
        type: 'weekly',
        frequency,
        weekWeekdayCount,
        weekWeekendCount,
        todayCount: 0,
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(expected);
    });

    it('should still show if completed today (even if over limit)', () => {
      const task = createMockTask({
        type: 'weekly',
        frequency: 3,
        weekWeekdayCount: 5,
        weekWeekendCount: 0,
        todayCount: 1, // Completed today
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(true);
    });

    it.each([
      { day: '2025-01-13', isWeekend: false }, // Monday
      { day: '2025-01-18', isWeekend: true },  // Saturday
    ])('should respect frequency on any day ($day)', ({ day, isWeekend }) => {
      const task = createMockTask({
        type: 'weekly',
        frequency: 2,
        weekWeekdayCount: 1,
        weekWeekendCount: 0,
      });
      const today = dayjs(day);
      expect(shouldShowTask(task, today, isWeekend, !isWeekend)).toBe(true);
    });
  });

  describe('Monthly tasks', () => {
    it.each([
      { monthCount: 0, frequency: 5, expected: true, description: 'no completions, freq=5' },
      { monthCount: 3, frequency: 5, expected: true, description: '3 completions, freq=5' },
      { monthCount: 5, frequency: 5, expected: false, description: '5 completions (at limit), freq=5' },
      { monthCount: 7, frequency: 5, expected: false, description: '7 completions (over limit), freq=5' },
      { monthCount: 0, frequency: 1, expected: true, description: 'no completions, freq=1' },
      { monthCount: 1, frequency: 1, expected: false, description: '1 completion (at limit), freq=1' },
    ])('should return $expected for monthly task with $description', ({ monthCount, frequency, expected }) => {
      const task = createMockTask({
        type: 'monthly',
        frequency,
        monthCount,
        todayCount: 0,
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(expected);
    });

    it('should still show if completed today (even if over monthly limit)', () => {
      const task = createMockTask({
        type: 'monthly',
        frequency: 5,
        monthCount: 10,
        todayCount: 1,
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(true);
    });
  });

  describe('Weekday tasks', () => {
    it.each([
      { day: '2025-01-13', isWeekday: true, isWeekend: false, expected: true, description: 'Monday' },
      { day: '2025-01-14', isWeekday: true, isWeekend: false, expected: true, description: 'Tuesday' },
      { day: '2025-01-15', isWeekday: true, isWeekend: false, expected: true, description: 'Wednesday' },
      { day: '2025-01-16', isWeekday: true, isWeekend: false, expected: true, description: 'Thursday' },
      { day: '2025-01-17', isWeekday: true, isWeekend: false, expected: true, description: 'Friday' },
      { day: '2025-01-18', isWeekday: false, isWeekend: true, expected: false, description: 'Saturday' },
      { day: '2025-01-19', isWeekday: false, isWeekend: true, expected: false, description: 'Sunday' },
    ])('should show only on weekdays: $description', ({ day, isWeekday, isWeekend, expected }) => {
      const task = createMockTask({
        type: 'weekdays',
        frequency: 3,
        weekWeekdayCount: 0,
      });
      const today = dayjs(day);
      expect(shouldShowTask(task, today, isWeekend, isWeekday)).toBe(expected);
    });

    it.each([
      { weekWeekdayCount: 0, frequency: 3, expected: true, description: '0 completions, freq=3' },
      { weekWeekdayCount: 2, frequency: 3, expected: true, description: '2 completions, freq=3' },
      { weekWeekdayCount: 3, frequency: 3, expected: false, description: '3 completions (at limit), freq=3' },
      { weekWeekdayCount: 4, frequency: 3, expected: false, description: '4 completions (over limit), freq=3' },
    ])('should respect frequency on weekdays: $description', ({ weekWeekdayCount, frequency, expected }) => {
      const task = createMockTask({
        type: 'weekdays',
        frequency,
        weekWeekdayCount,
        todayCount: 0,
      });
      const today = dayjs('2025-01-15'); // Wednesday
      expect(shouldShowTask(task, today, false, true)).toBe(expected);
    });

    it('should still show on weekday if completed today', () => {
      const task = createMockTask({
        type: 'weekdays',
        frequency: 3,
        weekWeekdayCount: 5,
        todayCount: 1,
      });
      const today = dayjs('2025-01-15'); // Wednesday
      expect(shouldShowTask(task, today, false, true)).toBe(true);
    });
  });

  describe('Weekend tasks', () => {
    it.each([
      { day: '2025-01-13', isWeekday: true, isWeekend: false, expected: false, description: 'Monday' },
      { day: '2025-01-17', isWeekday: true, isWeekend: false, expected: false, description: 'Friday' },
      { day: '2025-01-18', isWeekday: false, isWeekend: true, expected: true, description: 'Saturday' },
      { day: '2025-01-19', isWeekday: false, isWeekend: true, expected: true, description: 'Sunday' },
    ])('should show only on weekends: $description', ({ day, isWeekday, isWeekend, expected }) => {
      const task = createMockTask({
        type: 'weekend',
        frequency: 2,
        weekWeekendCount: 0,
      });
      const today = dayjs(day);
      expect(shouldShowTask(task, today, isWeekend, isWeekday)).toBe(expected);
    });

    it.each([
      { weekWeekendCount: 0, frequency: 2, expected: true, description: '0 completions, freq=2' },
      { weekWeekendCount: 1, frequency: 2, expected: true, description: '1 completion, freq=2' },
      { weekWeekendCount: 2, frequency: 2, expected: false, description: '2 completions (at limit), freq=2' },
      { weekWeekendCount: 3, frequency: 2, expected: false, description: '3 completions (over limit), freq=2' },
    ])('should respect frequency on weekends: $description', ({ weekWeekendCount, frequency, expected }) => {
      const task = createMockTask({
        type: 'weekend',
        frequency,
        weekWeekendCount,
        todayCount: 0,
      });
      const today = dayjs('2025-01-18'); // Saturday
      expect(shouldShowTask(task, today, true, false)).toBe(expected);
    });
  });

  describe('Other-day tasks', () => {
    it.each([
      { createdAt: '2025-01-13', currentDay: '2025-01-13', expected: true, description: 'created today' },
      { createdAt: '2025-01-13', currentDay: '2025-01-14', expected: false, description: '1 day after creation' },
      { createdAt: '2025-01-13', currentDay: '2025-01-15', expected: true, description: '2 days after creation' },
      { createdAt: '2025-01-13', currentDay: '2025-01-16', expected: false, description: '3 days after creation' },
      { createdAt: '2025-01-13', currentDay: '2025-01-17', expected: true, description: '4 days after creation' },
      { createdAt: '2025-01-01', currentDay: '2025-01-15', expected: true, description: '14 days after creation (even)' },
      { createdAt: '2025-01-01', currentDay: '2025-01-29', expected: true, description: '28 days after creation (even)' },
      { createdAt: '2025-01-01', currentDay: '2025-02-12', expected: true, description: '42 days after creation (even)' },
    ])('should show on alternating days: $description', ({ createdAt, currentDay, expected }) => {
      const task = createMockTask({
        type: 'other-day',
        createdAt: new Date(createdAt),
      });
      const today = dayjs(currentDay);
      expect(shouldShowTask(task, today, false, true)).toBe(expected);
    });

    it('should not show before creation date', () => {
      const task = createMockTask({
        type: 'other-day',
        createdAt: new Date('2025-01-15T12:00:00'),
      });
      const today = dayjs('2025-01-14'); // Day before creation
      expect(shouldShowTask(task, today, false, true)).toBe(false);
    });

    it('should work correctly across month boundaries', () => {
      const task = createMockTask({
        type: 'other-day',
        createdAt: new Date('2025-01-31T00:00:00'),
      });
      const today = dayjs('2025-02-02'); // 2 days later, should show
      expect(shouldShowTask(task, today, false, true)).toBe(true);
    });
  });

  describe('Finite tasks', () => {
    it.each([
      { totalCount: 0, frequency: 10, expected: true, description: '0 completions, freq=10' },
      { totalCount: 5, frequency: 10, expected: true, description: '5 completions, freq=10' },
      { totalCount: 9, frequency: 10, expected: true, description: '9 completions, freq=10' },
      { totalCount: 10, frequency: 10, expected: false, description: '10 completions (at limit), freq=10' },
      { totalCount: 15, frequency: 10, expected: false, description: '15 completions (over limit), freq=10' },
      { totalCount: 0, frequency: 1, expected: true, description: '0 completions, freq=1' },
      { totalCount: 1, frequency: 1, expected: false, description: '1 completion (at limit), freq=1' },
    ])('should return $expected for finite task with $description', ({ totalCount, frequency, expected }) => {
      const task = createMockTask({
        type: 'finite',
        frequency,
        totalCount,
        todayCount: 0,
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(expected);
    });

    it('should still show if completed today (even if over total limit)', () => {
      const task = createMockTask({
        type: 'finite',
        frequency: 10,
        totalCount: 15,
        todayCount: 1,
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(true);
    });

    it('should work regardless of day of week', () => {
      const task = createMockTask({
        type: 'finite',
        frequency: 5,
        totalCount: 2,
      });
      
      // Test on different days
      expect(shouldShowTask(task, dayjs('2025-01-13'), false, true)).toBe(true); // Monday
      expect(shouldShowTask(task, dayjs('2025-01-18'), true, false)).toBe(true); // Saturday
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it.each([
      { type: 'daily', frequency: null, expected: true },
      { type: 'weekly', frequency: null, weekWeekdayCount: 0, expected: true },
      { type: 'weekly', frequency: null, weekWeekdayCount: 1, expected: false },
      { type: 'monthly', frequency: null, monthCount: 0, expected: true },
      { type: 'monthly', frequency: null, monthCount: 1, expected: false },
    ])('should handle null frequency (default to 1)', ({ type, frequency, expected, ...rest }) => {
      const task = createMockTask({
        type: type as ITask['type'],
        frequency: frequency as any,
        ...rest,
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(expected);
    });

    it('should handle tasks with completedAt set (not in filter but good to verify)', () => {
      // Note: In the actual hook, tasks with completedAt are filtered out before this logic runs
      const task = createMockTask({
        type: 'daily',
        completedAt: new Date('2025-01-10'),
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(true);
    });

    it('should handle undefined counts gracefully', () => {
      const task = createMockTask({
        type: 'weekly',
        frequency: 3,
        weekWeekdayCount: undefined as any,
        weekWeekendCount: undefined as any,
      });
      const today = dayjs('2025-01-15');
      expect(shouldShowTask(task, today, false, true)).toBe(true);
    });
  });
});
