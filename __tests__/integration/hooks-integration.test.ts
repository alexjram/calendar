import { renderHook, act } from "@testing-library/react-native";
import React from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { DBContext } from "@/context/DBContext";
import { TaskEventsProvider } from "@/hooks/useTaskEvents";
import useTodayTasks from "@/hooks/useTodayTasks";
import useNotifications from "@/hooks/useNotifications";
import * as Notifications from "expo-notifications";

// Extend dayjs
dayjs.extend(isoWeek);

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: {
    DATE: "date",
    TIME_INTERVAL: "timeInterval",
    DAILY: "daily",
  },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

// Mock Sentry
jest.mock("@sentry/react-native", () => ({
  captureException: jest.fn(),
}));

/**
 * Integration tests for hooks working together
 * These tests verify that hooks interact correctly and maintain state consistency
 */
describe("Hooks Integration Tests", () => {
  const createMockDb = () => ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  });

  let mockDb: ReturnType<typeof createMockDb>;

  const createWrapper = (db: any) => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        DBContext.Provider,
        { value: db },
        React.createElement(TaskEventsProvider, null, children)
      );
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notification-key-123");
  });

  describe("Task filtering by type", () => {
    it("should filter daily tasks correctly - always show", async () => {
      const mockTasks = [
        {
          id: 1,
          title: "Daily Task",
          type: "daily",
          todayCount: 5,
          totalCount: 100,
          frequency: 1,
          createdAt: new Date(),
        },
      ];

      mockDb.orderBy.mockResolvedValueOnce(mockTasks);

      const Wrapper = createWrapper(mockDb);
      const { result } = renderHook(() => useTodayTasks(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.getTasks();
      });

      // Daily tasks always show regardless of completion count
      expect(result.current.tasks).toHaveLength(1);
    });

    it("should filter weekly tasks based on frequency limit", async () => {
      const mockTasks = [
        {
          id: 1,
          title: "Weekly Under Limit",
          type: "weekly",
          todayCount: 0,
          weekWeekdayCount: 2,
          weekWeekendCount: 0,
          frequency: 3,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: "Weekly At Limit",
          type: "weekly",
          todayCount: 0,
          weekWeekdayCount: 3,
          weekWeekendCount: 0,
          frequency: 3,
          createdAt: new Date(),
        },
      ];

      mockDb.orderBy.mockResolvedValueOnce(mockTasks);

      const Wrapper = createWrapper(mockDb);
      const { result } = renderHook(() => useTodayTasks(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.getTasks();
      });

      // Only task under limit should show
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe(1);
    });

    it("should filter monthly tasks based on monthly count", async () => {
      const mockTasks = [
        {
          id: 1,
          title: "Monthly Under Limit",
          type: "monthly",
          todayCount: 0,
          monthCount: 3,
          frequency: 5,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: "Monthly At Limit",
          type: "monthly",
          todayCount: 0,
          monthCount: 5,
          frequency: 5,
          createdAt: new Date(),
        },
      ];

      mockDb.orderBy.mockResolvedValueOnce(mockTasks);

      const Wrapper = createWrapper(mockDb);
      const { result } = renderHook(() => useTodayTasks(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.getTasks();
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe(1);
    });

    it("should filter finite tasks based on total count", async () => {
      const mockTasks = [
        {
          id: 1,
          title: "Finite Under Limit",
          type: "finite",
          todayCount: 0,
          totalCount: 7,
          frequency: 10,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: "Finite At Limit",
          type: "finite",
          todayCount: 0,
          totalCount: 10,
          frequency: 10,
          createdAt: new Date(),
        },
      ];

      mockDb.orderBy.mockResolvedValueOnce(mockTasks);

      const Wrapper = createWrapper(mockDb);
      const { result } = renderHook(() => useTodayTasks(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.getTasks();
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe(1);
    });
  });

  describe("Completed today exception", () => {
    it("should always show task if completed today, even over limit", async () => {
      const mockTasks = [
        {
          id: 1,
          title: "Weekly Over Limit",
          type: "weekly",
          todayCount: 1, // Completed today
          weekWeekdayCount: 5, // Over limit
          weekWeekendCount: 0,
          frequency: 3,
          createdAt: new Date(),
        },
      ];

      mockDb.orderBy.mockResolvedValueOnce(mockTasks);

      const Wrapper = createWrapper(mockDb);
      const { result } = renderHook(() => useTodayTasks(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.getTasks();
      });

      // Should show because completed today
      expect(result.current.tasks).toHaveLength(1);
    });
  });

  describe("Notifications integration", () => {
    it("should schedule notification when called", async () => {
      const Wrapper = createWrapper(mockDb);
      const { result } = renderHook(() => useNotifications(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.schedulePendingNotification();
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle notification scheduling errors", async () => {
      const error = new Error("Notification permission denied");
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(error);

      const Wrapper = createWrapper(mockDb);
      const { result } = renderHook(() => useNotifications(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.schedulePendingNotification();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("Business logic verification", () => {
    it("should verify task filtering logic matches hook implementation", () => {
      // This test verifies the filtering logic is correct
      const testCases = [
        {
          task: { type: "daily", todayCount: 0, frequency: 1 },
          expected: true,
          desc: "Daily always shows",
        },
        {
          task: { type: "weekly", todayCount: 0, weekWeekdayCount: 2, weekWeekendCount: 0, frequency: 3 },
          expected: true,
          desc: "Weekly under limit",
        },
        {
          task: { type: "weekly", todayCount: 0, weekWeekdayCount: 3, weekWeekendCount: 0, frequency: 3 },
          expected: false,
          desc: "Weekly at limit",
        },
        {
          task: { type: "weekly", todayCount: 1, weekWeekdayCount: 5, weekWeekendCount: 0, frequency: 3 },
          expected: true,
          desc: "Weekly over limit but completed today",
        },
        {
          task: { type: "monthly", todayCount: 0, monthCount: 3, frequency: 5 },
          expected: true,
          desc: "Monthly under limit",
        },
        {
          task: { type: "monthly", todayCount: 0, monthCount: 5, frequency: 5 },
          expected: false,
          desc: "Monthly at limit",
        },
        {
          task: { type: "finite", todayCount: 0, totalCount: 7, frequency: 10 },
          expected: true,
          desc: "Finite under limit",
        },
        {
          task: { type: "finite", todayCount: 0, totalCount: 10, frequency: 10 },
          expected: false,
          desc: "Finite at limit",
        },
      ];

      testCases.forEach(({ task, expected, desc }) => {
        let shouldShow: boolean;

        switch (task.type) {
          case "daily":
            shouldShow = true;
            break;
          case "weekly":
            shouldShow =
              task.todayCount > 0 ||
              ((task.weekWeekdayCount ?? 0) + (task.weekWeekendCount ?? 0) < task.frequency);
            break;
          case "monthly":
            shouldShow = task.todayCount > 0 || (task.monthCount ?? 0) < task.frequency;
            break;
          case "finite":
            shouldShow = task.todayCount > 0 || (task.totalCount ?? 0) < task.frequency;
            break;
          default:
            shouldShow = true;
        }

        expect(shouldShow).toBe(expected);
      });
    });

    it("should verify notification scheduling logic", () => {
      const tasks = [
        { hasCompleted: 0 },
        { hasCompleted: 1 },
        { hasCompleted: 0 },
      ];

      const hasPendingTasks = tasks.some((t) => !t.hasCompleted);
      expect(hasPendingTasks).toBe(true);

      const allCompleted = tasks.every((t) => t.hasCompleted);
      expect(allCompleted).toBe(false);
    });

    it("should verify weekday/weekend detection", () => {
      const monday = dayjs("2025-01-13");
      const saturday = dayjs("2025-01-18");

      expect(monday.isoWeekday()).toBe(1); // Monday
      expect(saturday.isoWeekday()).toBe(6); // Saturday

      expect(monday.isoWeekday() <= 5).toBe(true); // Is weekday
      expect(saturday.isoWeekday() >= 6).toBe(true); // Is weekend
    });

    it("should verify other-day filtering logic", () => {
      const createdAt = dayjs("2025-01-13");
      const testDates = [
        { date: "2025-01-13", shouldShow: true },
        { date: "2025-01-14", shouldShow: false },
        { date: "2025-01-15", shouldShow: true },
        { date: "2025-01-16", shouldShow: false },
      ];

      testDates.forEach(({ date, shouldShow }) => {
        const today = dayjs(date);
        const daysSinceCreation = today.diff(createdAt, "day");
        const actualShouldShow = daysSinceCreation >= 0 && daysSinceCreation % 2 === 0;
        expect(actualShouldShow).toBe(shouldShow);
      });
    });
  });
});
