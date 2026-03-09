import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
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
import { createReport } from "../../src/services/reportService";
import { getUserProfile } from "../../src/services/userService";
import { COLORS } from "../../src/theme/colors";

// --- MODERN INLINE DATA ROW (READ ONLY) ---
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
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const data = await getUserProfile(id);
        if (mounted) setProfile(data);
      } catch (error) {
        Alert.alert("Failed", "Unable to load profile.");
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert("Missing reason", "Please enter a reason.");
      return;
    }
    try {
      setLoadingReport(true);
      await createReport({
        targetType: "user",
        targetId: id,
        targetOwnerId: id,
        reason: "other",
        details: `Reason: ${reportReason}\nDetails: ${reportDetails}`,
      });
      setReportVisible(false);
      Alert.alert("Success", "Report submitted.");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingReport(false);
    }
  };

  if (!profile)
    return (
      <AppScreen backgroundColor="#F8FAFC">
        <View style={styles.center}>
          <Text>Loading profile...</Text>
        </View>
      </AppScreen>
    );

  const avatarLetter = (profile.fullName || "F")[0].toUpperCase();
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

          {/* <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[COLORS.primary, "#6366F1"]}
              style={styles.avatarSquircle}
            >
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </LinearGradient>
          </View> */}

          <Text style={styles.userName}>
            {profile.fullName || "FRIIAN Member"}
          </Text>
          <Text style={styles.userEmail}>{profile.email}</Text>

          {profile.jobDescription && (
            <View style={styles.jobBadge}>
              <Ionicons name="briefcase" size={12} color={COLORS.primary} />
              <Text style={styles.jobBadgeText}>{profile.jobDescription}</Text>
            </View>
          )}
        </View>

        {/* PERSONAL TABLE */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Personal Details</Text>
          <InfoRow label="SSC Batch" icon="calendar" value={profile.sscYear} />
          <InfoRow label="Gender" icon="person" value={profile.gender} last />
        </View>

        {/* EDUCATION TABLE */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Academic Background</Text>
          <InfoRow
            label="Institute"
            icon="business"
            value={profile.lastEducationInstitute}
          />
          <InfoRow
            label="Department"
            icon="book"
            value={profile.lastEducationDepartment}
          />
          <InfoRow
            label="Completed"
            icon="time"
            value={profile.completionYear}
            last
          />
        </View>

        {/* EXPERTISE */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Expertise</Text>
          <View style={styles.chipGrid}>
            {profile.expertise?.length > 0 ? (
              profile.expertise.map((item, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No skills listed</Text>
            )}
          </View>
        </View>

        {/* BIO */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Biography</Text>
          <Text style={styles.bioText}>
            {profile.bio || "No biography provided."}
          </Text>
        </View>

        {/* REPORT ACTION */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.reportAction}
            onPress={() => setReportVisible(true)}
          >
            <Ionicons name="flag" size={16} color="#94A3B8" />
            <Text style={styles.reportActionText}>Report this profile</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* REPORT MODAL */}
      <Modal visible={reportVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
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
  scrollContent: { paddingBottom: 40, paddingTop: 0 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  headerSection: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerBg: { ...StyleSheet.absoluteFillObject },
  avatarWrapper: {
    marginBottom: 15,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  avatarSquircle: {
    width: 100,
    height: 100,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 40, fontWeight: "800", color: "#fff" },
  userName: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  userEmail: { fontSize: 14, color: "#64748B", marginTop: 4 },
  jobBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 12,
  },
  jobBadgeText: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },

  // Data Table Cards
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 0,
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
  },

  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  labelGroup: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowLabel: { fontSize: 15, fontWeight: "600", color: "#475569" },
  rowValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    textAlign: "right",
    marginLeft: 20,
  },

  // Expertise & Bio
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  emptyText: { color: "#94A3B8", fontStyle: "italic" },
  bioText: { fontSize: 15, color: "#475569", lineHeight: 24 },

  // Report Action
  reportAction: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 30,
    alignItems: "center",
    padding: 10,
  },
  reportActionText: {
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 20,
  },
  cancelBtn: { alignItems: "center", padding: 15 },
  cancelBtnText: { color: "#64748B", fontWeight: "700" },
});
