import ScreenWrapper from "@/components/ScreenWrapper";
import SegmentedPicker from "@/components/SegmentedPicker";
import StyledText from "@/components/StyledText";
import { PRIMARY, WHITE } from "@/constants/Colors";
import useStats from "@/hooks/useStats";
import { HappyMonkey_400Regular } from "@expo-google-fonts/happy-monkey";
import { useFont } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CartesianChart, Line } from "victory-native";

interface IChartData extends Record<string, unknown> {
  date: string;
  completed: number;
}

export default function Stats() {
  const { loading, error, getCompletionStats } = useStats();
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("day");
  const [chartData, setChartData] = useState<IChartData[]>([]);
  const font = useFont(HappyMonkey_400Regular, 12);

  useEffect(() => {
    getCompletionStats(timeframe).then((data) => {
      if (data) {
        setChartData(data as IChartData[]);
      }
    });
  }, [timeframe, getCompletionStats]);

  if ((loading && chartData.length === 0) || !font)
    return (
      <ScreenWrapper title="Stats">
        <StyledText>Loading...</StyledText>
      </ScreenWrapper>
    );
  if (error)
    return (
      <ScreenWrapper title="Stats">
        <StyledText>Error : {error?.toString() || "Unknown error"}</StyledText>
      </ScreenWrapper>
    );

  return (
    <ScreenWrapper title="Stats">
      <SegmentedPicker
        options={["day", "week", "month"] as const}
        selected={timeframe}
        onSelect={setTimeframe}
      />

      <View style={styles.chartContainer}>
        {chartData.length > 0 ? (
          <View style={{ height: 500, width: 500, maxWidth: "100%" }}>
            <CartesianChart
              data={chartData}
              xKey="date"
              yKeys={["completed"]}
              axisOptions={{
                font,
                tickCount: 5,
                formatXLabel: (xValue: string | number | Date | undefined) => {
                  if (!xValue) return "";
                  if (timeframe === "week") {
                    const label = String(xValue);
                    const [, week] = label.split("-");
                    return week ? `W${week}` : label;
                  }

                  return String(xValue);
                },
              }}
            >
              {({ points }) => (
                <Line
                  points={points.completed}
                  color={PRIMARY}
                  strokeWidth={3}
                />
              )}
            </CartesianChart>
          </View>
        ) : (
          <StyledText>No data available for this period</StyledText>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
