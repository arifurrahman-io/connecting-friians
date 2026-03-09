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
import { registerUser } from "../../src/services/authService";
import { COLORS } from "../../src/theme/colors";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Missing information", "Please fill in all fields to join.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Security Notice",
        "For your safety, password must be at least 6 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "The passwords entered do not match.");
      return;
    }

    try {
      setLoading(true);
      await registerUser({ name, email, password });
      Alert.alert(
        "Welcome Aboard!",
        "Registration successful. Please check your inbox for a verification email before logging in.",
      );
      router.replace("/(public)/login");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error.message || "Something went wrong.",
      );
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
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add-sharp" size={38} color="#fff" />
            </View>
            <Text style={styles.brand}>Join FRIIANS</Text>
            <Text style={styles.tagline}>
              Build your professional alumni profile and connect with verified
              experts.
            </Text>
          </View>

          {/* Registration Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Enter your details to get started
              </Text>
            </View>

            <View style={styles.formArea}>
              <InputField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                leftIcon="person-outline"
              />

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

              <InputField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                leftIcon="shield-checkmark-outline"
              />

              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.infoText}>
                  We will send a verification link to your email.
                </Text>
              </View>

              <PrimaryButton
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerBtn}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ALREADY REGISTERED?</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(public)/login" asChild>
              <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
                <Text style={styles.loginActionText}>Back to Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.footerText}>
            By joining, you agree to connect responsibly within the FRIIANS
            alumni network.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FE",
  },
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
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24, // Squircle
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brand: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
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
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: "#64748B",
  },
  formArea: {
    gap: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#D1E9FF",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  registerBtn: {
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
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 1,
  },
  loginButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  loginActionText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  footerText: {
    marginTop: 25,
    textAlign: "center",
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 20,
    paddingHorizontal: 30,
  },
});
