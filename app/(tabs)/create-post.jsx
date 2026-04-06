import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import AppScreen from "../../src/components/AppScreen";
import InputField from "../../src/components/InputField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { ExpertiseService } from "../../src/services/ExpertiseService";
import { createPost } from "../../src/services/postService";
import { COLORS } from "../../src/theme/colors";

export default function CreatePostScreen() {
  const { user, profile } = useAuth();

  // Form States
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null); // Now stores {id, name}
  const [loading, setLoading] = useState(false);

  // Dynamic Expertise States
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);

  // Search Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Dynamic Categories from Firestore (ID + Name)
  useEffect(() => {
    const unsub = ExpertiseService.subscribeCategories((data) => {
      setExpertiseOptions(data); // data is now [{id, name, slug}, ...]
      setCatsLoading(false);
    });
    return unsub;
  }, []);

  // Logic: Dynamic chip selection from Firestore data
  const visibleOptions = useMemo(() => {
    if (expertiseOptions.length === 0) return [];

    const defaultSelection = expertiseOptions.slice(0, 7);
    if (
      selectedCategory &&
      !defaultSelection.find((c) => c.id === selectedCategory.id)
    ) {
      return [selectedCategory, ...expertiseOptions.slice(0, 6)];
    }
    return defaultSelection;
  }, [selectedCategory, expertiseOptions]);

  const filteredOptions = expertiseOptions.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!profile?.profileCompleted) {
      Alert.alert("Action Required", "Please complete your profile first.");
      return;
    }
    if (!title.trim() || !body.trim() || !selectedCategory) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      // Pass the Unique ID and Name separately
      await createPost({
        authorId: user.uid,
        authorName: profile.fullName || "FRIIAN Member",
        title: title.trim(),
        body: body.trim(),
        primaryExpertiseName: selectedCategory.name,
        primaryExpertiseId: selectedCategory.id, // THE UNIQUE DOCUMENT ID
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: "success",
        text1: "Post Published! 🚀",
        text2: `Experts in ${selectedCategory.name} have been notified.`,
        position: "top",
        visibilityTime: 3000,
      });

      // Reset Form
      setTitle("");
      setBody("");
      setSelectedCategory(null);

      // Navigate to feed and clear the creation stack
      setTimeout(() => {
        router.replace("/(tabs)/feed");
      }, 600);
    } catch (error) {
      console.error(error);
      Alert.alert("Publishing Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen backgroundColor="#F8FAFC" edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* HEADER */}
          <View style={styles.headerSection}>
            <LinearGradient
              colors={["#EEF2FF", "#F8FAFC"]}
              style={styles.headerBg}
            />
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>New Request</Text>
                <Text style={styles.headerSubtitle}>
                  Seek guidance from the community
                </Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="add-circle" size={28} color={COLORS.primary} />
              </View>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.cardLabel}>Problem Title</Text>
              <InputField
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Need advice on career growth"
                containerStyle={styles.noMarginInput}
                maxLength={120}
              />
              <Text style={styles.charCount}>{title.length}/120</Text>

              <View style={styles.spacer} />

              <Text style={styles.cardLabel}>Detailed Description</Text>
              <InputField
                value={body}
                onChangeText={setBody}
                placeholder="Describe your situation in detail..."
                multiline
                numberOfLines={5}
                containerStyle={styles.noMarginInput}
                maxLength={3000}
              />
              <Text style={styles.charCount}>{body.length}/3000</Text>
            </View>

            {/* CATEGORY SELECTOR */}
            <View style={styles.expertiseSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.cardLabel}>Category</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <Text style={styles.viewAllBtn}>Search All</Text>
                </TouchableOpacity>
              </View>

              {catsLoading ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ alignSelf: "flex-start" }}
                />
              ) : (
                <View style={styles.chipGrid}>
                  {visibleOptions.map((item) => {
                    const isActive = selectedCategory?.id === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setSelectedCategory(item)}
                        style={[
                          styles.skillChip,
                          isActive && styles.skillChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.skillText,
                            isActive && styles.skillTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.moreChip}
                    onPress={() => setModalVisible(true)}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ACTION FOOTER */}
            <View style={styles.publishAction}>
              <LinearGradient
                colors={["#FFFFFF", "#F1F5F9"]}
                style={styles.publishGradient}
              >
                <View style={styles.infoRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#64748B"
                  />
                  <Text style={styles.infoText}>
                    Alumni specialized in{" "}
                    <Text style={styles.highlightText}>
                      {selectedCategory?.name || "this category"}
                    </Text>{" "}
                    will receive an in-app alert.
                  </Text>
                </View>
                <PrimaryButton
                  title="Publish Request"
                  onPress={handleCreate}
                  loading={loading}
                  style={styles.mainBtn}
                />
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SEARCH MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery("");
                }}
              >
                <Ionicons name="close-circle" size={28} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                placeholder="Search categories..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalChipGrid}>
                {filteredOptions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.skillChip,
                      selectedCategory?.id === item.id &&
                        styles.skillChipActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(item);
                      setModalVisible(false);
                      setSearchQuery("");
                    }}
                  >
                    <Text
                      style={[
                        styles.skillText,
                        selectedCategory?.id === item.id &&
                          styles.skillTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 20 },
  headerSection: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerBg: { ...StyleSheet.absoluteFillObject },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#1E293B" },
  headerSubtitle: { fontSize: 14, color: "#64748B", marginTop: 2 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  formContainer: { paddingHorizontal: 16, marginTop: 20 },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  noMarginInput: { marginBottom: 4 },
  charCount: { fontSize: 11, color: "#CBD5E1", textAlign: "right" },
  spacer: { height: 20 },
  expertiseSection: { marginTop: 20 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllBtn: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  skillChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 3,
  },
  skillText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  skillTextActive: { color: "#fff" },
  moreChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  publishAction: {
    marginTop: 25,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  publishGradient: { padding: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
    marginLeft: 10,
    lineHeight: 18,
  },
  highlightText: { fontWeight: "700", color: COLORS.primary },
  mainBtn: { borderRadius: 16, height: 56 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "80%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: "#1E293B" },
  modalScroll: { paddingBottom: 40 },
  modalChipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
});
