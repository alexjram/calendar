import StyledText from "@/components/StyledText"
import { PRIMARY, WHITE } from "@/constants/Colors"
import useTasks from "@/hooks/useDB"
import { HappyMonkey_400Regular } from "@expo-google-fonts/happy-monkey"
import { useFont } from "@shopify/react-native-skia"
import { Dispatch, useEffect, useState } from "react"
import { ImageBackground, StyleSheet, TouchableOpacity, View } from "react-native"
import { CartesianChart, Line } from "victory-native"

interface ICountByWeek extends Record<string, unknown> {
	count: number
	week: string
	id: number
	title: string
}

interface IChartData extends Record<string, unknown> {
	date: string
	count: number
}

export default function Index() {
	const [open, setOpen] = useState(false)
	const [task, setTask] = useState<ITask | null>(null)
	const { tasks, loading, error, getCountByWeek, getCompletionStats } = useTasks()
	const [countByWeek, setCountByWeek] = useState<ICountByWeek[]>([])
	const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day')
	const [chartData, setChartData] = useState<IChartData[]>([])
	const font = useFont(HappyMonkey_400Regular, 12)

	const handleSelect: Dispatch<any> = (item: string) => {
		if (!tasks) return
		let selectedTask = tasks.find(t => t.id === Number(item))
		if (!selectedTask) return
		setTask(selectedTask)
	}

	useEffect(() => {
		getCompletionStats(timeframe).then(data => {
			if (data) {
				setChartData(data as IChartData[])
			}
		})
	}, [timeframe, getCompletionStats])

	useEffect(() => {
		if (!task) return
		getCountByWeek().then(counts => {
			if (counts) {
				setCountByWeek(counts)
			}
		})
	}, [task])

	if ((loading && !task && chartData.length === 0) || !font) return <StyledText>Loading...</StyledText>
	if (error && !task) return <StyledText>Error: {error?.toString() || 'Unknown error'}</StyledText>

	return (
		<ImageBackground source={require('@/assets/images/bg.jpg')} style={{ flex: 1 }}>
			<View style={styles.container}>
				<StyledText style={styles.title}>Stats</StyledText>

				<View style={styles.timeframeContainer}>
					{(['day', 'week', 'month'] as const).map((t) => (
						<TouchableOpacity
							key={t}
							style={[styles.timeframeButton, timeframe === t && styles.timeframeButtonActive]}
							onPress={() => setTimeframe(t)}
						>
							<StyledText style={[styles.timeframeText, timeframe === t && styles.timeframeTextActive]}>
								{t.charAt(0).toUpperCase() + t.slice(1)}
							</StyledText>
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.chartContainer}>
					{chartData.length > 0 ? (
						<View style={{ height: 300, width: 500, maxWidth: '100%' }}>
							<CartesianChart
								data={chartData}
								xKey="date"
								yKeys={["count"]}
								axisOptions={{
									font,
									tickCount: 5,
									formatXLabel: (xValue: string | number | Date | undefined) => {
										if (!xValue) return ''
										if (timeframe === 'week') {
											const label = String(xValue)
											const [, week] = label.split('-')
											return week ? `W${week}` : label
										}

										const date = new Date(xValue)
										if (!Number.isNaN(date.getTime()) && timeframe === 'day') {
											return `${date.getMonth() + 1}/${date.getDate()}`
										}

										return String(xValue)
									}
								}}
							>
								{({ points }) => (
									<Line points={points.count} color={PRIMARY} strokeWidth={3} />
								)}
							</CartesianChart>
						</View>
					) : (
						<StyledText>No data available for this period</StyledText>
					)}
				</View>
			</View>
		</ImageBackground>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		paddingTop: 80,
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	title: {
		fontSize: 32,
		textAlign: 'center',
		marginBottom: 20
	},
	subtitle: {
		fontSize: 20,
		marginTop: 20,
		marginBottom: 10
	},
	timeframeContainer: {
		flexDirection: 'row',
		marginBottom: 20,
		backgroundColor: WHITE,
		borderRadius: 8,
		padding: 4
	},
	timeframeButton: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 6,
	},
	timeframeButtonActive: {
		backgroundColor: PRIMARY,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.20,
		shadowRadius: 1.41,
		elevation: 2,
	},
	timeframeText: {
		color: '#666'
	},
	timeframeTextActive: {
		color: WHITE,
	},
	chartContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: WHITE,
		borderRadius: 10,
		padding: 10,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	}
})
