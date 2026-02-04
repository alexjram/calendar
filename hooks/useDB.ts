import { DBContext } from "@/context/DBContext";
import { completions, rewards, tasks } from "@/db/schema";
import { getStartAndEndTimestamps } from "@/services/DateUtils";
import { sql } from "drizzle-orm";
import { useCallback, useContext, useEffect, useState } from "react";
import dayjs from "dayjs";

export default function useTasks() {
  const db = useContext(DBContext);
  const [dbTasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getTasks = useCallback(async () => {
    if (!db || loading) return;
    setLoading(true);
    const today = dayjs();
    const todayDate = today.toDate();
    const [todayStart, todayEnd] = getStartAndEndTimestamps(todayDate);
    const weekStart = dayjs(today).startOf("isoWeek").unix();
    const weekEnd = dayjs(today).endOf("isoWeek").unix();
    const monthStart = dayjs(today).startOf("month").unix();
    const monthEnd = dayjs(today).endOf("month").unix();
    const todayIsWeekend = today.isoWeekday() >= 6;
    const todayIsWeekday = !todayIsWeekend;
    try {
      const allTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          hasReward: tasks.hasReward,
          reward: tasks.reward,
          rewardWhen: tasks.rewardWhen,
          type: tasks.type,
          frequency: tasks.frequency,
          completedAt: tasks.completedAt,
          maxRewards: tasks.maxRewards,
          totalCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks.id})`.as(
              "totalCount",
            ),
          todayCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks.id} AND ${completions.completedAt} >= ${todayStart} AND ${completions.completedAt} <= ${todayEnd})`.as(
              "todayCount",
            ),
          weekWeekdayCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks.id} AND ${completions.completedAt} >= ${weekStart} AND ${completions.completedAt} <= ${weekEnd} AND strftime('%w', datetime(${completions.completedAt}, 'unixepoch', 'localtime')) BETWEEN '1' AND '5')`.as(
              "weekWeekdayCount",
            ),
          weekWeekendCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks.id} AND ${completions.completedAt} >= ${weekStart} AND ${completions.completedAt} <= ${weekEnd} AND (strftime('%w', datetime(${completions.completedAt}, 'unixepoch', 'localtime')) = '0' OR strftime('%w', datetime(${completions.completedAt}, 'unixepoch', 'localtime')) = '6'))`.as(
              "weekWeekendCount",
            ),
          monthCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks.id} AND ${completions.completedAt} >= ${monthStart} AND ${completions.completedAt} <= ${monthEnd})`.as(
              "monthCount",
            ),
          hasCompleted:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks.id} AND ${completions.completedAt} >= ${todayStart} AND ${completions.completedAt} <= ${todayEnd})`.as(
              "hasCompleted",
            ),
          rewardCount:
            sql<number>`(SELECT COUNT(*) FROM ${rewards} WHERE ${rewards.taskId} = ${tasks.id})`.as(
              "rewardCount",
            ),
        })
        .from(tasks)
        .where(sql`${tasks.completedAt} IS NULL`)
        .orderBy(tasks.title);
      const filteredTasks = allTasks
        .filter((task) => {
          const completedToday = task.todayCount > 0;
          switch (task.type) {
            case "daily":
              return true;
            case "weekly":
              return (
                completedToday ||
                (task.weekWeekdayCount ?? 0) + (task.weekWeekendCount ?? 0) <
                  (task.frequency ?? 1)
              );
            case "monthly":
              return completedToday || task.monthCount < (task.frequency ?? 1);
            case "weekdays":
              return (
                todayIsWeekday &&
                (completedToday ||
                  (task.weekWeekdayCount ?? 0) < (task.frequency ?? 1))
              );
            case "weekend":
              return (
                todayIsWeekend &&
                (completedToday ||
                  (task.weekWeekendCount ?? 0) < (task.frequency ?? 1))
              );
            case "other-day":
              const daysSinceCreation = today.diff(
                dayjs(task.createdAt),
                "day",
              );
              const shouldShowOnDay =
                daysSinceCreation >= 0 && daysSinceCreation % 2 === 0;
              return shouldShowOnDay;
            case "finite":
              return (
                completedToday || (task.totalCount ?? 0) < (task.frequency ?? 1)
              );
            default:
              return true;
          }
        })
        .map((task) => ({
          ...task,
          hasCompleted: task.todayCount > 0 ? 1 : 0,
        }));
      setTasks(filteredTasks);
    } catch (e: any) {
      setError(e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [db, loading]);

  useEffect(() => {
    if (!db || dbTasks.length > 0) return;
    getTasks();
  }, [db, dbTasks.length]);

  const getTaskHistory = useCallback(
    async (start: Date, end: Date) => {
      if (!db || loading) return;
      setLoading(true);
      const [startSeconds] = getStartAndEndTimestamps(start);
      const [_, endSeconds] = getStartAndEndTimestamps(end);
      let res: ITask[] = [];
      try {
        res = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            createdAt: tasks.createdAt,
            updatedAt: tasks.updatedAt,
            hasCompleted:
              sql<number>`EXISTS (SELECT 1 FROM ${completions} WHERE ${completions.completedAt} >= ${startSeconds} AND ${completions.completedAt} < ${endSeconds} AND ${completions.taskId} = ${tasks}.${tasks.id})`.as(
                "hasCompleted",
              ),
            hasReward: tasks.hasReward,
            reward: tasks.reward,
            rewardWhen: tasks.rewardWhen,
            type: tasks.type,
            frequency: tasks.frequency,
            completedAt: tasks.completedAt,
            maxRewards: tasks.maxRewards,
            totalCount: sql<number>`0`.as("totalCount"),
            todayCount: sql<number>`0`.as("todayCount"),
            weekWeekdayCount: sql<number>`0`.as("weekWeekdayCount"),
            weekWeekendCount: sql<number>`0`.as("weekWeekendCount"),
            monthCount: sql<number>`0`.as("monthCount"),
            rewardCount:
              sql<number>`(SELECT COUNT(*) FROM ${rewards} WHERE ${rewards.rewardedAt} BETWEEN ${startSeconds} AND ${endSeconds})`.as(
                "rewardCount",
              ),
          })
          .from(tasks)
          .where(sql`${tasks.createdAt} <= ${end.getTime() / 1000}`)
          .orderBy(tasks.title);
      } catch (e: any) {
        setError(e.message);
        console.error(e);
      } finally {
        setLoading(false);
      }
      return res;
    },
    [db, loading],
  );

  const getCountByWeek = useCallback(async () => {
    if (!db || loading) return;
    setLoading(true);
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    lastMonth.setDate(1);
    const [startSeconds] = getStartAndEndTimestamps(lastMonth);
    const [_, endSeconds] = getStartAndEndTimestamps(today);
    try {
      const res = await db
        .select({
          count: sql<number>`COUNT(${completions.taskId})`,
          week: sql<string>`strftime('%Y-%W',(${completions.completedAt}))`.as(
            "week",
          ),
          id: tasks.id,
          title: tasks.title,
        })
        .from(tasks)
        .leftJoin(completions, sql`${tasks.id} = ${completions.taskId}`)
        .where(
          sql`${completions.completedAt} >= ${startSeconds} AND ${completions.completedAt} <= ${endSeconds}`,
        )
        .groupBy(
          sql`${tasks.id}, strftime('%Y-%W', (${completions.completedAt}))`,
        )
        .orderBy(sql`${tasks.createdAt}`);
      return res;
    } catch (e: any) {
      setError(e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [db, loading]);

  const addTask = useCallback(
    async (task: ITaskBase) => {
      if (!db) return;
      await db
        .insert(tasks)
        .values({ ...task, createdAt: new Date(), updatedAt: new Date() });
      await getTasks();
    },
    [db, getTasks],
  );

  const deleteTask = useCallback(
    async (id: number) => {
      if (!db) return;
      await db.delete(tasks).where(sql`${tasks.id} = ${id}`);
      await getTasks();
    },
    [db, getTasks],
  );

  const updateTask = useCallback(
    async (id: number, task: ITaskBase) => {
      if (!db) return;
      await db
        .update(tasks)
        .set({ ...task, updatedAt: new Date() })
        .where(sql`${tasks.id} = ${id}`);
      await getTasks();
    },
    [db, getTasks],
  );

  const markAsCompleted = useCallback(
    async (id: number) => {
      if (!db) return;
      const completedTask = dbTasks.find((t) => t.id === id);
      if (completedTask?.hasCompleted) {
        return;
      } else {
        await db.insert(completions).values({
          taskId: id,
          completedAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await getTasks();
    },
    [db, dbTasks, getTasks],
  );

  const markAsUncompleted = useCallback(
    async (id: number) => {
      if (!db) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedTask = dbTasks.find((t) => t.id === id);
      if (completedTask) {
        await db
          .delete(completions)
          .where(
            sql`${completions.taskId} = ${id} AND ${completions.completedAt} >= ${today.getTime() / 1000}`,
          );
      }
      await getTasks();
    },
    [db, dbTasks, getTasks],
  );

  const markAsFullyCompleted = useCallback(
    async (id: number) => {
      if (!db) return;

      await db
        .update(tasks)
        .set({ completedAt: new Date() })
        .where(sql`${tasks.id} = ${id}`);

      await getTasks();
    },
    [db, getTasks],
  );
  const saveAward = useCallback(
    async (award: IAward) => {
      if (!db) return;

      await db.insert(rewards).values({ ...award, rewardedAt: new Date() });
      await getTasks();
    },
    [db],
  );
  const removeLastAward = useCallback(
    async (taskId: number) => {
      if (!db) return;

      await db
        .delete(rewards)
        .where(
          sql`${rewards.id} = (SELECT MAX(${rewards.id}) FROM ${rewards} WHERE ${rewards.taskId} = ${taskId})`,
        );
      await getTasks();
    },
    [db, getTasks],
  );

  const getCompletionStats = useCallback(
    async (
      timeframe: "day" | "week" | "month",
    ): Promise<{ date: string; completed: number }[] | null> => {
      if (!db || loading) return null;
      setLoading(true);
      try {
        const today = new Date();
        const [_, end] = getStartAndEndTimestamps(today);
        let start: number;
        let format: string;
        let jsFormat: string;
        let tmp: Date;
        switch (timeframe) {
          case "day":
            tmp = new Date();
            tmp.setDate(tmp.getDate() - 30);
            start = getStartAndEndTimestamps(tmp)[0];
            format = "%m-%d";
            jsFormat = "MM-DD";
            break;
          case "week":
            tmp = new Date();
            tmp.setDate(1);
            tmp.setMonth(tmp.getMonth() - 3);
            start = getStartAndEndTimestamps(tmp)[0];
            format = "%Y-%W";
            jsFormat = "YYYY-WW";
            break;
          case "month":
            tmp = new Date();
            tmp.setDate(1);
            tmp.setFullYear(tmp.getFullYear() - 1);
            start = getStartAndEndTimestamps(tmp)[0];
            format = "%Y-%m";
            jsFormat = "YYYY-MM";
            break;
        }
        const res = await db
          .select({
            completed: sql<number>`COUNT(${completions.id})`.as("completed"),
            date: sql<string>`strftime(${format}, ${completions.completedAt}, 'unixepoch', 'localtime')`.as(
              "date",
            ),
          })
          .from(completions)
          .where(
            sql`${completions.completedAt} >= ${start} AND ${completions.completedAt} <= ${end}`,
          )
          .groupBy(
            sql`strftime(${format}, ${completions.completedAt}, 'unixepoch', 'localtime')`,
          );
        const fullResponse: { date: string; completed: number }[] = [];
        let startDate = dayjs(new Date(start * 1000));
        let endDate = dayjs(new Date(end * 1000));
        let date = startDate.clone();
        const resMap = new Map<string, { date: string; completed: number }>(
          res.map((r) => [r.date, r]),
        );
        while (date.isBefore(endDate) || date.isSame(endDate)) {
          if (resMap.has(date.format(jsFormat))) {
            fullResponse.push({
              date: date.format(jsFormat),
              completed: resMap.get(date.format(jsFormat))?.completed ?? 0,
            });
          } else {
            fullResponse.push({ date: date.format(jsFormat), completed: 0 });
          }
          date = date.add(1, timeframe);
        }
        return fullResponse;
      } catch (e: any) {
        setError(e.message);
        console.error(e);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [db, loading],
  );

  const getEarliestTaskCreationDate =
    useCallback(async (): Promise<Date | null> => {
      if (!db) return null;
      const res = await db
        .select({ createdAt: tasks.createdAt })
        .from(tasks)
        .orderBy(tasks.createdAt)
        .limit(1);
      if (res.length === 0) return null;
      return res[0].createdAt;
    }, [db]);

  return {
    tasks: dbTasks,
    loading,
    error,
    getTasks,
    addTask,
    deleteTask,
    updateTask,
    markAsCompleted,
    markAsUncompleted,
    markAsFullyCompleted,
    getTaskHistory,
    getCountByWeek,
    getCompletionStats,
    getEarliestTaskCreationDate,
    saveAward,
    removeLastAward,
  };
}
