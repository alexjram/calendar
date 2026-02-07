import { DBContext } from "@/context/DBContext";
import { completions, rewards, tasks } from "@/db/schema";
import { getStartAndEndTimestamps } from "@/services/DateUtils";
import { sql } from "drizzle-orm";
import { useCallback, useContext, useState } from "react";
import { useTaskEvent } from "./useTaskEvents";

export default function useTaskHistory() {
  const db = useContext(DBContext);
  const [history, setHistory] = useState<ITask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
                "hasCompleted"
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
                "rewardCount"
              ),
          })
          .from(tasks)
          .where(sql`${tasks.createdAt} <= ${end.getTime() / 1000}`)
          .orderBy(tasks.title);
        setHistory(res);
      } catch (e: any) {
        setError(e.message);
        console.error(e);
      } finally {
        setLoading(false);
      }
      return res;
    },
    [db, loading]
  );

  // Auto-refresh when tasks change
  useTaskEvent("taskCompleted", () => {
    // History will refresh next time getTaskHistory is called
    // Or we could trigger a refresh if we stored the current date range
  });
  useTaskEvent("taskUncompleted", () => {});
  useTaskEvent("taskAdded", () => {});
  useTaskEvent("taskDeleted", () => {});
  useTaskEvent("taskUpdated", () => {});
  useTaskEvent("taskFullyCompleted", () => {});

  return {
    history,
    loading,
    error,
    getTaskHistory,
  };
}
