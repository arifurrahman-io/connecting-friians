import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
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
  const [campus, setCampus] = useState("");
  const [lastEducationDepartment, setLastEducationDepartment] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [bio, setBio] = useState("");
  const [expertiseIds, setExpertiseIds] = useState([]);

  // UI States
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // Fixed: set to false initially
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = ExpertiseService.subscribeCategories((data) => {
      setExpertiseOptions(data);
      setCatsLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setGender(profile.gender || "");
      setSscYear(profile.sscYear ? String(profile.sscYear) : "");
      setCampus(profile.campus || "");
      setLastEducationDepartment(profile.lastEducationDepartment || "");
      setJobDescription(profile.jobDescription || "");
      setBio(profile.bio || "");
      setExpertiseIds(profile.expertise || []);
    }
  }, [profile]);

  const toggleExpertise = (catId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpertiseIds((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    );
  };

  const handleSave = async () => {
    if (!phone.trim() || !gender || !sscYear.trim() || !campus) {
      Alert.alert(
        "Required Fields",
        "Please fill in Phone, Gender, Batch, and Campus.",
      );
      return;
    }
    try {
      setLoading(true);
      await updateUserProfile(user.uid, {
        phone: phone.trim(),
        gender,
        sscYear: sscYear.trim(),
        campus,
        lastEducationDepartment: lastEducationDepartment.trim(),
        jobDescription: jobDescription.trim(),
        bio: bio.trim(),
        expertise: expertiseIds,
        profileCompleted: true,
      });
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success 🎉", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOptions = expertiseOptions.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedExpertiseNames = expertiseOptions.filter((opt) =>
    expertiseIds.includes(opt.id),
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
          {/* HEADER */}
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
            {/* PROFESSIONAL IDENTITY */}
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
                {["Male", "Female"].map((opt) => (
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
                label="Current Designation"
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="e.g. Senior Software Engineer"
                icon="briefcase-outline"
              />
            </View>

            {/* ACADEMIC ROOTS */}
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
                <View style={{ flex: 1, marginRight: 12 }}>
                  <InputField
                    label="SSC Batch"
                    value={sscYear}
                    onChangeText={setSscYear}
                    keyboardType="number-pad"
                    placeholder="Year"
                  />
                </View>
                <View style={{ flex: 1.5, marginBottom: 15 }}>
                  <Text style={styles.label}>Campus</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={campus}
                      onValueChange={(v) => setCampus(v)}
                      style={styles.picker}
                      dropdownIconColor="#0F172A"
                    >
                      <Picker.Item
                        label="Select Campus"
                        value=""
                        color="#94A3B8"
                      />
                      <Picker.Item label="Banasree" value="Banasree" />
                      <Picker.Item label="Malibag" value="Malibag" />
                      <Picker.Item label="Mohammadpur" value="Mohammadpur" />
                    </Picker>
                  </View>
                </View>
              </View>
              <InputField
                label="Highest Degree & Institute"
                value={lastEducationDepartment}
                onChangeText={setLastEducationDepartment}
                icon="layers-outline"
                placeholder="e.g. B.Sc. in CSE, DU"
              />
            </View>

            {/* EXPERTISE */}
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
                ) : selectedExpertiseNames.length > 0 ? (
                  selectedExpertiseNames.map((item) => (
                    <View key={item.id} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{item.name}</Text>
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
                <Text style={styles.sectionTitle}>Describe Yourself</Text>
              </View>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="Describe your professional journey..."
                style={styles.bioInput}
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
              />
            </View>

            {/* ACTIONS */}
            <View style={styles.actionSection}>
              <PrimaryButton
                title="Save Profile"
                onPress={handleSave}
                loading={loading}
              />
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={() => {
                  Alert.alert("Sign Out", "Are you sure?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Sign Out",
                      style: "destructive",
                      onPress: logoutUser,
                    },
                  ]);
                }}
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

      {/* CENTRAL EXPERTISE MODAL (Bottom Sheet Style) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Expertise</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeCircle}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons
                name="search"
                size={18}
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
                const isActive = expertiseIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleExpertise(item.id)}
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
                      {item.name}
                    </Text>
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <PrimaryButton
                title="Confirm Selection"
                onPress={() => setModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 60 },
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
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  avatarContainer: { marginTop: -65, marginBottom: 12 },
  avatarSquircle: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#FFF",
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "900" },
  userNameText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  userEmailText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "600",
  },
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
  sectionHeaderRowInline: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F5F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  innerLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  genderRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  genderBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
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
  genderBtnText: { fontWeight: "800", fontSize: 13, color: "#64748B" },
  genderBtnTextActive: { color: "#fff" },
  inputRow: { flexDirection: "row", alignItems: "center" },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  pickerContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  picker: { height: 50, width: "100%", color: "#0F172A" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
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
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
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
    color: "#1E293B",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontWeight: "500",
  },
  actionSection: { marginTop: 10, gap: 12, paddingBottom: 40 },
  signOutButton: {
    flexDirection: "row",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  signOutText: {
    color: "#fa233c",
    fontWeight: "900",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // MODAL STYLES
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "80%",
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    height: 52,
    marginBottom: 20,
  },
  searchTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 20,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalItemText: { fontWeight: "800", color: "#64748B", fontSize: 13 },
  modalItemTextActive: { color: "#fff" },
  modalFooter: { paddingTop: 20, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
});
