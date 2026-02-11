import { DBContext } from "@/context/DBContext";
import { rewards, tasks } from "@/db/schema";
import * as Sentry from "@sentry/react-native";
import { sql } from "drizzle-orm";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTaskEvent, useTaskEvents } from "./useTaskEvents";

export interface IRewardItem {
  id: number;
  taskName: string;
  reward: string | null;
  rewardedAt: Date;
  redeemedAt: Date | null;
}

export default function useRewards() {
  const db = useContext(DBContext);
  const { emit } = useTaskEvents();
  const [rewardsList, setRewardsList] = useState<IRewardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getRewards = useCallback(async () => {
    if (!db || loading) return;
    setLoading(true);
    try {
      const rewardList = await db
        .select({
          id: rewards.id,
          taskName: tasks.title,
          reward: tasks.reward,
          rewardedAt: rewards.rewardedAt,
          redeemedAt: rewards.redeemedAt,
        })
        .from(rewards)
        .innerJoin(tasks, sql`${rewards.taskId} = ${tasks.id}`)
        .orderBy(sql`${rewards.rewardedAt} DESC`);
      setRewardsList(rewardList as IRewardItem[]);
      return rewardList as IRewardItem[];
    } catch (e: any) {
      setError(e.message);
      Sentry.captureException(e);
    } finally {
      setLoading(false);
    }
  }, [db, loading]);

  useEffect(() => {
    if (!db || loading) return;

    getRewards().then((r) => {
      if (r) setRewardsList(r);
    });
  }, [db, loading]);

  const saveAward = useCallback(
    async (award: IAward) => {
      if (!db) return;
      try {
        await db.insert(rewards).values({ ...award, rewardedAt: new Date() });
        emit("rewardAdded");
        await getRewards();
      } catch (e: any) {
        setError(e.message);
        Sentry.captureException(e);
      }
    },
    [db, getRewards, emit],
  );

  const removeLastAward = useCallback(
    async (taskId: number) => {
      if (!db) return;
      try {
        await db
          .delete(rewards)
          .where(
            sql`${rewards.id} = (SELECT MAX(${rewards.id}) FROM ${rewards} WHERE ${rewards.taskId} = ${taskId})`,
          );
        emit("rewardRemoved");
        await getRewards();
      } catch (e: any) {
        setError(e.message);
        Sentry.captureException(e);
      }
    },
    [db, getRewards, emit],
  );

  const redeemReward = useCallback(
    async (id: number) => {
      if (!db) return;
      try {
        await db
          .update(rewards)
          .set({ redeemedAt: new Date() })
          .where(sql`${rewards.id} = ${id}`);
        emit("rewardUpdated");
        await getRewards();
      } catch (e: any) {
        setError(e.message);
        Sentry.captureException(e);
      }
    },
    [db, getRewards, emit],
  );

  // Auto-refresh when rewards change from other hooks
  useTaskEvent("rewardAdded", () => {
    getRewards();
  });
  useTaskEvent("rewardRemoved", () => {
    getRewards();
  });
  useTaskEvent("rewardUpdated", () => {
    getRewards();
  });

  return {
    rewards: rewardsList,
    loading,
    error,
    getRewards,
    saveAward,
    removeLastAward,
    redeemReward,
  };
}
