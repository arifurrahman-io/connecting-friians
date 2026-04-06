import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import AppScreen from "../src/components/AppScreen";
import { COLORS } from "../src/theme/colors";

export default function ModalScreen() {
  const router = useRouter();

  const handleClose = () => {
    Haptics.selectionAsync();
    router.back();
  };

  return (
    <AppScreen backgroundColor="#F8FAFC" edges={["bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* DRAG HANDLE (Visual Only for Modal feel) */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      <View style={styles.content}>
        {/* ICON ILLUSTRATION */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.iconCircle}>
          <View style={styles.innerCircle}>
            <Ionicons
              name="information-circle"
              size={40}
              color={COLORS.primary}
            />
          </View>
        </Animated.View>

        {/* TEXT CONTENT */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.textStack}
        >
          <Text style={styles.title}>Notice & Info</Text>
          <Text style={styles.subtitle}>
            This feature is currently being tuned for the best experience. Stay
            connected with the FRIIANS community for more updates!
          </Text>
        </Animated.View>

        {/* ACTION BUTTON */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Understood</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* DEVELOPER BRANDING */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Developed by</Text>
        <Text style={styles.devName}>Md Arifur Rahman</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: COLORS.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: { elevation: 5 },
    }),
  },
  textStack: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  devName: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "800",
  },
});
