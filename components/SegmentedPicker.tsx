import StyledText from "@/components/StyledText";
import { PRIMARY, WHITE } from "@/constants/Colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface SegmentedPickerProps<T extends string> {
  options: readonly T[];
  selected: T;
  onSelect: (option: T) => void;
}

export default function SegmentedPicker<T extends string>({
  options,
  selected,
  onSelect,
}: SegmentedPickerProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.button, selected === option && styles.buttonActive]}
          onPress={() => onSelect(option)}
        >
          <StyledText style={[styles.text, selected === option && styles.textActive]}>
            {option}
          </StyledText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: WHITE,
    borderRadius: 8,
    padding: 4,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonActive: {
    backgroundColor: PRIMARY,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  text: {
    color: "#666",
    textTransform: "capitalize",
  },
  textActive: {
    color: WHITE,
  },
});
