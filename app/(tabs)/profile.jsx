import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
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
      Alert.alert("Success", "Profile updated.");
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
          {/* PREMIUM HEADER */}
          <View style={styles.headerSection}>
            <LinearGradient
              colors={["#EEF2FF", "#F8FAFC"]}
              style={styles.headerBg}
            />
            <View style={styles.headerContent}>
              {/* <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={[COLORS.primary, "#6366F1"]}
                  style={styles.avatarSquircle}
                >
                  <Text style={styles.avatarText}>{avatarLetter}</Text>
                </LinearGradient>
              </View> */}
              <Text style={styles.userName}>
                {profile?.fullName || "Alumnus"}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {/* PERSONAL INFORMATION */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Contact & Identity</Text>
              <InputField
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Gender</Text>
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
                label="Current Role"
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="e.g. Senior Architect"
              />
            </View>

            {/* ACADEMIC BACKGROUND */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Education</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <InputField
                    label="SSC Year"
                    value={sscYear}
                    onChangeText={setSscYear}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="SSC Roll"
                    value={sscRoll}
                    onChangeText={setSscRoll}
                  />
                </View>
              </View>
              <InputField
                label="Latest Institute"
                value={lastEducationInstitute}
                onChangeText={setLastEducationInstitute}
              />
              <InputField
                label="Department"
                value={lastEducationDepartment}
                onChangeText={setLastEducationDepartment}
              />
            </View>

            {/* EXPERTISE CHIPS */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardLabel}>Expertise & Skills</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <Text style={styles.viewAllBtn}>Edit Skills</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipGrid}>
                {expertise.length > 0 ? (
                  expertise.map((item) => (
                    <View key={item} style={styles.activeChip}>
                      <Text style={styles.activeChipText}>{item}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No skills added yet</Text>
                )}
              </View>
            </View>

            {/* BIO */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Biography</Text>
              <InputField
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                placeholder="Tell us about yourself..."
              />
            </View>

            {/* ACTIONS */}
            <View style={styles.footerActions}>
              <PrimaryButton
                title="Save Changes"
                onPress={handleSave}
                loading={loading}
              />
              <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
                <Ionicons name="log-out-outline" size={20} color="#94A3B8" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SEARCH MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Skills & Expertise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                placeholder="Search skills..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalChipGrid}>
                {filteredOptions.map((item) => {
                  const isActive = expertise.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleExpertise(item)}
                      style={[
                        styles.modalChip,
                        isActive && styles.modalChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          isActive && styles.modalChipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <PrimaryButton
              title="Done"
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
  headerSection: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 5,
    shadowOpacity: 0.05,
  },
  headerBg: { ...StyleSheet.absoluteFillObject },
  avatarWrapper: {
    marginBottom: 15,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  avatarSquircle: {
    width: 100,
    height: 100,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 40, fontWeight: "800", color: "#fff" },
  userName: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  userEmail: { fontSize: 14, color: "#64748B", marginTop: 4 },

  formContainer: { paddingHorizontal: 0, marginTop: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
  },

  row: { flexDirection: "row" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  genderRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  genderBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderBtnText: { fontWeight: "700", color: "#475569" },
  genderBtnTextActive: { color: "#fff" },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  activeChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeChipText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  viewAllBtn: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  emptyText: { color: "#94A3B8", fontStyle: "italic" },

  footerActions: { marginTop: 10, alignItems: "center" },
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 20 },
  logoutText: {
    marginLeft: 8,
    color: "#94A3B8",
    fontWeight: "700",
    fontSize: 15,
  },

  // Modal
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
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  modalScroll: { paddingBottom: 20 },
  modalChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  modalChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  modalChipActive: { backgroundColor: COLORS.primary },
  modalChipText: { fontWeight: "600", color: "#475569" },
  modalChipTextActive: { color: "#fff" },
});
