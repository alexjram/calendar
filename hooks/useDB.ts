import { useContext, useState, useEffect, useCallback } from "react";
import { DBContext } from "@/context/DBContext";
import { tasks, completions } from "@/db/schema";
import { sql } from "drizzle-orm";

interface ITask {
	id: number
	title: string
	createdAt: Date
	updatedAt: Date
	hasCompleted: boolean
}

export default function useTasks() {
	const db = useContext(DBContext)
	const [dbTasks, setTasks] = useState<ITask[]>([])

	const getTasks = useCallback(async () => {
		if (!db) return
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		console.log('Today:', today.toISOString(), 'Timestamp:', today.getTime())

		const allCompletions = await db.select().from(completions)
		console.log('All completions:', allCompletions)

		const res = await db.select({
			id: tasks.id,
			title: tasks.title,
			createdAt: tasks.createdAt,
			updatedAt: tasks.updatedAt,
			hasCompleted: sql<boolean>`EXISTS (SELECT 1 FROM ${completions} WHERE ${completions.completedAt} >= ${today.getTime() / 1000} AND ${completions.taskId} = ${tasks}.${tasks.id})`.as('hasCompleted')
		}).from(tasks).orderBy(tasks.title)
		console.log('Tasks result:', res)
		setTasks(res)
	}, [db])
	useEffect(() => {
		if (!db) return
		getTasks()
	}, [db])


	const addTask = useCallback(async (title: string) => {
		if (!db) return
		await db.insert(tasks).values({ title, createdAt: new Date(), updatedAt: new Date() })
		getTasks()
	}, [db])
	const deleteTask = useCallback(async (id: number) => {
		if (!db) return
		await db.delete(tasks).where(sql`${tasks.id} = ${id}`)
		getTasks()
	}, [db])
	const updateTask = useCallback(async (id: number, title: string) => {
		if (!db) return
		await db.update(tasks).set({ title, updatedAt: new Date() }).where(sql`${tasks.id} = ${id}`)
		getTasks()
	}, [db])

	const markAsCompleted = useCallback(async (id: number) => {
		if (!db) return
		const completedTask = dbTasks.find(t => t.id === id)
		if (completedTask?.hasCompleted) {
			return
		} else {
			await db.insert(completions).values({ taskId: id, completedAt: new Date(), updatedAt: new Date() })
		}
		await getTasks()
		const res = await db.select().from(completions).where(sql`${completions.taskId} = ${id}`).orderBy(completions.completedAt)
		console.log(res)
	}, [db])

	const markAsUncompleted = useCallback(async (id: number) => {
		if (!db) return
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const completedTask = dbTasks.find(t => t.id === id)
		if (completedTask) {
			await db.delete(completions).where(sql`${completions.taskId} = ${id} AND ${completions.completedAt} >= ${today.getTime() / 1000}`)
		}
		await getTasks()
	}, [db])

	return {
		tasks: dbTasks,
		addTask,
		deleteTask,
		updateTask,
		markAsCompleted,
		markAsUncompleted,
	}
}
