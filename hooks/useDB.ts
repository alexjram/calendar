import { DBContext } from "@/context/DBContext";
import { completions, tasks } from "@/db/schema";
import { getStartAndEndDates, getStartAndEndTimestamps } from "@/services/DateUtils";
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
		const [startSeconds] = getStartAndEndTimestamps(new Date())
		try {
			const res = await db.select({
				id: tasks.id,
				title: tasks.title,
				createdAt: tasks.createdAt,
				updatedAt: tasks.updatedAt,
				hasCompleted: sql<number>`EXISTS (SELECT 1 FROM ${completions} WHERE ${completions.completedAt} >= ${startSeconds} AND ${completions.taskId} = ${tasks}.${tasks.id})`.as('hasCompleted')
			}).from(tasks).orderBy(tasks.title)
			setTasks(res)
			console.log("Fetched tasks:", res)
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
		const [startSeconds] = getStartAndEndTimestamps(start)
		const [_, endSeconds] = getStartAndEndTimestamps(end)
		let res: ITask[] = []
		try {
			res = await db.select({
				id: tasks.id,
				title: tasks.title,
				createdAt: tasks.createdAt,
				updatedAt: tasks.updatedAt,
				hasCompleted: sql<number>`EXISTS (SELECT 1 FROM ${completions} WHERE ${completions.completedAt} >= ${startSeconds} AND ${completions.completedAt} < ${endSeconds} AND ${completions.taskId} = ${tasks}.${tasks.id})`.as('hasCompleted')
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
		const lastMonth = new Date()
		lastMonth.setMonth(today.getMonth() - 1)
		lastMonth.setDate(1)
		const [startSeconds] = getStartAndEndTimestamps(lastMonth)
		const [_, endSeconds] = getStartAndEndTimestamps(today)
		try {
			const res = await db
				.select({
					count: sql<number>`COUNT(${completions.taskId})`,
					week: sql<string>`strftime('%Y-%W',(${completions.completedAt}))`.as('week'),
					id: tasks.id,
					title: tasks.title,
				})
				.from(tasks).leftJoin(completions, sql`${tasks.id} = ${completions.taskId}`)
				.where(sql`${completions.completedAt} >= ${startSeconds} AND ${completions.completedAt} <= ${endSeconds}`)
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

		const [startDate] = getStartAndEndDates(today)

		if (timeframe === 'day') {
			startDate.setDate(today.getDate() - 30)
		} else if (timeframe === 'week') {
			startDate.setMonth(today.getMonth() - 3)
		} else if (timeframe === 'month') {
			startDate.setFullYear(today.getFullYear() - 1)
		}

		try {
			let dateFormat = ''
			let dateIncrementDays = 1
			if (timeframe === 'day') {
				dateFormat = '%Y-%m-%d'
				dateIncrementDays = 1
			} else if (timeframe === 'week') {
				dateFormat = '%Y-%W'
				dateIncrementDays = 7
			} else if (timeframe === 'month') {
				dateFormat = '%Y-%m'
				dateIncrementDays = 30
			}

			const dates: string[] = []
			const current = new Date(startDate)
			const end = new Date(today)
			while (current <= end) {
				dates.push(current.toISOString().split('T')[0])
				current.setDate(current.getDate() + dateIncrementDays)
			}

			if (dates.length === 0) return []

			const dateSeriesCTE = dates.map(d => `SELECT '${d}' AS date`).join(' UNION ALL ')
			const dateSeriesQuery = `WITH dates(date) AS (${dateSeriesCTE}) SELECT * FROM dates`

			const res = await db
				.select({
					count: sql<number>`COALESCE(COUNT(${completions.id}), 0)`,
					date: sql<string>`d.date`.as('date')
				})
				.from(sql`(${sql.raw(dateSeriesQuery)}) AS d`)
				.leftJoin(completions, sql`strftime(${dateFormat}, ${completions.completedAt}, 'unixepoch', 'localtime') = d.date`)
				.groupBy(sql`d.date`)
				.orderBy(sql`d.date`)

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
