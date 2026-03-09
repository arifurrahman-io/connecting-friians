import { StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppScreen({
  children,
  backgroundColor = "#F1F5F9",
  padded = true,
  statusBarStyle = "dark-content",
  edges = ["top"],
  style,
  contentStyle,
}) {
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }, style]}
      edges={edges}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />

      <View
        style={[
          styles.content,
          { backgroundColor },
          padded && styles.padded,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
