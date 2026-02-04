import {
  getStartAndEndDates,
  getStartAndEndTimestamps,
  getWeekStartAndEnd,
  getWeekStartAndEndTimestamps,
  getMonthStartAndEnd,
  getMonthStartAndEndTimestamps,
  isWeekend,
} from '@/services/DateUtils';

describe('DateUtils', () => {
  describe('getStartAndEndDates', () => {
    it.each([
      {
        input: new Date('2025-01-15T12:30:45.123'),
        expectedStart: new Date('2025-01-15T00:00:00.000'),
        expectedEnd: new Date('2025-01-15T23:59:59.999'),
        description: 'midday timestamp',
      },
      {
        input: new Date('2025-06-20T00:00:00.000'),
        expectedStart: new Date('2025-06-20T00:00:00.000'),
        expectedEnd: new Date('2025-06-20T23:59:59.999'),
        description: 'midnight timestamp',
      },
      {
        input: new Date('2025-12-31T23:59:59.999'),
        expectedStart: new Date('2025-12-31T00:00:00.000'),
        expectedEnd: new Date('2025-12-31T23:59:59.999'),
        description: 'end of year timestamp',
      },
      {
        input: new Date('2025-02-28T15:45:30.500'),
        expectedStart: new Date('2025-02-28T00:00:00.000'),
        expectedEnd: new Date('2025-02-28T23:59:59.999'),
        description: 'February non-leap year',
      },
      {
        input: new Date('2024-02-29T10:20:30.400'),
        expectedStart: new Date('2024-02-29T00:00:00.000'),
        expectedEnd: new Date('2024-02-29T23:59:59.999'),
        description: 'February leap year',
      },
    ])('should return correct day boundaries for $description', ({ input, expectedStart, expectedEnd }) => {
      const [start, end] = getStartAndEndDates(input);
      expect(start).toEqual(expectedStart);
      expect(end).toEqual(expectedEnd);
    });
  });

  describe('getStartAndEndTimestamps', () => {
    it.each([
      {
        input: new Date('2025-01-15T12:00:00.000'),
        expectedStart: Math.floor(new Date('2025-01-15T00:00:00.000').getTime() / 1000),
        expectedEnd: Math.floor(new Date('2025-01-15T23:59:59.999').getTime() / 1000),
        description: 'January 15, 2025',
      },
      {
        input: new Date('2025-12-25T08:30:00.000'),
        expectedStart: Math.floor(new Date('2025-12-25T00:00:00.000').getTime() / 1000),
        expectedEnd: Math.floor(new Date('2025-12-25T23:59:59.999').getTime() / 1000),
        description: 'Christmas Day 2025',
      },
    ])('should return Unix timestamps for $description', ({ input, expectedStart, expectedEnd }) => {
      const [start, end] = getStartAndEndTimestamps(input);
      expect(start).toBe(expectedStart);
      expect(end).toBe(expectedEnd);
    });

    it('should return integer timestamps', () => {
      const [start, end] = getStartAndEndTimestamps(new Date());
      expect(Number.isInteger(start)).toBe(true);
      expect(Number.isInteger(end)).toBe(true);
    });
  });

  describe('getWeekStartAndEnd', () => {
    it.each([
      {
        input: new Date(2025, 0, 15, 12, 0, 0), // Wednesday Jan 15, 2025
        expectedStart: new Date(2025, 0, 13, 0, 0, 0), // Monday
        expectedEnd: new Date(2025, 0, 19, 23, 59, 59, 999), // Sunday
        description: 'Wednesday in middle of week',
      },
      {
        input: new Date(2025, 0, 13, 12, 0, 0), // Monday Jan 13, 2025
        expectedStart: new Date(2025, 0, 13, 0, 0, 0), // Monday
        expectedEnd: new Date(2025, 0, 19, 23, 59, 59, 999), // Sunday
        description: 'Monday (start of week)',
      },
      {
        input: new Date(2025, 0, 19, 12, 0, 0), // Sunday Jan 19, 2025
        expectedStart: new Date(2025, 0, 13, 0, 0, 0), // Monday
        expectedEnd: new Date(2025, 0, 19, 23, 59, 59, 999), // Sunday
        description: 'Sunday (end of week)',
      },
      {
        input: new Date(2025, 0, 12, 12, 0, 0), // Sunday (previous week)
        expectedStart: new Date(2025, 0, 6, 0, 0, 0), // Monday
        expectedEnd: new Date(2025, 0, 12, 23, 59, 59, 999), // Sunday
        description: 'Sunday at week boundary (previous week)',
      },
      {
        input: new Date(2025, 11, 31, 12, 0, 0), // Wednesday Dec 31, 2025
        expectedStart: new Date(2025, 11, 29, 0, 0, 0), // Monday
        expectedEnd: new Date(2026, 0, 4, 23, 59, 59, 999), // Sunday (next year)
        description: 'Year-end date spanning into next year',
      },
    ])('should return week boundaries for $description', ({ input, expectedStart, expectedEnd }) => {
      const [start, end] = getWeekStartAndEnd(input);
      expect(start).toEqual(expectedStart);
      expect(end).toEqual(expectedEnd);
    });

    it('should always return Monday as start and Sunday as end', () => {
      const testDate = new Date('2025-06-15');
      const [start, end] = getWeekStartAndEnd(testDate);
      expect(start.getDay()).toBe(1); // Monday
      expect(end.getDay()).toBe(0); // Sunday
    });
  });

  describe('getWeekStartAndEndTimestamps', () => {
    it('should return Unix timestamps for week boundaries', () => {
      const input = new Date('2025-01-15');
      const [start, end] = getWeekStartAndEndTimestamps(input);
      const [dateStart, dateEnd] = getWeekStartAndEnd(input);
      
      expect(start).toBe(Math.floor(dateStart.getTime() / 1000));
      expect(end).toBe(Math.floor(dateEnd.getTime() / 1000));
    });

    it.each([
      { input: new Date('2025-01-15'), description: 'mid-week' },
      { input: new Date('2025-01-13'), description: 'Monday' },
      { input: new Date('2025-01-19'), description: 'Sunday' },
    ])('should return integer timestamps for $description', ({ input }) => {
      const [start, end] = getWeekStartAndEndTimestamps(input);
      expect(Number.isInteger(start)).toBe(true);
      expect(Number.isInteger(end)).toBe(true);
    });
  });

  describe('getMonthStartAndEnd', () => {
    it.each([
      {
        input: new Date('2025-01-15'),
        expectedStart: new Date('2025-01-01T00:00:00.000'),
        expectedEnd: new Date('2025-01-31T23:59:59.999'),
        description: 'January 2025 (31 days)',
      },
      {
        input: new Date('2025-02-15'),
        expectedStart: new Date('2025-02-01T00:00:00.000'),
        expectedEnd: new Date('2025-02-28T23:59:59.999'),
        description: 'February 2025 (non-leap year, 28 days)',
      },
      {
        input: new Date('2024-02-15'),
        expectedStart: new Date('2024-02-01T00:00:00.000'),
        expectedEnd: new Date('2024-02-29T23:59:59.999'),
        description: 'February 2024 (leap year, 29 days)',
      },
      {
        input: new Date('2025-04-15'),
        expectedStart: new Date('2025-04-01T00:00:00.000'),
        expectedEnd: new Date('2025-04-30T23:59:59.999'),
        description: 'April 2025 (30 days)',
      },
      {
        input: new Date('2025-12-25'),
        expectedStart: new Date('2025-12-01T00:00:00.000'),
        expectedEnd: new Date('2025-12-31T23:59:59.999'),
        description: 'December 2025',
      },
    ])('should return month boundaries for $description', ({ input, expectedStart, expectedEnd }) => {
      const [start, end] = getMonthStartAndEnd(input);
      expect(start).toEqual(expectedStart);
      expect(end).toEqual(expectedEnd);
    });

    it('should handle month boundaries correctly', () => {
      const lastDayOfMonth = new Date('2025-01-31');
      const [start, end] = getMonthStartAndEnd(lastDayOfMonth);
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(31);
    });
  });

  describe('getMonthStartAndEndTimestamps', () => {
    it('should return Unix timestamps for month boundaries', () => {
      const input = new Date('2025-06-15');
      const [start, end] = getMonthStartAndEndTimestamps(input);
      const [dateStart, dateEnd] = getMonthStartAndEnd(input);
      
      expect(start).toBe(Math.floor(dateStart.getTime() / 1000));
      expect(end).toBe(Math.floor(dateEnd.getTime() / 1000));
    });

    it.each([
      { input: new Date('2025-01-15'), description: 'January' },
      { input: new Date('2025-02-15'), description: 'February' },
      { input: new Date('2024-02-15'), description: 'February leap year' },
    ])('should return integer timestamps for $description', ({ input }) => {
      const [start, end] = getMonthStartAndEndTimestamps(input);
      expect(Number.isInteger(start)).toBe(true);
      expect(Number.isInteger(end)).toBe(true);
    });
  });

  describe('isWeekend', () => {
    it.each([
      { date: new Date('2025-01-13T12:00:00'), expected: false, day: 'Monday' },
      { date: new Date('2025-01-14T12:00:00'), expected: false, day: 'Tuesday' },
      { date: new Date('2025-01-15T12:00:00'), expected: false, day: 'Wednesday' },
      { date: new Date('2025-01-16T12:00:00'), expected: false, day: 'Thursday' },
      { date: new Date('2025-01-17T12:00:00'), expected: false, day: 'Friday' },
      { date: new Date('2025-01-18T12:00:00'), expected: true, day: 'Saturday' },
      { date: new Date('2025-01-19T12:00:00'), expected: true, day: 'Sunday' },
    ])('should return $expected for $day', ({ date, expected }) => {
      expect(isWeekend(date)).toBe(expected);
    });

    it('should handle edge cases around midnight', () => {
      const saturdayMidnight = new Date('2025-01-18T00:00:00');
      const saturdayLate = new Date('2025-01-18T23:59:59');
      const sundayMidnight = new Date('2025-01-19T00:00:00');
      
      expect(isWeekend(saturdayMidnight)).toBe(true);
      expect(isWeekend(saturdayLate)).toBe(true);
      expect(isWeekend(sundayMidnight)).toBe(true);
    });

    it('should work consistently for any time of day', () => {
      const fridayTimes = [
        new Date('2025-01-17T00:00:00'),
        new Date('2025-01-17T06:30:00'),
        new Date('2025-01-17T12:00:00'),
        new Date('2025-01-17T18:45:00'),
        new Date('2025-01-17T23:59:59'),
      ];
      
      fridayTimes.forEach(date => {
        expect(isWeekend(date)).toBe(false);
      });
    });
  });
});
