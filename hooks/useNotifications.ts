import { useCallback, useContext, useEffect, useState } from "react";
import { DBContext } from "@/context/DBContext";
import { notifications } from "@/db/schema";
import * as Sentry from "@sentry/react-native";
import { sql } from "drizzle-orm";
import * as Notifications from "expo-notifications";
import useConfig from "./useConfig";
import { getNotificationCutoff } from "@/services/DateUtils";

const LastNotification = "lastNotification";

export default function useNotifications() {
  const db = useContext(DBContext);
  const { saveConfig, configs } = useConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [notificationList, setNotificationList] = useState<INotification[]>([]);

  const getNotifications = useCallback(async () => {
    if (!db || loading) return;

    setLoading(true);
    try {
      const nots = await db
        .select()
        .from(notifications)
        .orderBy(sql`${notifications.scheduledAt} DESC`)
        .limit(10);

      setNotificationList(nots);
    } catch (e: any) {
      setError(e.message);
      Sentry.captureException(e);
    } finally {
      setLoading(false);
    }
  }, [db, loading]);

  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  const schedulePendingNotification = useCallback(async () => {
    if (!db) return;

    try {
      let config = configs.find((c) => c.key === LastNotification);
      if (config?.value) {
        const allScheduled =
          await Notifications.getAllScheduledNotificationsAsync();
        const exists = allScheduled.find((n) => n.identifier === config!.value);
        if (exists) return;
      }

      const now = new Date();
      let date = getNotificationCutoff(now);

      // If past 23:00, schedule for tomorrow
      if (now >= date) {
        date.setDate(date.getDate() + 1);
        console.log("Past 23:00, scheduling notification for tomorrow");
      }

      const key = await Notifications.scheduleNotificationAsync({
        content: {
          title: "You still have Tasks to check",
          body: "There are still a few pending tasksl",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
      const notification: INotification = {
        scheduledAt: new Date(),
        status: "pending",
        key: key,
      };

      config = {
        key: LastNotification,
        value: key,
      };

      await db.insert(notifications).values(notification);
      await saveConfig(config);
    } catch (e: any) {
      console.error(e);
      setError(e);
      Sentry.captureException(e);
    }
  }, [db, configs, saveConfig]);

  const unscheduleDailyNotification = useCallback(async () => {
    if (!db) return;

    try {
      const config = configs.find((c) => c.key === LastNotification);
      if (!config) return;
      await db
        .update(notifications)
        .set({ status: "cancelled" })
        .where(sql`${notifications.key} = ${config.value}`);
      await Notifications.cancelScheduledNotificationAsync(config.key);
    } catch (e: any) {
      setError(e);
      Sentry.captureException(e);
    }
  }, [db]);

  return {
    loading,
    error,
    notifications: notificationList,
    getNotifications,
    schedulePendingNotification,
    unscheduleDailyNotification,
  };
}
