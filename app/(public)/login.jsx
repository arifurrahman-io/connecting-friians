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

// Firebase Imports for the Ban Check
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../src/firebase/config";

import InputField from "../../src/components/InputField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { loginUser } from "../../src/services/authService";
import { COLORS } from "../../src/theme/colors";

const { width } = Dimensions.get("window");

const storage = {
  getItem: async (key) => {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === "web") return localStorage.setItem(key, value);
    await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key) => {
    if (Platform.OS === "web") return localStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
    long: false, // Added for the ban message
  });

  useEffect(() => {
    const checkSavedEmail = async () => {
      try {
        const savedEmail = await storage.getItem("user_email");
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Storage check failed", e);
      }
    };
    checkSavedEmail();
  }, []);

  const showToast = (message, type = "success", isLong = false) => {
    setToast({ visible: true, message, type, long: isLong });
    if (Platform.OS !== "web") {
      type === "success"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    // Ban messages stay longer (8 seconds) so users can read the email
    setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      isLong ? 8000 : 3000,
    );
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast("Fields cannot be empty", "error");
      return;
    }

    try {
      setLoading(true);
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 1. Perform standard Auth Login
      const userCredential = await loginUser(email, password);
      const user = userCredential.user;

      // 2. FETCH PROFILE TO CHECK BAN STATUS
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.status === "banned" || userData.isBlocked === true) {
          // Immediately sign out so the NavigationGuard doesn't let them in
          await signOut(auth);

          showToast(
            "Account Banned: Please contact arifurrahman.now@gmail.com to appeal.",
            "error",
            true,
          );
          setLoading(false);
          return;
        }
      }

      // 3. SUCCESS LOGIC
      if (rememberMe) {
        await storage.setItem("user_email", email.trim());
      } else {
        await storage.deleteItem("user_email");
      }

      showToast("Welcome back!", "success");
      setTimeout(() => router.replace("/(tabs)"), 1000);
    } catch (error) {
      console.log(error);
      const errorMsg =
        error.code === "auth/invalid-credential"
          ? "Invalid credentials"
          : "Login failed. Check your connection.";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent />

      {/* DYNAMIC TOAST */}
      {toast.visible && (
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOut}
          style={[
            styles.toast,
            {
              backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444",
              height: toast.long ? "auto" : 54, // Adjust height for long ban text
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

      <View style={styles.topBg}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
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
          <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="people" size={32} color="#fff" />
            </View>
            <Text style={styles.brandTitle}>FRIIANS</Text>
            <Text style={styles.brandSub}>Network. Learn. Grow.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
            <Text style={styles.loginTitle}>Login</Text>

            <View style={styles.inputGap}>
              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
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
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <Ionicons
                  name={rememberMe ? "checkbox" : "square-outline"}
                  size={20}
                  color={rememberMe ? COLORS.primary : "#94A3B8"}
                />
                <Text style={styles.checkText}>Remember</Text>
              </TouchableOpacity>
              <Link href="/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.btn}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <Link href="/(public)/register" asChild>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={styles.footerBase}>New user?</Text>
                <Text style={styles.footerAction}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  topBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 60,
  },
  circle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -40,
    right: -40,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 40,
    left: -20,
  },
  container: { paddingHorizontal: 28, paddingTop: 50, paddingBottom: 30 },
  header: { alignItems: "center", marginBottom: 25 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  brandSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 20,
  },
  inputGap: { gap: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  forgotLink: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  btn: { borderRadius: 16, height: 54, marginTop: 5 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: "#F1F5F9" },
  orText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
  },
  footerLink: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 5,
  },
  footerBase: { fontSize: 14, color: "#64748B" },
  footerAction: { fontSize: 14, color: COLORS.primary, fontWeight: "800" },
  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "700", flex: 1 },
});
