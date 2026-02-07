import { DBContext } from "@/context/DBContext";
import { completions, tasks } from "@/db/schema";
import { getStartAndEndTimestamps } from "@/services/DateUtils";
import { sql } from "drizzle-orm";
import { useCallback, useContext, useState } from "react";
import dayjs from "dayjs";
import { useTaskEvent } from "./useTaskEvents";

interface IChartData {
  date: string;
  completed: number;
}

export default function useStats() {
  const db = useContext(DBContext);
  const [stats, setStats] = useState<IChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getCompletionStats = useCallback(
    async (timeframe: "day" | "week" | "month") => {
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
              "date"
            ),
          })
          .from(completions)
          .where(
            sql`${completions.completedAt} >= ${start} AND ${completions.completedAt} <= ${end}`
          )
          .groupBy(
            sql`strftime(${format}, ${completions.completedAt}, 'unixepoch', 'localtime')`
          );
        const fullResponse: IChartData[] = [];
        let startDate = dayjs(new Date(start * 1000));
        let endDate = dayjs(new Date(end * 1000));
        let date = startDate.clone();
        const resMap = new Map<string, IChartData>(res.map((r) => [r.date, r]));
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
        setStats(fullResponse);
        return fullResponse;
      } catch (e: any) {
        setError(e.message);
        console.error(e);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [db, loading]
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
            "week"
          ),
          id: tasks.id,
          title: tasks.title,
        })
        .from(tasks)
        .leftJoin(completions, sql`${tasks.id} = ${completions.taskId}`)
        .where(
          sql`${completions.completedAt} >= ${startSeconds} AND ${completions.completedAt} <= ${endSeconds}`
        )
        .groupBy(
          sql`${tasks.id}, strftime('%Y-%W', (${completions.completedAt}))`
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

  // Auto-refresh when tasks change
  useTaskEvent("taskCompleted", () => {});
  useTaskEvent("taskUncompleted", () => {});
  useTaskEvent("taskAdded", () => {});
  useTaskEvent("taskDeleted", () => {});
  useTaskEvent("taskUpdated", () => {});
  useTaskEvent("taskFullyCompleted", () => {});

  return {
    stats,
    loading,
    error,
    getCompletionStats,
    getCountByWeek,
  };
}
