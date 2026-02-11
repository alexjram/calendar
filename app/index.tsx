import ScreenWrapper from "@/components/ScreenWrapper";
import StyledText from "@/components/StyledText";
import TaskCreator from "@/components/TaskCreator";
import TaskEditor from "@/components/TaskEditor";
import { BLACK, PRIMARY, WHITE } from "@/constants/Colors";
import useRewards from "@/hooks/useRewards";
import useTodayTasks from "@/hooks/useTodayTasks";
import useNotifications from "@/hooks/useNotifications";
import { getIfRewardAchieved } from "@/services/TaskUtils";
import { Checkbox } from "expo-checkbox";
import { useEffect, useState, useRef } from "react";
import { FlatList, Pressable, StyleSheet, View, AppState } from "react-native";
import Toast from "react-native-toast-message";

export default function Index() {
  const {
    tasks,
    loading,
    addTask,
    markAsCompleted,
    markAsUncompleted,
    updateTask,
    deleteTask,
    getTasks,
    markAsFullyCompleted,
  } = useTodayTasks();
  const { saveAward, removeLastAward } = useRewards();
  const { schedulePendingNotification, unscheduleDailyNotification } =
    useNotifications();
  const [showAddAct, setShowAddAct] = useState<boolean>(false);
  const [showEditAct, setShowEditAct] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const handleAddActButton = () => {
    setShowAddAct(true);
  };

  const hasPendingTasks = tasks.some((t) => !t.hasCompleted);

  useEffect(() => {
    if (loading) return;

    if (hasPendingTasks) {
      schedulePendingNotification();
    } else {
      unscheduleDailyNotification();
    }
  }, [loading, hasPendingTasks, unscheduleDailyNotification, schedulePendingNotification]);

  // Reschedule notification when app comes to foreground (handles next day)
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - check if we need to reschedule
        if (hasPendingTasks) {
          schedulePendingNotification();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [hasPendingTasks, schedulePendingNotification]);

  const handleActChange = async (task: ITask, value: boolean) => {
    try {
      if (value) {
        await markAsCompleted(task.id);
        task.totalCount++;
        if (getIfRewardAchieved(task)) {
          saveAward({
            taskId: task.id,
            rewardNumber: task.rewardCount + 1,
          });
        }
      } else {
        await markAsUncompleted(task.id);
        if (getIfRewardAchieved(task)) {
          removeLastAward(task.id);
        }
      }
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Task marked as ${value ? "completed" : "incomplete"}`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };
  const handleAddAct = async (task: ITaskBase) => {
    try {
      await addTask(task);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Task added successfully",
      });
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };
  const handleEditAct = async (task: ITask) => {
    try {
      const taskBase: ITaskBase = {
        title: task.title,
        type: task.type,
        frequency: task.frequency,
        reward: task.reward,
        hasReward: task.hasReward,
        rewardWhen: task.rewardWhen,
        maxRewards: task.maxRewards,
      };
      await updateTask(task.id, taskBase);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Task updated successfully",
      });
      setShowEditAct(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };
  const handleDeleteAct = async () => {
    if (!selectedTask) return;
    try {
      await deleteTask(selectedTask.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Task deleted successfully",
      });
      setShowEditAct(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };
  const refreshTasks = async () => {
    try {
      await getTasks();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };
  const handleSelectAct = (task: ITask) => {
    setSelectedTask(task);
    setShowEditAct(true);
  };
  const handleCompleteAct = async () => {
    if (!selectedTask) return;
    try {
      await markAsFullyCompleted(selectedTask.id);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Task completed successfully",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };
  return (
    <ScreenWrapper title="Action Tracker">
      <StyledText style={styles.subtitle}>Today </StyledText>
      <FlatList
        style={styles.box}
        data={tasks}
        onRefresh={refreshTasks}
        refreshing={loading}
        renderItem={({ item }) => (
          <View style={styles.activity} key={item.id}>
            <StyledText
              style={styles.activityTitle}
              onPress={() => handleSelectAct(item)}
            >
              {item.title || "Untitled"}
            </StyledText>
            <Checkbox
              value={item.hasCompleted > 0}
              onValueChange={(val) => handleActChange(item, val)}
              color={PRIMARY}
              style={styles.checkbox}
            />
          </View>
        )}
      />
      <Pressable style={styles.addActButton} onPress={handleAddActButton}>
        <StyledText style={styles.addActText}>Add Activity</StyledText>
      </Pressable>
      <TaskCreator
        visible={showAddAct}
        setVisible={setShowAddAct}
        onSave={handleAddAct}
      />
      {selectedTask && (
        <TaskEditor
          visible={showEditAct}
          setVisible={setShowEditAct}
          onEdit={handleEditAct}
          onDelete={handleDeleteAct}
          onComplete={handleCompleteAct}
          task={selectedTask}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: 20,
    fontSize: 32,
  },
  box: {
    width: "100%",
    marginTop: 20,
    padding: 10,
  },
  activity: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityTitle: {
    fontSize: 24,
    marginBottom: 10,
    color: BLACK,
  },
  addActButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  addActText: {
    color: WHITE,
    fontSize: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
  },
});
