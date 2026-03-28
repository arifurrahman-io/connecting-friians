import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";

import InputField from "../../src/components/InputField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { registerUser } from "../../src/services/authService";
import { COLORS } from "../../src/theme/colors";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic Toast State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });

    if (Platform.OS !== "web") {
      type === "success"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const handleRegister = async () => {
    // 1. Validations
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToast("Please fill in all details.", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    try {
      setLoading(true);
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // This creates the Auth user AND the Firestore profile
      await registerUser({ fullName, email, password });

      showToast("Account created! Check your email to verify.", "success");

      // Redirect to verification screen after 2 seconds
      // Our RootLayout NavigationGuard will also naturally catch this
      setTimeout(() => {
        router.replace("/verify-email");
      }, 2000);
    } catch (error) {
      console.error("Registration failed:", error.code);

      let errorMsg = "Could not register. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Please use a valid email address.";
      } else if (error.code === "auth/network-request-failed") {
        errorMsg = "Check your internet connection.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "Password is too weak.";
      }

      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* --- DYNAMIC TOAST NOTIFICATION --- */}
      {toast.visible && (
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOut}
          style={[
            styles.toastContainer,
            {
              backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444",
            },
          ]}
        >
          <Ionicons
            name={
              toast.type === "success" ? "checkmark-circle" : "alert-circle"
            }
            size={20}
            color="#fff"
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Decorative Header Background */}
      <View style={styles.topBg}>
        <View style={styles.circleLarge} />
        <View style={styles.circleSmall} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInUp.duration(800)}
            style={styles.heroSection}
          >
            <View style={styles.logoCircle}>
              <Ionicons name="person-add-sharp" size={38} color="#fff" />
            </View>
            <Text style={styles.brand}>Join FRIIANS</Text>
            <Text style={styles.tagline}>Network. Learn. Grow. Together.</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join our community of verified experts
              </Text>
            </View>

            <View style={styles.formArea}>
              <InputField
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Write your full name"
                leftIcon="person-outline"
              />

              <InputField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Write your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />

              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <InputField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                leftIcon="shield-checkmark-outline"
              />

              <PrimaryButton
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerBtn}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ALREADY HAVE AN ACCOUNT?</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(public)/login" asChild>
              <TouchableOpacity
                style={styles.loginButton}
                activeOpacity={0.7}
                onPress={() =>
                  Platform.OS !== "web" && Haptics.selectionAsync()
                }
              >
                <Text style={styles.loginActionText}>Sign In Instead</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FE" },
  topBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 340,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  circleLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -60,
    right: -40,
  },
  circleSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 40,
    left: -20,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  heroSection: { alignItems: "center", marginBottom: 28 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brand: { fontSize: 30, fontWeight: "900", color: "#fff" },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
  },
  cardHeader: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#1E293B" },
  subtitle: { marginTop: 4, fontSize: 15, color: "#64748B" },
  formArea: { gap: 12 },
  registerBtn: { borderRadius: 16, height: 56, marginTop: 10 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#F1F5F9" },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 1,
  },
  loginButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  loginActionText: { color: COLORS.primary, fontSize: 15, fontWeight: "800" },
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
