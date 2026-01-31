import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
  completedAt: integer({ mode: "timestamp" }),
  type: text("type")
    .$type<
      | "daily"
      | "weekly"
      | "monthly"
      | "other-day"
      | "weekdays"
      | "weekend"
      | "finite"
    >()
    .default("daily"), // it will be daily, weekly, monthly, every other day, day of the week
  reward: text("reward").default(""), // it will be a string saying what you won from completing
  hasReward: integer({ mode: "boolean" }).default(false), // if it has reward
  rewardWhen: text().notNull().default("never"), // reward will happen when, n times completed, finished
  maxRewards: integer().default(0), // how many times can the user reclaim the reward
  frequency: integer().default(1), // amount of times the task should be done on the time period
});
export const completions = sqliteTable("completions", {
  id: integer("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id),
  completedAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});
export const rewards = sqliteTable("rewards", {
  id: integer("id").primaryKey(),
  rewardNumber: integer().notNull(),
  rewardedAt: integer({ mode: "timestamp" }),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id),
});
export const taskRelations = relations(tasks, ({ many }) => ({
  completions: many(completions),
}));

export const completionRelations = relations(completions, ({ one }) => ({
  task: one(tasks, {
    fields: [completions.taskId],
    references: [tasks.id],
  }),
}));

export const rewardRelations = relations(rewards, ({ one }) => ({
  tasks: one(tasks, {
    fields: [rewards.taskId],
    references: [tasks.id],
  }),
}));
