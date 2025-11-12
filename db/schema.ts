import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';

export const tasks = sqliteTable('tasks', {
	id: integer('id').primaryKey(),
	title: text('title').notNull(),
	createdAt: integer({ mode: 'timestamp' }).notNull(),
	updatedAt: integer({ mode: 'timestamp' }).notNull()
});
export const completions = sqliteTable('completions', {
	id: integer('id').primaryKey(),
	taskId: integer('task_id').notNull().references(() => tasks.id),
	completedAt: integer({ mode: 'timestamp' }).notNull(),
	updatedAt: integer({ mode: 'timestamp' }).notNull()
});
export const taskRelations = relations(tasks, ({ many }) => ({
	completions: many(completions)
}));

export const completionRelations = relations(completions, ({ one }) => ({
	task: one(tasks, {
		fields: [completions.taskId],
		references: [tasks.id]
	})
}))

