import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
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
import { EXPERTISE_OPTIONS } from "../../src/data/expertise";
import { logoutUser } from "../../src/services/authService";
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

  // UI States
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      Alert.alert("Success 🎉", "Your profile has been polished and saved!");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOptions = EXPERTISE_OPTIONS.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const avatarLetter = (profile?.fullName || "F")[0].toUpperCase();

  const SectionHeader = ({ icon, title }) => (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

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
              colors={["#f0f0f0", "#f0f0f0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            />
            <View style={styles.profileInfoCard}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={["#FFFFFF", "#F1F5F9"]}
                  style={styles.avatarBorder}
                >
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{avatarLetter}</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.userNameText}>
                {profile?.fullName || "Connect Alumnus"}
              </Text>
              <Text style={styles.userEmailText}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.bodyContent}>
            {/* CONTACT & IDENTITY */}
            <View style={styles.glassCard}>
              <SectionHeader
                icon="person-circle-outline"
                title="Professional Identity"
              />
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
                label="Current Professional Role"
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="e.g. Software Engineer at Google"
                icon="briefcase-outline"
              />
            </View>

            {/* ACADEMIC */}
            <View style={styles.glassCard}>
              <SectionHeader icon="school-outline" title="Academic Roots" />
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
                    placeholder="000000"
                  />
                </View>
              </View>
              <InputField
                label="Latest Institute"
                value={lastEducationInstitute}
                onChangeText={setLastEducationInstitute}
                icon="business-outline"
              />
              <InputField
                label="Major/Department"
                value={lastEducationDepartment}
                onChangeText={setLastEducationDepartment}
                icon="layers-outline"
              />
            </View>

            {/* SKILLS */}
            <View style={styles.glassCard}>
              <View style={styles.rowBetween}>
                <SectionHeader icon="flash-outline" title="Expertise" />
                <TouchableOpacity
                  style={styles.editBadge}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="pencil" size={12} color={COLORS.primary} />
                  <Text style={styles.editBadgeText}>Update</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipContainer}>
                {expertise.length > 0 ? (
                  expertise.map((item) => (
                    <LinearGradient
                      key={item}
                      colors={["#F1F5F9", "#E2E8F0"]}
                      style={styles.skillChip}
                    >
                      <Text style={styles.skillChipText}>{item}</Text>
                    </LinearGradient>
                  ))
                ) : (
                  <Text style={styles.placeholderText}>
                    No skills highlighted yet...
                  </Text>
                )}
              </View>
            </View>

            {/* BIO */}
            <View style={styles.glassCard}>
              <SectionHeader icon="document-text-outline" title="Your Story" />
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="Write a short professional bio..."
                style={styles.bioInput}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* BUTTONS */}
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
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SKILLS MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBlur}>
          <View style={styles.modalSheet}>
            <View style={styles.modalIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Skills</Text>
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
                placeholder="Search expertise..."
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

            <PrimaryButton
              title="Confirm Selection"
              onPress={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  headerContainer: { height: 260, position: "relative" },
  headerGradient: {
    height: 180,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileInfoCard: {
    position: "absolute",
    bottom: 0,
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  avatarContainer: { marginTop: -60, marginBottom: 12 },
  avatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 30,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  userNameText: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  userEmailText: { fontSize: 14, color: "#64748B", marginTop: 2 },

  bodyContent: { paddingHorizontal: 0, marginTop: 24 },
  glassCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },

  innerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
  },
  genderRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  genderBtn: {
    flex: 1,
    height: 45,
    borderRadius: 12,
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
  genderBtnText: { fontWeight: "600", color: "#64748B" },
  genderBtnTextActive: { color: "#fff" },

  inputRow: { flexDirection: "row" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  editBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 4,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  skillChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  skillChipText: { color: "#475569", fontWeight: "600", fontSize: 13 },
  placeholderText: { color: "#94A3B8", fontStyle: "italic", fontSize: 13 },

  bioInput: {
    minHeight: 100,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 15,
    textAlignVertical: "top",
    color: "#1E293B",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  actionSection: { marginTop: 10, gap: 10 },
  signOutButton: { height: 55, justifyContent: "center", alignItems: "center" },
  signOutText: { color: "#94A3B8", fontWeight: "700", fontSize: 15 },

  // Modal
  modalBlur: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    height: "85%",
    padding: 25,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
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
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    height: 55,
    marginBottom: 20,
  },
  searchTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
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
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
  },
  modalItemActive: { backgroundColor: COLORS.primary },
  modalItemText: { fontWeight: "600", color: "#475569" },
  modalItemTextActive: { color: "#fff" },
});
