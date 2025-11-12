import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { Checkbox } from 'expo-checkbox'
import StyledText from "@/components/StyledText";
import { useState } from "react";
import { BLACK, PRIMARY, WHITE } from "@/constants/Colors";
import TaskCreator from "@/components/TaskCreator";
import useTasks from "@/hooks/useDB";



export default function Index() {
	const { tasks, addTask, markAsCompleted, markAsUncompleted } = useTasks()
	const [showAddAct, setShowAddAct] = useState<boolean>(false)
	const handleAddActButton = () => {
		setShowAddAct(true)
	}

	const handleActChange = async (index: number, value: boolean) => {
		if (value) {
			console.log("mark as completed", tasks[index])
			await markAsCompleted(tasks[index].id)
		} else {
			await markAsUncompleted(tasks[index].id)
		}
	}
	const handleAddAct = async (name: string) => {
		await addTask(name)
	}
	console.log(tasks)
	return (
		<View style={styles.container}>
			<StyledText style={styles.title}>Action Tracker</StyledText>
			<StyledText style={styles.subtitle}>Today </StyledText>
			<FlatList
				style={styles.box}
				data={tasks}
				renderItem={({ item, index }) => (
					<View style={styles.activity} key={index}>
						<StyledText style={styles.activityTitle}>{item.title}</StyledText>
						<Checkbox value={item.hasCompleted} onValueChange={val => handleActChange(index, val)} color={PRIMARY} />
					</View>
				)}
			/>
			<Pressable style={styles.addActButton} onPress={handleAddActButton} >
				<StyledText style={styles.addActText}>Add Activity</StyledText>
			</Pressable>
			<TaskCreator visible={showAddAct} setVisible={setShowAddAct} onSave={handleAddAct} />
		</View >
	);
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
