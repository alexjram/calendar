import StyledText from "@/components/StyledText";
import TaskCreator from "@/components/TaskCreator";
import TaskEditor from "@/components/TaskEditor";
import { BLACK, PRIMARY, WHITE } from "@/constants/Colors";
import useTasks from "@/hooks/useDB";
import { Checkbox } from 'expo-checkbox';
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Toast from 'react-native-toast-message';

export default function Index() {
	const { tasks, addTask, markAsCompleted, markAsUncompleted, updateTask, deleteTask } = useTasks()
	const [showAddAct, setShowAddAct] = useState<boolean>(false)
	const [showEditAct, setShowEditAct] = useState<boolean>(false)
	const [selectedTask, setSelectedTask] = useState<ITask | null>(null)
	const handleAddActButton = () => {
		setShowAddAct(true)
	}

	const handleActChange = async (index: number, value: boolean) => {
		try {
			if (value) {
				await markAsCompleted(tasks[index].id)
			} else {
				await markAsUncompleted(tasks[index].id)
			}
		} catch (error: any) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: error.message
			})
		}
	}
	const handleAddAct = async (name: string) => {
		try {
			await addTask(name)
			Toast.show({
				type: "success",
				text1: "Success",
				text2: "Task added successfully"
			})
		} catch (error: any) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: error.message
			})
		}
	}
	const handleEditAct = async (task: ITask) => {
		try {
			await updateTask(task.id, task.title)
			Toast.show({
				type: "success",
				text1: "Success",
				text2: "Task updated successfully"
			})
			setShowEditAct(false)
		} catch (error: any) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: error.message
			})
		}
	}
	const handleDeleteAct = async () => {
		if (!selectedTask) return
		try {
			await deleteTask(selectedTask.id)
			Toast.show({
				type: "success",
				text1: "Success",
				text2: "Task deleted successfully"
			})
			setShowEditAct(false)
		} catch (error: any) {
			Toast.show({
				type: "error",
				text1: "Error",
				text2: error.message
			})
		}
	}
	const handleSelectAct = (task: ITask) => {
		setSelectedTask(task)
		setShowEditAct(true)
	}
	return (
		<View style={styles.container}>
			<StyledText style={styles.title}>Action Tracker</StyledText>
			<StyledText style={styles.subtitle}>Today </StyledText>
			<FlatList
				style={styles.box}
				data={tasks}
				renderItem={({ item, index }) => (
					<View style={styles.activity} key={index}>
						<StyledText style={styles.activityTitle} onPress={() => handleSelectAct(item)}>{item.title || 'Untitled'}</StyledText>
						<Checkbox value={item.hasCompleted > 0} onValueChange={val => handleActChange(index, val)} color={PRIMARY} />
					</View>
				)}
			/>
			<Pressable style={styles.addActButton} onPress={handleAddActButton}>
				<StyledText style={styles.addActText}>Add Activity</StyledText>
			</Pressable>
			<TaskCreator visible={showAddAct} setVisible={setShowAddAct} onSave={handleAddAct} />
			{selectedTask && <TaskEditor visible={showEditAct} setVisible={setShowEditAct} onEdit={handleEditAct} onDelete={handleDeleteAct} task={selectedTask} />}
		</View >
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		paddingTop: 50,
		paddingHorizontal: 20,
		paddingBottom: 20
	},
	title: {
		fontSize: 48,
		textAlign: 'center'
	},
	subtitle: {
		marginTop: 75,
		fontSize: 32
	},
	box: {
		borderStyle: 'solid',
		borderColor: BLACK,
		borderWidth: 1,
		width: '100%',
		marginTop: 20,
		padding: 10
	},
	activity: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	activityTitle: {
		fontSize: 24,
		marginBottom: 10,
		color: BLACK
	},
	addActButton: {
		backgroundColor: PRIMARY,
		paddingVertical: 10,
		paddingHorizontal: 30,
		marginTop: 10,
		width: "100%",
		alignItems: 'center'
	},
	addActText: {
		color: WHITE,
		fontSize: 20
	}
})
