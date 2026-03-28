import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message"; // Ensure this is installed

import AppScreen from "../src/components/AppScreen";
import PrimaryButton from "../src/components/PrimaryButton";
import { useAuth } from "../src/context/AuthContext";
import { sendFeedback } from "../src/services/feedbackService";

export default function ContactScreen() {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert("Wait!", "Please write your opinion first.");
    }

    try {
      setLoading(true);
      await sendFeedback(user.uid, profile.fullName, message);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 1. Show Success Toast
      Toast.show({
        type: "success",
        text1: "Opinion Received! ✨",
        text2: "Thank you for helping us improve.",
        visibilityTime: 3000,
      });

      // 2. Redirect to Home Screen
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: "Please check your internet connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url) => {
    Haptics.selectionAsync();
    Linking.openURL(url);
  };

  return (
    <AppScreen backgroundColor="#F8FAFC">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.subtitle}>
            Your feedback drives our updates. Tell us what you think!
          </Text>
        </View>

        {/* FEEDBACK FORM */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Describe your experience or suggest a feature..."
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#94A3B8"
          />
          <PrimaryButton
            title="Submit Feedback"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>

        <Text style={styles.sectionLabel}>DIRECT CHANNELS</Text>

        <View style={styles.channelList}>
          {/* Email Item */}
          <TouchableOpacity
            style={styles.channelRow}
            onPress={() => openLink("mailto:arifurrahman.now@gmail.com")}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: "#EEF2FF" }]}
            >
              <Ionicons name="mail" size={22} color="#6366F1" />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.channelTitle}>E-mail</Text>
              <Text style={styles.channelValue}>
                arifurrahman.now@gmail.com
              </Text>
            </View>
          </TouchableOpacity>

          {/* WhatsApp Item */}
          <TouchableOpacity
            style={styles.channelRow}
            onPress={() =>
              openLink(
                "https://wa.me/8801684516151?text=Hello%20FRIIANS%20Support",
              )
            }
          >
            <View
              style={[styles.iconContainer, { backgroundColor: "#ECFDF5" }]}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#10B981" />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.channelTitle}>WhatsApp</Text>
              <Text style={styles.channelValue}>+880 1684-516151</Text>
            </View>
          </TouchableOpacity>

          {/* Website Item */}
          <TouchableOpacity
            style={styles.channelRow}
            onPress={() => openLink("https://www.frii.edu.bd")}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: "#FFF7ED" }]}
            >
              <Ionicons name="globe" size={22} color="#F59E0B" />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.channelTitle}>Website</Text>
              <Text style={styles.channelValue}>www.frii.edu.bd</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 10, paddingTop: 20, paddingBottom: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: "900", color: "#0F172A" },
  subtitle: { fontSize: 15, color: "#64748B", marginTop: 6, lineHeight: 22 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 32,
    elevation: 2,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: "#1E293B",
    textAlignVertical: "top",
    minHeight: 140,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    fontWeight: "500",
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  channelList: { gap: 12 },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textColumn: {
    flex: 1,
    justifyContent: "center",
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  channelValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "700",
  },
});
