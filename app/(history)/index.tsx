import CompletionModal from "@/components/CompletionModal"
import StyledText from "@/components/StyledText"
import { PRIMARY, WHITE } from "@/constants/Colors"
import useTasks from "@/hooks/useDB"
import { useEffect, useState } from "react"
import { ImageBackground, StyleSheet, View } from "react-native"
import { Calendar } from 'react-native-calendars'
export default function Index() {
	const [visible, setVisible] = useState(false)
	const [day, setDay] = useState(new Date())
	const { getEarliestTaskCreationDate } = useTasks()
	const [earliest, setEarliest] = useState<Date | null>(null)
	useEffect(() => {
		getEarliestTaskCreationDate().then(date => {
			if (date) {
				setEarliest(date)
			}
		})
	}, [getEarliestTaskCreationDate])
	return (
		<ImageBackground source={require('@/assets/images/bg.jpg')} style={{ flex: 1 }}>
			<View style={styles.container}>
				<StyledText style={styles.title}>History</StyledText>
				<Calendar
					style={styles.calendar}
					theme={{
						arrowColor: PRIMARY,
						arrowHeight: 10,
						todayBackgroundColor: PRIMARY,
						todayTextColor: WHITE,
						textDayFontSize: 16,
						textMonthFontSize: 20,
						textDayHeaderFontSize: 14,
						backgroundColor: 'transparent'
					}}
					enableSwipeMonths
					maxDate={new Date().toDateString()}
					current={new Date().toDateString()}
					minDate={earliest?.toDateString()}
					onDayPress={(date) => {
						setDay(new Date(date.timestamp + new Date().getTimezoneOffset() * 60 * 1000))
						setVisible(true)
					}}
				/>
				<CompletionModal visible={visible} setVisible={setVisible} day={day} />
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
		fontSize: 48,
		textAlign: 'center'
	},
	calendar: {
		marginTop: 20,
		borderRadius: 5,
		width: '100%',
	}
})
