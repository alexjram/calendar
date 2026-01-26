import { DBContext } from "@/context/DBContext";
import { completions, tasks } from "@/db/schema";
import { getStartAndEndDates, getStartAndEndTimestamps } from "@/services/DateUtils";
import { sql } from "drizzle-orm";
import { useCallback, useContext, useEffect, useState } from "react";
import dayjs from "dayjs";


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
	}, [db, dbTasks])

	const markAsUncompleted = useCallback(async (id: number) => {
		if (!db) return
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const completedTask = dbTasks.find(t => t.id === id)
		if (completedTask) {
			await db.delete(completions).where(sql`${completions.taskId} = ${id} AND ${completions.completedAt} >= ${today.getTime() / 1000}`)
		}
		await getTasks()
	}, [db, dbTasks])

	const getCompletionStats = useCallback(async (timeframe: 'day' | 'week' | 'month'): Promise<{ date: string, completed: number }[] | null> => {
		if (!db || loading) return null
		setLoading(true)
		try {
			const today = new Date()
			const [_, end] = getStartAndEndTimestamps(today)
			let start: number
			let format: string
			let jsFormat: string
			let tmp: Date
			switch (timeframe) {
				case 'day':
					tmp = new Date()
					tmp.setDate(tmp.getDate() - 30)
					start = getStartAndEndTimestamps(tmp)[0]
					format = '%m-%d'
					jsFormat = 'MM-DD'
					break
				case 'week':
					tmp = new Date()
					tmp.setDate(1)
					tmp.setMonth(tmp.getMonth() - 3)
					start = getStartAndEndTimestamps(tmp)[0]
					format = '%Y-%W'
					jsFormat = 'YYYY-WW'
					break
				case 'month':
					tmp = new Date()
					tmp.setDate(1)
					tmp.setFullYear(tmp.getFullYear() - 1)
					start = getStartAndEndTimestamps(tmp)[0]
					format = '%Y-%m'
					jsFormat = 'YYYY-MM'
					break
			}
			const res = await db
				.select({
					completed: sql<number>`COUNT(${completions.id})`.as('completed'),
					date: sql<string>`strftime(${format}, ${completions.completedAt}, 'unixepoch', 'localtime')`.as('date')
				})
				.from(completions)
				.where(sql`${completions.completedAt} >= ${start} AND ${completions.completedAt} <= ${end}`)
				.groupBy(sql`strftime(${format}, ${completions.completedAt}, 'unixepoch', 'localtime')`)
			const fullResponse: { date: string, completed: number }[] = []
			let startDate = dayjs(new Date(start * 1000))
			let endDate = dayjs(new Date(end * 1000))
			let date = startDate.clone()
			const resMap = new Map<string, { date: string, completed: number }>(res.map(r => [r.date, r]))
			while (date.isBefore(endDate) || date.isSame(endDate)) {
				if (resMap.has(date.format(jsFormat))) {
					fullResponse.push({ date: date.format(jsFormat), completed: resMap.get(date.format(jsFormat))?.completed ?? 0 })
				} else {
					fullResponse.push({ date: date.format(jsFormat), completed: 0 })
				}
				date = date.add(1, timeframe)
			}
			return fullResponse
		} catch (e: any) {
			setError(e.message)
			console.error(e)
			return []
		} finally {
			setLoading(false)
		}
	}, [db])

	const getEarliestTaskCreationDate = useCallback(async (): Promise<Date | null> => {
		if (!db) return null
		const res = await db.select({ createdAt: tasks.createdAt }).from(tasks).orderBy(tasks.createdAt).limit(1)
		if (res.length === 0) return null
		return res[0].createdAt
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
		getCompletionStats,
		getEarliestTaskCreationDate
	}
}
