import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppScreen from "../../src/components/AppScreen";
import InputField from "../../src/components/InputField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { logoutUser } from "../../src/services/authService";
import { ExpertiseService } from "../../src/services/ExpertiseService";
import { updateUserProfile } from "../../src/services/userService";
import { COLORS } from "../../src/theme/colors";

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();

  // Form States
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [sscYear, setSscYear] = useState("");
  const [sscRoll, setSscRoll] = useState("");
  const [lastEducationInstitute, setLastEducationInstitute] = useState("");
  const [lastEducationDepartment, setLastEducationDepartment] = useState("");
  const [completionYear, setCompletionYear] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState([]);

  // Dynamic Categories State
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);

  // UI States
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = ExpertiseService.subscribeCategories((data) => {
      setExpertiseOptions(data.map((cat) => cat.name));
      setCatsLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setGender(profile.gender || "");
      setSscYear(profile.sscYear ? String(profile.sscYear) : "");
      setSscRoll(profile.sscRoll ? String(profile.sscRoll) : "");
      setLastEducationInstitute(profile.lastEducationInstitute || "");
      setLastEducationDepartment(profile.lastEducationDepartment || "");
      setCompletionYear(
        profile.completionYear ? String(profile.completionYear) : "",
      );
      setJobDescription(profile.jobDescription || "");
      setBio(profile.bio || "");
      setExpertise(profile.expertise || []);
    }
  }, [profile]);

  const toggleExpertise = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpertise((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  };

  const handleSave = async () => {
    if (!phone.trim() || !gender || !sscYear.trim()) {
      Alert.alert(
        "Required Fields",
        "Please fill in Phone, Gender, and SSC Year.",
      );
      return;
    }
    try {
      setLoading(true);
      await updateUserProfile(user.uid, {
        phone: phone.trim(),
        gender,
        sscYear: sscYear.trim(),
        sscRoll: sscRoll.trim(),
        lastEducationInstitute: lastEducationInstitute.trim(),
        lastEducationDepartment: lastEducationDepartment.trim(),
        completionYear: completionYear.trim(),
        jobDescription: jobDescription.trim(),
        bio: bio.trim(),
        expertise,
        profileCompleted: true,
      });
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success 🎉", "Your profile has been saved!");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOptions = expertiseOptions.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const avatarLetter = (profile?.fullName || "F")[0].toUpperCase();

  return (
    <AppScreen backgroundColor="#F8FAFC" edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* MODERN HEADER */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={["#EEF2FF", "#E0E7FF"]}
              style={styles.headerGradient}
            />
            <View style={styles.profileInfoCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarSquircle}>
                  <Text style={styles.avatarText}>{avatarLetter}</Text>
                </View>
              </View>
              <Text style={styles.userNameText}>
                {profile?.fullName || "FRIIAN Member"}
              </Text>
              <Text style={styles.userEmailText}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.bodyContent}>
            {/* CONTACT & IDENTITY */}
            <View style={styles.glassCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionTitle}>Professional Identity</Text>
              </View>

              <InputField
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon="call-outline"
              />

              <Text style={styles.innerLabel}>Gender Identity</Text>
              <View style={styles.genderRow}>
                {["Male", "Female", "Other"].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setGender(opt)}
                    style={[
                      styles.genderBtn,
                      gender === opt && styles.genderBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderBtnText,
                        gender === opt && styles.genderBtnTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <InputField
                label="Current Role"
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="e.g. Senior Architect"
                icon="briefcase-outline"
              />
            </View>

            {/* ACADEMIC */}
            <View style={styles.glassCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="school-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionTitle}>Academic Roots</Text>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1.2, marginRight: 12 }}>
                  <InputField
                    label="SSC Batch"
                    value={sscYear}
                    onChangeText={setSscYear}
                    keyboardType="number-pad"
                    placeholder="Year"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="Roll"
                    value={sscRoll}
                    onChangeText={setSscRoll}
                    placeholder="Roll No"
                  />
                </View>
              </View>
              <InputField
                label="Major/Department"
                value={lastEducationDepartment}
                onChangeText={setLastEducationDepartment}
                icon="layers-outline"
              />
            </View>

            {/* EXPERTISE SECTION - FIXED ROW ALIGNMENT */}
            <View style={styles.glassCard}>
              <View style={styles.rowBetween}>
                <View style={styles.sectionHeaderRowInline}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="flash-outline"
                      size={18}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>Expertise</Text>
                </View>

                <TouchableOpacity
                  style={styles.editBadge}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={14}
                    color={COLORS.primary}
                  />
                  <Text style={styles.editBadgeText}>Manage</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipContainer}>
                {catsLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : expertise.length > 0 ? (
                  expertise.map((item) => (
                    <View key={item} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{item}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.placeholderText}>
                    No skills selected yet...
                  </Text>
                )}
              </View>
            </View>

            {/* BIO */}
            <View style={styles.glassCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionTitle}>Your Story</Text>
              </View>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="Describe your career journey..."
                style={styles.bioInput}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.actionSection}>
              <PrimaryButton
                title="Save Profile"
                onPress={handleSave}
                loading={loading}
              />

              <TouchableOpacity
                style={styles.signOutButton}
                onPress={logoutUser}
              >
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="#fa233c"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL REMAINING THE SAME */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBlur}>
          <View style={styles.modalSheet}>
            <View style={styles.modalIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Expertise</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeCircle}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons
                name="search"
                size={20}
                color="#94A3B8"
                style={{ marginLeft: 15 }}
              />
              <TextInput
                placeholder="Search categories..."
                style={styles.searchTextInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalGrid}
            >
              {filteredOptions.map((item) => {
                const isActive = expertise.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleExpertise(item)}
                    style={[
                      styles.modalItem,
                      isActive && styles.modalItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isActive && styles.modalItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-sharp" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <PrimaryButton
              title="Confirm"
              onPress={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
  headerContainer: { height: 260, position: "relative" },
  headerGradient: {
    height: 180,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileInfoCard: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  avatarContainer: { marginTop: -65, marginBottom: 12 },
  avatarSquircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "900" },
  userNameText: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  userEmailText: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
  bodyContent: { paddingHorizontal: 16, marginTop: 24 },
  glassCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionHeaderRowInline: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  innerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  genderRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  genderBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderBtnText: { fontWeight: "700", fontSize: 13, color: "#64748B" },
  genderBtnTextActive: { color: "#fff" },
  inputRow: { flexDirection: "row" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20, // Matches other sections
  },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 4,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  skillChipText: { color: "#475569", fontWeight: "700", fontSize: 12 },
  placeholderText: { color: "#94A3B8", fontStyle: "italic", fontSize: 13 },
  bioInput: {
    minHeight: 120,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    textAlignVertical: "top",
    color: "#1E293B",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionSection: { marginTop: 10, gap: 12 },
  signOutButton: {
    flexDirection: "row",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  signOutText: {
    color: "#fa233c",
    fontWeight: "800",
    fontSize: 14,
    textTransform: "uppercase",
  },
  modalBlur: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    padding: 24,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    height: 56,
    marginBottom: 20,
  },
  searchTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 30,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalItemText: { fontWeight: "700", color: "#475569", fontSize: 13 },
  modalItemTextActive: { color: "#fff" },
});
