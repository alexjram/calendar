import { BLACK, PRIMARY, WHITE } from "@/constants/Colors";
import useTasks from "@/hooks/useDB";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import StyledText from "./StyledText";

interface Props {
	visible: boolean
	setVisible: (visible: boolean) => void
	day: Date
}
export default function CompletionModal({ day, visible, setVisible }: Props) {
	const [tasks, setTasks] = useState<ITask[]>([])
	const { getTaskHistory } = useTasks()
	useEffect(() => {
		setTasks([])
		const start = new Date(day.toISOString())
		const end = new Date(day.toISOString())
		start.setHours(0, 0, 0, 0)
		end.setHours(23, 59, 59, 999)

		getTaskHistory(start, end).then(tasks => {
			if (tasks) {
				setTasks(tasks)
			}
		})
	}, [day])
	const handleClose = () => {
		setTasks([])
		setVisible(false)
	}
	return (
		<Modal
			animationType="slide"
			transparent={false}
			visible={visible}
			onRequestClose={handleClose}
		>
			<View style={styles.modalContainer}>
				<StyledText style={styles.modalTitle}>Day: {day.toLocaleDateString()}</StyledText>
				<FlatList
					data={tasks}
					renderItem={({ item }) => (
						<View style={styles.modalItemContainer}>
							<StyledText style={styles.modalItem}>{item.title || 'Untitled'} - {item.hasCompleted ? "Completed" : "Incomplete"}</StyledText>
						</View>
					)}
					style={styles.modalList}
					contentContainerStyle={styles.modalListContainer}
					showsVerticalScrollIndicator={false}
				/>
				<Pressable style={styles.modalButton} onPress={handleClose}>
					<StyledText style={styles.modalButtonText}>Close</StyledText>
				</Pressable>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	addActText: {
		color: WHITE,
		fontSize: 20,
	},
	modalContainer: {
		backgroundColor: WHITE,
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 30,
		paddingBottom: 100,
		paddingTop: 100
	},
	modalTitle: {
		fontSize: 32,
		marginTop: 20,
		textAlign: "center"
	},
	modalButton: {
		backgroundColor: PRIMARY,
		paddingVertical: 10,
		paddingHorizontal: 30,
		marginTop: 10,
		width: "100%",
		alignItems: 'center'
	},
	modalButtonText: {
		color: WHITE,
		fontSize: 20
	},
	modalList: {
		marginTop: 20,
		paddingHorizontal: 20,
		paddingBottom: 20
	},
	modalListContainer: {
		borderRadius: 5,
		backgroundColor: WHITE
	},
	modalItem: {
		fontSize: 20,
		marginVertical: 10,
		paddingHorizontal: 10,
		color: BLACK
	},
	modalItemContainer: {
		marginVertical: 5
	}
})
