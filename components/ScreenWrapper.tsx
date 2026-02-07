import StyledText from "@/components/StyledText";
import { ReactNode } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

interface ScreenWrapperProps {
  children: ReactNode;
  title: string;
  titleStyle?: object;
  containerStyle?: object;
}

export default function ScreenWrapper({
  children,
  title,
  titleStyle,
  containerStyle,
}: ScreenWrapperProps) {
  return (
    <ImageBackground
      source={require("@/assets/images/bg.jpg")}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, containerStyle]}>
        <StyledText style={[styles.title, titleStyle]}>{title}</StyledText>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 48,
    textAlign: "center",
  },
});
