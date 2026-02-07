import CompletionModal from "@/components/CompletionModal";
import ScreenWrapper from "@/components/ScreenWrapper";
import StyledText from "@/components/StyledText";
import { PRIMARY, WHITE } from "@/constants/Colors";
import useCalendarBounds from "@/hooks/useCalendarBounds";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
export default function History() {
  const [visible, setVisible] = useState(false);
  const [day, setDay] = useState(new Date());
  const { earliestDate: earliest, loading, error } = useCalendarBounds();

  if (loading)
    return (
      <ScreenWrapper title="History">
        <StyledText>Loading...</StyledText>
      </ScreenWrapper>
    );

  if (error)
    return (
      <ScreenWrapper title="History">
        <StyledText>Error: {error?.toString()}</StyledText>
      </ScreenWrapper>
    );
  return (
    <ScreenWrapper title="History">
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
          backgroundColor: "transparent",
        }}
        enableSwipeMonths
        maxDate={new Date().toDateString()}
        current={new Date().toDateString()}
        minDate={earliest?.toDateString()}
        onDayPress={(date) => {
          setDay(
            new Date(
              date.timestamp + new Date().getTimezoneOffset() * 60 * 1000,
            ),
          );
          setVisible(true);
        }}
      />
      <CompletionModal visible={visible} setVisible={setVisible} day={day} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  calendar: {
    marginTop: 20,
    borderRadius: 5,
    width: "100%",
  },
});
