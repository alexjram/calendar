

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
