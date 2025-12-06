import { DBContext } from "@/context/DBContext";
import { completions, tasks } from "@/db/schema";
import { sql } from "drizzle-orm";
import { useCallback, useContext, useEffect, useState } from "react";


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
				hasCompleted: sql<number>`EXISTS (SELECT 1 FROM ${completions} WHERE ${completions.completedAt} >= ${today.getTime() / 1000} AND ${completions.taskId} = ${tasks}.${tasks.id})`.as('hasCompleted')
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
				hasCompleted: sql<number>`EXISTS (SELECT 1 FROM ${completions} WHERE ${completions.completedAt} >= ${start.getTime() / 1000} AND ${completions.completedAt} < ${end.getTime() / 1000} AND ${completions.taskId} = ${tasks}.${tasks.id})`.as('hasCompleted')
			}).from(tasks).where(sql`${tasks.createdAt} <= ${end.getTime() / 1000}`).orderBy(tasks.title)
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

	const getCompletionStats = useCallback(async (timeframe: 'day' | 'week' | 'month') => {
		if (!db || loading) return
		setLoading(true)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		// Determine start date based on timeframe
		const startDate = new Date()
		startDate.setHours(0, 0, 0, 0)

		if (timeframe === 'day') {
			startDate.setDate(today.getDate() - 30) // Last 30 days
		} else if (timeframe === 'week') {
			startDate.setMonth(today.getMonth() - 3) // Last 3 months (approx 12 weeks)
		} else if (timeframe === 'month') {
			startDate.setFullYear(today.getFullYear() - 1) // Last 1 year
		}

		try {
			let dateFormat = ''
			if (timeframe === 'day') dateFormat = '%Y-%m-%d'
			if (timeframe === 'week') dateFormat = '%Y-%W'
			if (timeframe === 'month') dateFormat = '%Y-%m'

			const res = await db
				.select({
					count: sql<number>`COUNT(${completions.id})`,
					date: sql<string>`strftime(${dateFormat}, ${completions.completedAt}, 'unixepoch', 'localtime')`.as('date')
				})
				.from(completions)
				.where(sql`${completions.completedAt} >= ${startDate.getTime() / 1000}`)
				.groupBy(sql`strftime(${dateFormat}, ${completions.completedAt}, 'unixepoch', 'localtime')`)
				.orderBy(sql`date`)

			return res
		} catch (e: any) {
			setError(e.message)
			console.error(e)
			return []
		} finally {
			setLoading(false)
		}
	}, [db])

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
		getTaskHistory,
		getCountByWeek,
		getCompletionStats
	}
}
