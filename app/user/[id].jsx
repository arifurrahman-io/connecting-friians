import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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

// --- MODERN INLINE DATA ROW ---
function InfoRow({ label, value, icon, last }) {
  return (
    <View style={[styles.dataRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.labelGroup}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={15} color={COLORS.primary} />
        </View>
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
  const [reportDetails, setReportDetails] = useState("");

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

  // Map Expertise IDs to Names
  const expertises = useMemo(() => {
    if (!profile?.expertise || masterCategories.length === 0) return [];
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
        details: reportDetails.trim(),
      });
      setReportVisible(false);
      setReportReason("");
      setReportDetails("");
      Alert.alert("Success", "Report submitted for review.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit report.");
    } finally {
      setLoadingReport(false);
    }
  };

  if (loading) {
    return (
      <AppScreen backgroundColor="#F8FAFC">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!profile) {
    return (
      <AppScreen backgroundColor="#F8FAFC">
        <View style={styles.center}>
          <Text style={styles.emptyText}>Profile not found.</Text>
        </View>
      </AppScreen>
    );
  }

  const avatarLetter = (profile.fullName || "U")[0].toUpperCase();
  const isOwnProfile = user?.uid === id;

  return (
    <AppScreen backgroundColor="#F8FAFC" edges={["bottom", "left", "right"]}>
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
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[COLORS.primary, "#6366F1"]}
              style={styles.avatarSquircle}
            >
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.userName}>{profile.fullName || "Alumnus"}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>

          {profile.jobDescription && (
            <View style={styles.jobBadge}>
              <Ionicons name="briefcase" size={12} color={COLORS.primary} />
              <Text style={styles.jobBadgeText}>{profile.jobDescription}</Text>
            </View>
          )}
        </View>

        {/* ACADEMIC ROOTS */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Academic Roots</Text>
          <InfoRow label="SSC Batch" icon="calendar" value={profile.sscYear} />
          <InfoRow label="Campus" icon="business" value={profile.campus} />
          <InfoRow label="Gender" icon="person" value={profile.gender} last />
        </View>

        {/* PROFESSIONAL BACKGROUND */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Professional Background</Text>
          <InfoRow
            label="Highest Degree"
            icon="school"
            value={profile.lastEducationDepartment}
          />
          <InfoRow
            label="Current Role"
            icon="briefcase-outline"
            value={profile.jobDescription}
            last
          />
        </View>

        {/* EXPERTISE */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Expertise & Skills</Text>
          <View style={styles.chipGrid}>
            {expertises.length > 0 ? (
              expertises.map((name, i) => (
                <View key={`exp-${i}`} style={styles.skillChip}>
                  <Text style={styles.skillText}>{name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No expertise listed</Text>
            )}
          </View>
        </View>

        {/* BIO */}
        <View style={[styles.card, { paddingBottom: 25 }]}>
          <Text style={styles.cardHeader}>Biography</Text>
          <Text style={styles.bioText}>
            {profile.bio || "No biography provided."}
          </Text>
        </View>

        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.reportAction}
            onPress={() => setReportVisible(true)}
          >
            <Ionicons name="flag" size={14} color="#94A3B8" />
            <Text style={styles.reportActionText}>Report this profile</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* REPORT MODAL */}
      <Modal visible={reportVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Report Profile</Text>
            <InputField
              label="Reason"
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="e.g. Inappropriate content"
            />
            <InputField
              label="Details"
              value={reportDetails}
              onChangeText={setReportDetails}
              placeholder="Additional info..."
              multiline
            />
            <PrimaryButton
              title="Submit Report"
              onPress={handleReport}
              loading={loadingReport}
            />
            <TouchableOpacity
              onPress={() => setReportVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerSection: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 35,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
  },
  headerBg: { ...StyleSheet.absoluteFillObject },
  avatarWrapper: {
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
  avatarSquircle: {
    width: 100,
    height: 100,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 42, fontWeight: "900", color: "#fff" },
  userName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  jobBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 15,
  },
  jobBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary + "30",
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  labelGroup: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F5F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowLabel: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  rowValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    flex: 1,
    textAlign: "right",
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skillChip: {
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "15",
  },
  skillText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  emptyText: { color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  bioText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 26,
    fontWeight: "500",
  },
  reportAction: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 30,
    alignItems: "center",
    gap: 6,
    padding: 12,
  },
  reportActionText: { color: "#94A3B8", fontWeight: "700", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 20,
  },
  cancelBtn: { alignItems: "center", marginTop: 10 },
  cancelBtnText: { color: "#64748B", fontWeight: "800", fontSize: 14 },
});
