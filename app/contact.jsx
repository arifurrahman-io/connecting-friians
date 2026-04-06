import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";

import AppScreen from "../src/components/AppScreen";
import PrimaryButton from "../src/components/PrimaryButton";
import { useAuth } from "../src/context/AuthContext";
import { sendFeedback } from "../src/services/feedbackService";
import { COLORS } from "../src/theme/colors";

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

      Toast.show({
        type: "success",
        text1: "Opinion Received! ✨",
        text2: "Thank you for helping us improve.",
        visibilityTime: 3000,
      });

      setTimeout(() => {
        router.replace("/(tabs)/feed");
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

  // Fixed: Added missing function definition
  const handleOpenDeveloperSite = () => {
    Haptics.selectionAsync();
    Linking.openURL("https://arifurrahman.com.bd");
  };

  return (
    <AppScreen backgroundColor="#F8FAFC">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* HEADER SECTION */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.subtitle}>
            Your feedback drives our updates. Tell us what you think or report
            an issue.
          </Text>
        </Animated.View>

        {/* FEEDBACK FORM CARD */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="chatbubble-ellipses"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.cardHeaderText}>Share your thoughts</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Describe your experience, suggest a feature, or report a bug..."
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#94A3B8"
            textAlignVertical="top"
          />
          <PrimaryButton
            title="Submit Feedback"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(400)}
          style={styles.sectionLabel}
        >
          DIRECT CHANNELS
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(500)}
          style={styles.channelList}
        >
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
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
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
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
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
              <Text style={styles.channelTitle}>Official Website</Text>
              <Text style={styles.channelValue}>www.frii.edu.bd</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </Animated.View>

        {/* Updated Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>Developed by</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenDeveloperSite}
            style={styles.devLink}
          >
            <Text style={styles.devLinkText}>Md Arifur Rahman</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 22,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 35,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
      android: { elevation: 3 },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 18,
    fontSize: 15,
    color: "#1E293B",
    minHeight: 160,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    fontWeight: "500",
  },
  submitBtn: {
    borderRadius: 16,
    height: 56,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 16,
    textTransform: "uppercase",
    paddingLeft: 4,
  },
  channelList: { gap: 14 },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textColumn: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  channelValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "800",
  },
  footerNote: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  footerNoteText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
  },
  devLink: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + "40",
  },
  devLinkText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "800",
  },
});
