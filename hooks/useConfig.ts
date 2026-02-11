import { DBContext } from "@/context/DBContext";
import { configurations } from "@/db/schema";
import { useCallback, useContext, useEffect, useState } from "react";
import * as Sentry from "@sentry/react-native";
import { sql } from "drizzle-orm";
export default function useConfig() {
  const [configs, setConfigs] = useState<IConfig[]>([]);
  const db = useContext(DBContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getConfigs = useCallback(async () => {
    if (!db || loading) return;

    setLoading(true);
    try {
      const configs = await db
        .select({
          id: configurations.id,
          key: configurations.key,
          value: configurations.value,
        })
        .from(configurations)
        .orderBy(configurations.key);

      setConfigs(configs);
    } catch (e: any) {
      setError(e);
      Sentry.captureException(e);
    } finally {
      setLoading(false);
    }
  }, [db, loading]);

  const saveConfig = useCallback(
    async (config: IConfig) => {
      if (!db) return;

      const isNew = !configs.find((c) => c.key === config.key);
      try {
        if (isNew) {
          await db.insert(configurations).values(config);
        } else {
          await db
            .update(configurations)
            .set({ value: config.value })
            .where(sql`${configurations.key} = ${config.key}`);
        }
        await getConfigs();
      } catch (e: any) {
        setError(error);
        Sentry.captureException(e);
      }
    },
    [db, configs],
  );

  useEffect(() => {
    if (!db) return;
    getConfigs();
  }, [db]);

  return {
    loading,
    error,
    configs,
    getConfigs,
    saveConfig,
  };
}
