import StyledText from "@/components/StyledText"
import { PRIMARY, WHITE } from "@/constants/Colors"
import useTasks from "@/hooks/useDB"
import { HappyMonkey_400Regular } from "@expo-google-fonts/happy-monkey"
import { useFont } from "@shopify/react-native-skia"
import { useEffect, useState } from "react"
import { ImageBackground, StyleSheet, TouchableOpacity, View } from "react-native"
import { CartesianChart, Line } from "victory-native"

interface IChartData extends Record<string, unknown> {
	date: string
	completed: number
}

export default function Index() {
	const { loading, error, getCompletionStats } = useTasks()
	const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day')
	const [chartData, setChartData] = useState<IChartData[]>([])
	const font = useFont(HappyMonkey_400Regular, 12)


	useEffect(() => {
		getCompletionStats(timeframe).then(data => {
			if (data) {
				setChartData(data as IChartData[])
			}
		})
	}, [timeframe, getCompletionStats])


	if ((loading && chartData.length === 0) || !font) return <StyledText>Loading...</StyledText>
	if (error) return <StyledText>Error: {error?.toString() || 'Unknown error'}</StyledText>

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
								{t}
							</StyledText>
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.chartContainer}>
					{chartData.length > 0 ? (
						<View style={{ height: 500, width: 500, maxWidth: '100%' }}>
							<CartesianChart
								data={chartData}
								xKey="date"
								yKeys={["completed"]}
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

										return String(xValue)
									}
								}}
							>
								{({ points }) => (
									<Line points={points.completed} color={PRIMARY} strokeWidth={3} />
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
		color: '#666',
		textTransform: 'capitalize'
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
