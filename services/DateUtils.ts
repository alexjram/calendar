

export const getStartAndEndDates = (date: Date) => {
	const start = new Date(date.getTime())
	const end = new Date(date.getTime())
	start.setHours(0, 0, 0, 0)
	end.setHours(23, 59, 59, 999)
	return [start, end]
}

export const getStartAndEndTimestamps = (date: Date) => {
	const [start, end] = getStartAndEndDates(date)
	return [Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000)]
}

export const getWeekStartAndEnd = (date: Date) => {
	const d = new Date(date)
	const day = d.getDay()
	// Calculate Monday (day 1) of the week
	// For Sunday (day 0): go back 6 days
	// For Monday-Friday (day 1-5): go back (day - 1) days
	// For Saturday (day 6): go back 5 days
	const diff = day === 0 ? -6 : 1 - day
	const start = new Date(d)
	start.setDate(d.getDate() + diff)
	start.setHours(0, 0, 0, 0)
	const end = new Date(start)
	end.setDate(start.getDate() + 6)
	end.setHours(23, 59, 59, 999)
	return [start, end]
}

export const getWeekStartAndEndTimestamps = (date: Date) => {
	const [start, end] = getWeekStartAndEnd(date)
	return [Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000)]
}

export const getMonthStartAndEnd = (date: Date) => {
	const start = new Date(date.getFullYear(), date.getMonth(), 1)
	start.setHours(0, 0, 0, 0)
	const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
	end.setHours(23, 59, 59, 999)
	return [start, end]
}

export const getMonthStartAndEndTimestamps = (date: Date) => {
	const [start, end] = getMonthStartAndEnd(date)
	return [Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000)]
}

export const isWeekend = (date: Date) => {
	const day = date.getDay()
	return day === 0 || day === 6
}

