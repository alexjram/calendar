import { DBContext } from "@/context/DBContext";
import { tasks } from "@/db/schema";
import { useCallback, useContext, useEffect, useState } from "react";

export default function useCalendarBounds() {
  const db = useContext(DBContext);
  const [earliestDate, setEarliestDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getEarliestTaskCreationDate = useCallback(async () => {
    if (!db) return null;
    setLoading(true);
    try {
      const res = await db
        .select({ createdAt: tasks.createdAt })
        .from(tasks)
        .orderBy(tasks.createdAt)
        .limit(1);
      if (res.length === 0) {
        setEarliestDate(null);
        return null;
      }
      setEarliestDate(res[0].createdAt);
      return res[0].createdAt;
    } catch (e: any) {
      setError(e.message);
      console.error(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (!db || earliestDate) return;
    getEarliestTaskCreationDate();
  }, [db, earliestDate, getEarliestTaskCreationDate]);

  return {
    earliestDate,
    loading,
    error,
    getEarliestTaskCreationDate,
  };
}
