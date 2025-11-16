import StyledText from "@/components/StyledText"
import { WHITE } from "@/constants/Colors"
import useTasks from "@/hooks/useDB"
import { Dispatch, useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import DropDownPicker from 'react-native-dropdown-picker'

interface ICountByWeek extends Record<string, unknown> {
	count: number
	week: string
	id: number
	title: string
}

export default function Index() {
	const [open, setOpen] = useState(false)
	const [task, setTask] = useState<ITask | null>(null)
	const { tasks, loading, error, getCountByWeek } = useTasks()
	const [countByWeek, setCountByWeek] = useState<ICountByWeek[]>([])
	const handleSelect: Dispatch<any> = (item: string) => {
		if (!tasks) return
		let selectedTask = tasks.find(t => t.id === Number(item))
		if (!selectedTask) return
		setTask(selectedTask)
	}
	useEffect(() => {
		if (!task) return
		getCountByWeek().then(counts => {
			if (counts) {
				setCountByWeek(counts)
			}
		})
	}, [task])
	if (loading && !task) return <StyledText>Loading...</StyledText>
	if (error && !task) return <StyledText>Error: {error?.toString() || 'Unknown error'}</StyledText>
	return (
		<View style={styles.container}>
			<StyledText style={styles.title}>Stats</StyledText>
			<DropDownPicker
				open={open}
				setOpen={setOpen}
				items={tasks.map(t => ({ label: t.title || 'Untitled', value: t.id.toString() }))}
				setValue={handleSelect}
				value={task?.id?.toString() || null}
			/>
			{task === null ? (
				<View>
					<StyledText>Select a task to see stats</StyledText>
				</View>
			) : (<StyledText> helo </StyledText>
			)}
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
		backgroundColor: WHITE,
		maxWidth: '100%'
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
