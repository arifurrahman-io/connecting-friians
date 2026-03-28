import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { sendEmailVerification } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import AppScreen from "../src/components/AppScreen";
import PrimaryButton from "../src/components/PrimaryButton";
import { useAuth } from "../src/context/AuthContext";
import { auth } from "../src/firebase/config";
import { COLORS } from "../src/theme/colors";

export default function VerifyEmailScreen() {
  const { user, refreshProfile, logoutUser } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Timer logic for Resend Cooldown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRefreshStatus = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // reload() pulls fresh data from Firebase servers
      await auth.currentUser.reload();
      await refreshProfile();

      if (auth.currentUser.emailVerified) {
        Toast.show({
          type: "success",
          text1: "Email Verified! 🎉",
          text2: "Welcome to the FRIIANS community.",
        });
        router.replace("/(tabs)");
      } else {
        Toast.show({
          type: "info",
          text1: "Not verified yet",
          text2: "Please click the link in your inbox or spam.",
        });
      }
    } catch (error) {
      Alert.alert("Error", "Could not refresh status.");
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setCountdown(60); // 60 second cooldown
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Link Sent!",
        text2: "Check your inbox and spam folder.",
      });
    } catch (error) {
      Alert.alert("Rate Limit", "Please wait a moment before trying again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AppScreen backgroundColor="#FFFFFF">
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#F8FAFC", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        {/* ICON SECTION */}
        <View style={styles.headerArea}>
          <View style={styles.iconSquircle}>
            <LinearGradient
              colors={[COLORS.primary, "#4F46E5"]}
              style={styles.iconGradient}
            >
              <Ionicons name="mail-open" size={44} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Confirm Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to:{"\n"}
            <Text style={styles.emailText}>{user?.email}</Text>
          </Text>
        </View>

        {/* INSTRUCTION CARD */}
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Open your email inbox or spam folder
            </Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Tap the verification link we sent
            </Text>
          </View>
          <View style={[styles.stepRow, { borderBottomWidth: 0 }]}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <Text style={styles.stepText}>Return here and tap below</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.footer}>
          <PrimaryButton
            title="I've Verified My Email"
            onPress={handleRefreshStatus}
            style={styles.mainBtn}
          />

          <TouchableOpacity
            style={[styles.resendBtn, countdown > 0 && styles.disabledBtn]}
            onPress={handleResendEmail}
            disabled={isResending || countdown > 0}
          >
            <Text style={styles.resendText}>
              {countdown > 0
                ? `Resend available in ${countdown}s`
                : "Didn't get the email? Resend"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
            <Ionicons name="arrow-back" size={16} color="#94A3B8" />
            <Text style={styles.logoutText}>Use a different account</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconSquircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  iconGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  emailText: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 40,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  stepText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  footer: {
    gap: 15,
  },
  mainBtn: {
    height: 58,
    borderRadius: 18,
  },
  resendBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
});
