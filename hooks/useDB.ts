import { useContext, useState, useEffect, useCallback } from "react";
import { DBContext } from "@/context/DBContext";
import { tasks, completions } from "@/db/schema";
import { sql } from "drizzle-orm";


export default function useTasks() {
	const db = useContext(DBContext)
	const [dbTasks, setTasks] = useState<ITask[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const getTasks = useCallback(async () => {
		if (!db || loading) return
		setLoading(true)
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		try {
			const res = await db.select({
				id: tasks.id,
				title: tasks.title,
				createdAt: tasks.createdAt,
				updatedAt: tasks.updatedAt,
				hasCompleted: sql<boolean>`EXISTS (SELECT 1 FROM ${completions} WHERE ${completions.completedAt} >= ${today.getTime() / 1000} AND ${completions.taskId} = ${tasks}.${tasks.id})`.as('hasCompleted')
			}).from(tasks).orderBy(tasks.title)
			setTasks(res)

		} catch (e: any) {
			setError(e.message)
			console.error(e)
		} finally {
			setLoading(false)
		}
	}, [db])
	useEffect(() => {
		if (!db) return
		getTasks()
	}, [db])

	const getTaskHistory = useCallback(async (start: Date, end: Date) => {
		if (!db || loading) return
		setLoading(true)
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		let res: ITask[] = []
		try {
			res = await db.select({
				id: tasks.id,
				title: tasks.title,
				createdAt: tasks.createdAt,
				updatedAt: tasks.updatedAt,
				hasCompleted: sql<boolean>`EXISTS (SELECT 1 FROM ${completions} WHERE ${completions.completedAt} >= ${start.getTime() / 1000} AND ${completions.completedAt} < ${end.getTime() / 1000} AND ${completions.taskId} = ${tasks}.${tasks.id})`.as('hasCompleted')
			}).from(tasks).where(sql`${tasks.createdAt} < ${end.getTime() / 1000}`).orderBy(tasks.title)

		} catch (e: any) {
			setError(e.message)
			console.error(e)
		} finally {
			setLoading(false)
		}
		return res
	}, [db])

	const getCountByWeek = useCallback(async () => {
		if (!db || loading) return
		setLoading(true)
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const lastMonth = new Date()
		lastMonth.setMonth(today.getMonth() - 1)
		lastMonth.setHours(0, 0, 0, 0)
		lastMonth.setDate(1)
		try {
			const res = await db
				.select({
					count: sql<number>`COUNT(${completions.taskId})`,
					week: sql<string>`strftime('%Y-%W',(${completions.completedAt}))`.as('week'),
					id: tasks.id,
					title: tasks.title,
				})
				.from(tasks).leftJoin(completions, sql`${tasks.id} = ${completions.taskId}`)
				.where(sql`${completions.completedAt} >= ${(today.getTime()) / 1000 - (lastMonth.getTime() / 1000)}`)
				.groupBy(sql`${tasks.id}, strftime('%Y-%W', (${completions.completedAt}))`)
				.orderBy(sql`${tasks.createdAt}`)
			return res

		} catch (e: any) {
			setError(e.message)
			console.error(e)
		} finally {
			setLoading(false)
		}
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
		loading,
		error,
		addTask,
		deleteTask,
		updateTask,
		markAsCompleted,
		markAsUncompleted,
		getTaskHistory,
		getCountByWeek
	}
}
