import { BLACK, GRAY, PRIMARY, RED, WHITE } from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import StyledText from "./StyledText";
import Picker from "./Picker";
import { Checkbox } from "expo-checkbox";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onEdit: (task: ITask) => Promise<void>;
  onDelete: () => Promise<void>;
  onComplete: () => Promise<void>;
  task: ITask;
}
export default function TaskEditor({
  onEdit,
  onDelete,
  onComplete,
  visible,
  setVisible,
  task,
}: Props) {
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<
    | "daily"
    | "weekly"
    | "monthly"
    | "other-day"
    | "weekdays"
    | "weekend"
    | "finite"
  >("daily");
  const [frequency, setFrequency] = useState<number | null>(null);
  const [frequencyText, setFrequencyText] = useState("");
  const [hasReward, setHasReward] = useState(false);
  const [reward, setReward] = useState<string>("");
  const [rewardWhen, setRewardWhen] = useState("");
  const [maxRewardsText, setMaxRewardsText] = useState("");
  const [maxRewards, setMaxRewards] = useState(0);

  const items = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Every other day", value: "other-day" },
    { label: "Weekdays", value: "weekdays" },
    { label: "Weekend", value: "weekend" },
    { label: "Finite", value: "finite" },
  ];
  const handleClose = () => {
    setName("");
    setFrequency(null);
    setFrequencyText("");
    setHasReward(false);
    setReward("");
    setType("daily");
    setVisible(false);
  };

  const handleFrequencyChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setFrequencyText(cleaned);
    if (cleaned === "") {
      setFrequency(null);
    } else {
      setFrequency(parseInt(cleaned, 10));
    }
  };
  const handleMaxRewardsChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setMaxRewardsText(cleaned);
    if (cleaned === "") {
      setMaxRewards(0);
    } else {
      setMaxRewards(parseInt(cleaned));
    }
  };
  const handleTypeChange = (value: string) => {
    if (value && items.map((i) => i.value).includes(value))
      setType(value as typeof type);
  };

  useEffect(() => {
    setName(task.title);
    setReward(task.reward ?? "");
    setType(task.type ?? "daily");
    setRewardWhen(task.rewardWhen);
    setMaxRewards(task.maxRewards ?? 0);
    setFrequencyText(task.frequency + "");
    setFrequency(task.frequency);
    setMaxRewardsText(task.maxRewards + "");
    setHasReward(task.hasReward ?? false);
  }, [task]);

  const handleEdit = async () => {
    try {
      if (!name.trim()) {
        alert("Please enter an activity name");
        return;
      }
      if (hasReward && !reward.trim()) {
        alert("Please enter a reward");
        return;
      }
      if (hasReward && !rewardWhen.trim()) {
        alert("Please specify when the reward is given");
        return;
      }
      await onEdit({
        ...task,
        title: name,
        updatedAt: new Date(),
        type,
        reward,
        rewardWhen,
        maxRewards,
        frequency,
        hasReward,
      });
      setName("");
      setVisible(false);
    } catch (e) {
      console.log(e);
      alert("Failed to save activity");
    }
  };
  const handleDelete = async () => {
    try {
      await onDelete();
      setVisible(false);
    } catch (e) {
      console.log(e);
      alert("Failed to delete activity");
    }
  };
  const handleComplete = async () => {
    try {
      await onComplete();
      setVisible(false);
    } catch (e) {
      console.log(e);
      alert("Failed to complete activity");
    }
  };
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
          onChangeText={(text) => setName(text)}
        />
        <Picker
          items={items}
          style={styles.modalInput}
          value={type}
          setValue={handleTypeChange}
        />
        {type && type !== "daily" && type !== "other-day" && (
          <TextInput
            style={styles.modalInput}
            placeholder={
              type === "finite"
                ? "total completions needed"
                : "times per period"
            }
            keyboardType="numeric"
            value={frequencyText}
            onChangeText={handleFrequencyChange}
          />
        )}
        <View style={styles.modalCheckbox}>
          <StyledText size={20}>Has any reward?</StyledText>
          <Checkbox
            value={hasReward}
            onValueChange={setHasReward}
            color={PRIMARY}
          />
        </View>
        {hasReward && (
          <>
            <TextInput
              style={styles.modalInput}
              placeholder="type the reward"
              value={reward}
              onChangeText={setReward}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="when should the price be given"
              value={rewardWhen}
              onChangeText={(text) => setRewardWhen(text)}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="0 = unlimited, or enter a number"
              value={maxRewardsText}
              onChangeText={handleMaxRewardsChange}
            />
          </>
        )}

        <View style={styles.buttonRow}>
          <Pressable
            style={{ ...styles.modalButton, ...styles.buttonRowButton }}
            onPress={handleEdit}
          >
            <StyledText style={styles.modalButtonText}>Edit</StyledText>
          </Pressable>
          <Pressable
            style={{
              ...styles.modalButton,
              backgroundColor: RED,
              ...styles.buttonRowButton,
            }}
            onPress={handleDelete}
          >
            <StyledText style={styles.modalButtonText}>Delete</StyledText>
          </Pressable>
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            style={[
              styles.modalButton,
              styles.buttonRowButton,
              { backgroundColor: GRAY },
            ]}
            onPress={handleComplete}
          >
            <StyledText style={styles.modalButtonText}>Complete</StyledText>
          </Pressable>

          <Pressable
            style={{
              ...styles.modalButton,
              ...styles.buttonRowButton,
              backgroundColor: GRAY,
            }}
            onPress={handleClose}
          >
            <StyledText style={styles.modalButtonText}>Cancel</StyledText>
          </Pressable>
        </View>
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
  },
  modalTitle: {
    fontSize: 32,
    marginTop: 20,
    textAlign: "center",
  },
  modalInput: {
    width: "100%",
    height: 50,
    borderColor: BLACK,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: WHITE,
    fontSize: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  buttonRowButton: {
    width: "48%",
  },
  modalCheckbox: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
});
