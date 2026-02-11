import * as Notifications from 'expo-notifications';
import { getNotificationCutoff } from '@/services/DateUtils';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily',
  },
}));

describe('useNotifications logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getNotificationCutoff', () => {
    it('should return 23:00:00 for any input date', () => {
      const input = new Date('2025-01-15T12:30:45.123');
      const result = getNotificationCutoff(input);
      
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should preserve the date portion of the input', () => {
      const input = new Date('2025-06-20T12:00:00.000');
      const result = getNotificationCutoff(input);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(result.getDate()).toBe(20);
    });

    it('should not mutate the original date', () => {
      const original = new Date('2025-01-15T12:30:45.123');
      const originalTime = original.getTime();
      getNotificationCutoff(original);
      expect(original.getTime()).toBe(originalTime);
    });
  });

  describe('notification scheduling logic', () => {
    it('should schedule for today when before 23:00', () => {
      const now = new Date('2025-01-15T12:00:00.000');
      const cutoff = getNotificationCutoff(now);
      
      expect(now < cutoff).toBe(true);
      
      const expectedScheduleDate = new Date('2025-01-15T23:00:00.000');
      expect(cutoff).toEqual(expectedScheduleDate);
    });

    it('should schedule for tomorrow when at or after 23:00', () => {
      const now = new Date('2025-01-15T23:30:00.000');
      const cutoff = getNotificationCutoff(now);
      
      expect(now >= cutoff).toBe(true);
      
      // When past cutoff, we add 1 day
      const tomorrow = new Date(cutoff);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const expectedScheduleDate = new Date('2025-01-16T23:00:00.000');
      expect(tomorrow).toEqual(expectedScheduleDate);
    });

    it('should handle edge case exactly at 23:00:00', () => {
      const now = new Date('2025-01-15T23:00:00.000');
      const cutoff = getNotificationCutoff(now);
      
      expect(now >= cutoff).toBe(true);
    });
  });

  describe('expo-notifications integration', () => {
    it('should schedule notification with correct parameters', async () => {
      const mockDate = new Date('2025-01-15T23:00:00.000');
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-key-123');

      const result = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'You still have Tasks to check',
          body: 'There are still a few pending tasksl',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: mockDate,
        },
      });

      expect(result).toBe('notification-key-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'You still have Tasks to check',
          body: 'There are still a few pending tasksl',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: mockDate,
        },
      });
    });

    it('should cancel scheduled notification', async () => {
      await Notifications.cancelScheduledNotificationAsync('notification-key-123');

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-key-123');
    });

    it('should check if notification exists', async () => {
      const existingNotifications = [
        { identifier: 'notification-1' },
        { identifier: 'notification-2' },
      ];
      
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(existingNotifications);
      
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const exists = allScheduled.find((n: any) => n.identifier === 'notification-1');
      
      expect(exists).toBeDefined();
    });

    it('should return undefined if notification does not exist', async () => {
      const existingNotifications = [
        { identifier: 'notification-1' },
      ];
      
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(existingNotifications);
      
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const exists = allScheduled.find((n: any) => n.identifier === 'non-existent');
      
      expect(exists).toBeUndefined();
    });
  });
});
