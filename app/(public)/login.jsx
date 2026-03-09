import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import InputField from "../../src/components/InputField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { loginUser } from "../../src/services/authService";
import { COLORS } from "../../src/theme/colors";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing information", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Login failed", error.message || "Something went wrong.");
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
          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="people-sharp" size={38} color="#fff" />
            </View>
            <Text style={styles.brand}>FRIIANS</Text>
            <Text style={styles.tagline}>
              Empowering the alumni network through expert guidance and
              collaboration.
            </Text>
          </View>

          {/* Main Login Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to join the conversation
              </Text>
            </View>

            <View style={styles.formArea}>
              <InputField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline" // Assuming InputField supports icons
              />

              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <TouchableOpacity
                style={styles.forgotWrap}
                onPress={() => router.push("/(public)/forgot-password")}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

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
              >
                <Text style={styles.registerPrefix}>New here?</Text>
                <Text style={styles.registerActionText}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.footerText}>
            Join thousands of FRIIANS solving real-world problems together.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FE", // Softer background
  },
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
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24, // Squircle for modern feel
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brand: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
  },
  cardHeader: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: "#64748B",
  },
  formArea: {
    gap: 4,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    paddingVertical: 8,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  loginBtn: {
    marginTop: 10,
    borderRadius: 16,
    height: 56,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F1F5F9",
  },
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
  registerPrefix: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  registerActionText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  footerText: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});
