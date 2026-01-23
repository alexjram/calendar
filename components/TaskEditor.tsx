import { BLACK, GRAY, PRIMARY, RED, WHITE } from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import StyledText from "./StyledText";

interface Props {
	visible: boolean
	setVisible: (visible: boolean) => void
	onEdit: (task: ITask) => Promise<void>
	onDelete: () => Promise<void>
	task: ITask
}
export default function TaskEditor({ onEdit, onDelete, visible, setVisible, task }: Props) {
	const [name, setName] = useState<string>("")
	useEffect(() => {
		setName(task.title)
	}, [task])

	const handleClose = () => {
		setName("")
		setVisible(false)
	}
	const handleEdit = async () => {
		try {
			await onEdit({ ...task, title: name, updatedAt: new Date() })
			setName("")
			setVisible(false)
		} catch (e) {
			console.log(e)
			alert("Failed to save activity")
		}
	}
	const handleDelete = async () => {
		try {
			await onDelete()
			setVisible(false)
		} catch (e) {
			console.log(e)
			alert("Failed to delete activity")
		}
	}
	return (
		<Modal
			animationType="slide"
			transparent={true}
			visible={visible}
			onRequestClose={handleClose}
		>
			<View style={styles.modalContainer}>
				<StyledText style={styles.modalTitle}>Add Activity</StyledText>
				<TextInput
					style={styles.modalInput}
					placeholder="Activity Name"
					value={name}
					onChangeText={text => setName(text)}
				/>
				<View style={styles.buttonRow}>
					<Pressable style={{...styles.modalButton, ...styles.buttonRowButton}} onPress={handleEdit}>
						<StyledText style={styles.modalButtonText}>Edit</StyledText>
					</Pressable>
					<Pressable style={{ ...styles.modalButton, backgroundColor: RED, ...styles.buttonRowButton }} onPress={handleDelete}>
						<StyledText style={styles.modalButtonText}>Delete</StyledText>
					</Pressable>
				</View>

				<Pressable style={{...styles.modalButton, backgroundColor: GRAY}} onPress={handleClose}>
					<StyledText style={styles.modalButtonText}>Cancel</StyledText>
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
		paddingHorizontal: 30
	},
	modalTitle: {
		fontSize: 32,
		marginTop: 20,
		textAlign: "center"
	},
	modalInput: {
		width: "100%",
		height: 50,
		borderColor: BLACK,
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginTop: 20
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
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginTop: 10
	},
	buttonRowButton: {
		width: '48%'
	}
})
