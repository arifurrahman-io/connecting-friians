import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import { forgotPassword } from "../../src/services/authService";
import { COLORS } from "../../src/theme/colors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert(
        "Email Required",
        "Please enter the email address associated with your account.",
      );
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid Format", "Please provide a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(trimmedEmail);

      Alert.alert(
        "Instructions Sent",
        "If an account exists with this email, you will receive password reset instructions shortly.",
        [
          {
            text: "Back to Login",
            onPress: () => router.replace("/(public)/login"),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Reset Failed",
        error.message || "Unable to process request at this time.",
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

      {/* Dynamic Glassmorphism Header */}
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
              <Ionicons name="key-sharp" size={38} color="#fff" />
            </View>
            <Text style={styles.brand}>Recovery</Text>
            <Text style={styles.tagline}>
              No worries! It happens. Enter your email and we'll help you get
              back into the network.
            </Text>
          </View>

          {/* Recovery Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your registered email address
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
                leftIcon="mail-outline"
              />

              <View style={styles.infoBox}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.infoText}>
                  For security, check your spam folder if you don't see the
                  email within 5 minutes.
                </Text>
              </View>

              <PrimaryButton
                title="Send Reset Link"
                onPress={handleReset}
                loading={loading}
                style={styles.resetBtn}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/(public)/login")}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Return to Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Ensuring the security of the FRIIANS alumni ecosystem.
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
    height: 320,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  circleLarge: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -80,
    right: -50,
  },
  circleSmall: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
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
    borderRadius: 24, // Squircle
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
    letterSpacing: 0.5,
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
    shadowOpacity: 0.12,
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
    gap: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0F2FE",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#0369A1",
    fontWeight: "600",
    lineHeight: 18,
  },
  resetBtn: {
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
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "800",
  },
  backButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F8FAFC",
  },
  backButtonText: {
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
