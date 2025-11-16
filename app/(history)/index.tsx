import CompletionModal from "@/components/CompletionModal"
import StyledText from "@/components/StyledText"
import { WHITE } from "@/constants/Colors"
import { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Calendar } from 'react-native-calendars'
export default function Index() {
	const [visible, setVisible] = useState(false)
	const [day, setDay] = useState(new Date())
	return (
		<View style={styles.container}>
			<StyledText style={styles.title}>History</StyledText>
			<Calendar
				style={styles.calendar}
				enableSwipeMonths
				current={new Date().toUTCString()}
				onDayPress={(date) => {
					setDay(new Date(date.dateString))
					setVisible(true)
				}}
			/>
			<CompletionModal visible={visible} setVisible={setVisible} day={day} />
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
