import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
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
import { loginUser } from "../../src/services/authService";
import { COLORS } from "../../src/theme/colors";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Dynamic Toast State
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  // Load saved email if "Remember Me" was previously checked
  useEffect(() => {
    const checkSavedEmail = async () => {
      const savedEmail = await SecureStore.getItemAsync("user_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    };
    checkSavedEmail();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });

    if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast("Please enter email and password.", "error");
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await loginUser(email, password);

      // Save or Delete email from storage based on "Remember Me"
      if (rememberMe) {
        await SecureStore.setItemAsync("user_email", email.trim());
      } else {
        await SecureStore.deleteItemAsync("user_email");
      }

      showToast("Welcome back!", "success");

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error) {
      console.error(error);
      let errorMsg = "Login failed. Please try again.";

      if (error.code === "auth/invalid-credential") {
        errorMsg = "Invalid email or password.";
      } else if (error.message.includes("verify your email")) {
        errorMsg = "Please verify your email first.";
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

      {/* Dynamic Background Header */}
      <View style={styles.topBg}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
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
          {/* Hero Section */}
          <Animated.View
            entering={FadeInUp.duration(800)}
            style={styles.heroSection}
          >
            <View style={styles.logoCircle}>
              <Ionicons name="people-sharp" size={38} color="#fff" />
            </View>
            <Text style={styles.brand}>FRIIANS</Text>
            <Text style={styles.tagline}>
              Empowering the alumni network through expert guidance.
            </Text>
          </Animated.View>

          {/* Main Login Card */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <View style={styles.formArea}>
              <InputField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@email.com"
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

              {/* REMEMBER ME & FORGOT PASSWORD ROW */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberBtn}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRememberMe(!rememberMe);
                  }}
                >
                  <Ionicons
                    name={rememberMe ? "checkbox" : "square-outline"}
                    size={22}
                    color={rememberMe ? COLORS.primary : "#94A3B8"}
                  />
                  <Text style={styles.rememberText}>Remember Me</Text>
                </TouchableOpacity>

                <Link href="/(public)/forgot-password" asChild>
                  <TouchableOpacity onPress={() => Haptics.selectionAsync()}>
                    <Text style={styles.forgotText}>Forgot?</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <PrimaryButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginBtn}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(public)/register" asChild>
              <TouchableOpacity
                style={styles.registerButton}
                activeOpacity={0.8}
                onPress={() => Haptics.selectionAsync()}
              >
                <Text style={styles.registerPrefix}>New here?</Text>
                <Text style={styles.registerActionText}>Create Account</Text>
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
    height: 320,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 20,
    left: -30,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: { alignItems: "center", marginBottom: 32 },
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
  brand: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
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
  cardHeader: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#1E293B" },
  subtitle: { marginTop: 4, fontSize: 15, color: "#64748B" },
  formArea: { gap: 12 },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  rememberBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rememberText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  loginBtn: { borderRadius: 16, height: 56 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#F1F5F9" },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "800",
  },
  registerButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  registerPrefix: { fontSize: 15, color: "#64748B", fontWeight: "500" },
  registerActionText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  // --- TOAST STYLES ---
  toastContainer: {
    position: "absolute",
    top: 60,
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
