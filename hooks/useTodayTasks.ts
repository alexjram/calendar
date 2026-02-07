import { DBContext } from "@/context/DBContext";
import { completions, rewards, tasks } from "@/db/schema";
import { getStartAndEndTimestamps } from "@/services/DateUtils";
import { sql } from "drizzle-orm";
import { useCallback, useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import { useTaskEvents } from "./useTaskEvents";

export default function useTodayTasks() {
  const db = useContext(DBContext);
  const { emit } = useTaskEvents();
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
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks}.${tasks.id})`.as(
              "totalCount"
            ),
          todayCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks}.${tasks.id} AND ${completions.completedAt} >= ${todayStart} AND ${completions.completedAt} <= ${todayEnd})`.as(
              "todayCount"
            ),
          weekWeekdayCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks}.${tasks.id} AND ${completions.completedAt} >= ${weekStart} AND ${completions.completedAt} <= ${weekEnd} AND strftime('%w', datetime(${completions.completedAt}, 'unixepoch', 'localtime')) BETWEEN '1' AND '5')`.as(
              "weekWeekdayCount"
            ),
          weekWeekendCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks}.${tasks.id} AND ${completions.completedAt} >= ${weekStart} AND ${completions.completedAt} <= ${weekEnd} AND (strftime('%w', datetime(${completions.completedAt}, 'unixepoch', 'localtime')) = '0' OR strftime('%w', datetime(${completions.completedAt}, 'unixepoch', 'localtime')) = '6'))`.as(
              "weekWeekendCount"
            ),
          monthCount:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks}.${tasks.id} AND ${completions.completedAt} >= ${monthStart} AND ${completions.completedAt} <= ${monthEnd})`.as(
              "monthCount"
            ),
          hasCompleted:
            sql<number>`(SELECT COUNT(*) FROM ${completions} WHERE ${completions.taskId} = ${tasks}.${tasks.id} AND ${completions.completedAt} >= ${todayStart} AND ${completions.completedAt} <= ${todayEnd})`.as(
              "hasCompleted"
            ),
          rewardCount:
            sql<number>`(SELECT COUNT(*) FROM ${rewards} WHERE ${rewards.taskId} = ${tasks}.${tasks.id})`.as(
              "rewardCount"
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
                "day"
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
  }, [db, dbTasks.length, getTasks]);

  const addTask = useCallback(
    async (task: ITaskBase) => {
      if (!db) return;
      await db
        .insert(tasks)
        .values({ ...task, createdAt: new Date(), updatedAt: new Date() });
      await getTasks();
      emit("taskAdded");
    },
    [db, getTasks, emit]
  );

  const deleteTask = useCallback(
    async (id: number) => {
      if (!db) return;
      await Promise.all([
        db.delete(tasks).where(sql`${tasks.id} = ${id}`),
        db.delete(completions).where(sql`${completions.taskId} = ${id}`),
        db.delete(rewards).where(sql`${rewards.taskId} = ${id}`),
      ]);
      await getTasks();
      emit("taskDeleted");
    },
    [db, getTasks, emit]
  );

  const updateTask = useCallback(
    async (id: number, task: ITaskBase) => {
      if (!db) return;
      await db
        .update(tasks)
        .set({ ...task, updatedAt: new Date() })
        .where(sql`${tasks.id} = ${id}`);
      await getTasks();
      emit("taskUpdated");
    },
    [db, getTasks, emit]
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
      emit("taskCompleted");
    },
    [db, dbTasks, getTasks, emit]
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
            sql`${completions.taskId} = ${id} AND ${completions.completedAt} >= ${today.getTime() / 1000}`
          );
      }
      await getTasks();
      emit("taskUncompleted");
    },
    [db, dbTasks, getTasks, emit]
  );

  const markAsFullyCompleted = useCallback(
    async (id: number) => {
      if (!db) return;
      await db
        .update(tasks)
        .set({ completedAt: new Date() })
        .where(sql`${tasks.id} = ${id}`);
      await getTasks();
      emit("taskFullyCompleted");
    },
    [db, getTasks, emit]
  );

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
  };
}
