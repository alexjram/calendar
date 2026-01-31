import Dropdown from "react-native-picker-select";

interface Props {
  value: string | null;
  setValue: (value: string) => void;
  items: { label: string; value: string }[];
  style: any;
}
export default function PickerComponent({
  value,
  setValue,
  items,
  style,
}: Props) {
  const handleValueChange = (itemValue: string, index: number) => {
    setValue(itemValue);
  };

  return (
    <Dropdown
      items={items}
      onValueChange={handleValueChange}
      value={value ?? "daily"}
      style={{
        viewContainer: { ...style, justifyContent: "center" },
      }}
    />
  );
}
