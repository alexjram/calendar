import StyledText from "@/components/StyledText"
import { PRIMARY, WHITE } from "@/constants/Colors"
import { View, StyleSheet } from "react-native"
import { CartesianChart, Bar } from 'victory-native'

const dataCreator = (length: number = 10) =>
	Array.from({ length }, (_, index) => ({
		month: index + 1,
		listenCount: Math.floor(Math.random() * 100 - 50 + 1) + 50
	}))


export default function Index() {
	const data = dataCreator(5)
	console.log(data)
	return (
		<View style={styles.container}>
			<StyledText style={styles.title}>Stats</StyledText>
			<View style={{ flex: 1.5, backgroundColor: PRIMARY, height: 100 }}>
				<CartesianChart data={data} xKey="month" yKeys={["listenCount"]}>
					{({ points, chartBounds }) => (
						<Bar
							points={points.listenCount}
							chartBounds={chartBounds}
							color={PRIMARY}
						>

						</Bar>
					)}
				</CartesianChart>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		paddingTop: 50,
		paddingHorizontal: 20,
		paddingBottom: 20,
		backgroundColor: WHITE
	},

	title: {
		fontSize: 48,
		textAlign: 'center'
	},
	calendar: {
		marginTop: 20,
		borderRadius: 5,
	}
})
