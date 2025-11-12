import StyledText from "@/components/StyledText"
import { WHITE } from "@/constants/Colors"
import { View, StyleSheet } from "react-native"
import { Calendar } from 'react-native-calendars'
export default function Index() {
	return (
		<View style={styles.container}>
			<StyledText style={styles.title}>History</StyledText>
			<Calendar
				style={styles.calendar}
				enableSwipeMonths
				current={new Date().toUTCString()}
			/>
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
