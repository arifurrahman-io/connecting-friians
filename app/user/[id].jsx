import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppScreen from "../../src/components/AppScreen";
import InputField from "../../src/components/InputField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { ExpertiseService } from "../../src/services/ExpertiseService";
import { createReport } from "../../src/services/reportService";
import { getUserProfile } from "../../src/services/userService";
import { COLORS } from "../../src/theme/colors";

// --- COMPACT DATA ROW ---
function InfoRow({ label, value, icon }) {
  return (
    <View style={styles.dataRow}>
      <View style={styles.labelGroup}>
        <Ionicons name={icon} size={14} color="#94A3B8" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value || "—"}
      </Text>
    </View>
  );
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [masterCategories, setMasterCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [userData, categories] = await Promise.all([
          getUserProfile(id),
          new Promise((resolve) =>
            ExpertiseService.subscribeCategories(resolve),
          ),
        ]);
        setProfile(userData);
        setMasterCategories(categories);
      } catch (error) {
        Alert.alert("Error", "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const expertises = useMemo(() => {
    if (!profile?.expertise || !masterCategories.length) return [];
    return masterCategories
      .filter((cat) => profile.expertise.includes(cat.id))
      .map((cat) => cat.name);
  }, [profile, masterCategories]);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert("Missing Reason", "Please describe why you are reporting.");
      return;
    }
    try {
      setLoadingReport(true);
      await createReport({
        targetType: "user",
        targetId: id,
        targetOwnerId: id,
        reason: reportReason.trim(),
      });
      setReportVisible(false);
      setReportReason("");
      Alert.alert("Success", "Report submitted for review.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit report.");
    } finally {
      setLoadingReport(false);
    }
  };

  if (loading)
    return (
      <AppScreen backgroundColor="#FDFDFD">
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </AppScreen>
    );

  const avatarLetter = (profile?.fullName || "U")[0].toUpperCase();
  const isOwnProfile = user?.uid === id;

  return (
    <AppScreen backgroundColor="#FDFDFD">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* COMPACT TOP HEADER */}
        <View style={styles.header}>
          <LinearGradient
            colors={["#6366F1", COLORS.primary]}
            style={styles.avatarPill}
          >
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{profile.fullName || "Member"}</Text>
            <Text style={styles.userBatch}>SSC Class of {profile.sscYear}</Text>
          </View>
        </View>

        {/* STATS STRIP */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>CAMPUS</Text>
            <Text style={styles.statValue}>{profile.campus || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>GENDER</Text>
            <Text style={styles.statValue}>{profile.gender || "—"}</Text>
          </View>
        </View>

        {/* INFO SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional info</Text>
          <View style={styles.infoBox}>
            <InfoRow
              label="Current Role"
              icon="briefcase-outline"
              value={profile.jobDescription}
            />
            <InfoRow
              label="Education"
              icon="school-outline"
              value={profile.lastEducationDepartment}
            />
            <InfoRow label="Email" icon="mail-outline" value={profile.email} />
          </View>
        </View>

        {/* EXPERTISE PILLS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.chipRow}>
            {expertises.map((name, i) => (
              <View key={i} style={styles.pill}>
                <Text style={styles.pillText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BIO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biography</Text>
          <Text style={styles.bioText}>
            {profile.bio || "This alumnus prefers to stay mysterious."}
          </Text>
        </View>

        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setReportVisible(true)}
          >
            <Ionicons name="flag-outline" size={12} color="#CBD5E1" />
            <Text style={styles.reportBtnText}>Report Profile</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODERN REPORT MODAL */}
      <Modal visible={reportVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Profile</Text>
              <TouchableOpacity onPress={() => setReportVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>REASON FOR REPORT</Text>
            <InputField
              placeholder="Describe the issue..."
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={4}
              containerStyle={styles.multilineInput}
            />

            <View style={styles.modalFooter}>
              <PrimaryButton
                title="Submit Report"
                onPress={handleReport}
                loading={loadingReport}
                style={styles.mainBtn}
              />
              <TouchableOpacity
                onPress={() => setReportVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  avatarPill: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
  headerInfo: { flex: 1 },
  userName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  userBatch: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },

  statsStrip: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },
  divider: { width: 1, height: "100%", backgroundColor: "#E2E8F0" },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    paddingHorizontal: 12,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  labelGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  rowValue: { fontSize: 13, fontWeight: "700", color: "#1E293B" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  pillText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },

  bioText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    fontWeight: "500",
  },

  reportBtn: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 30,
    alignItems: "center",
    gap: 6,
  },
  reportBtnText: { color: "#CBD5E1", fontWeight: "700", fontSize: 12 },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    padding: 25,
  },
  modalSheet: { backgroundColor: "#fff", borderRadius: 28, padding: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  modalLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingTop: 12,
  },
  modalFooter: { marginTop: 20, gap: 10 },
  mainBtn: { borderRadius: 14, height: 50 },
  closeBtn: { alignItems: "center", paddingVertical: 10 },
  closeBtnText: { color: "#94A3B8", fontWeight: "700", fontSize: 13 },
});
