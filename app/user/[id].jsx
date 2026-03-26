import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const data = await getUserProfile(id);
        if (mounted) {
          setProfile(data);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert("Error", "Unable to load profile.");
          setLoading(false);
        }
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert(
        "Missing Reason",
        "Please describe why you are reporting this profile.",
      );
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

  const avatarLetter = (profile.fullName ||
    profile.name ||
    "U")[0].toUpperCase();
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

          <Text style={styles.userName}>
            {profile.fullName || profile.name || "Alumnus"}
          </Text>
          <Text style={styles.userEmail}>{profile.email}</Text>

          {profile.jobDescription ? (
            <View style={styles.jobBadge}>
              <Ionicons name="briefcase" size={12} color={COLORS.primary} />
              <Text style={styles.jobBadgeText}>{profile.jobDescription}</Text>
            </View>
          ) : null}
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
            {profile.expertise && profile.expertise.length > 0 ? (
              profile.expertise.map((item, i) => (
                <View key={`exp-${i}`} style={styles.skillChip}>
                  <Text style={styles.skillText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No expertise listed</Text>
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
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerBg: { ...StyleSheet.absoluteFillObject },
  avatarWrapper: {
    marginBottom: 15,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarSquircle: {
    width: 90,
    height: 90,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#fff" },
  userName: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  userEmail: { fontSize: 14, color: "#64748B", marginTop: 2 },
  jobBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  jobBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
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
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    textAlign: "right",
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },
  emptyText: { color: "#94A3B8", fontSize: 13 },
  bioText: { fontSize: 14, color: "#475569", lineHeight: 22 },
  reportAction: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 25,
    alignItems: "center",
    padding: 10,
  },
  reportActionText: {
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 6,
  },
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
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 15,
  },
  cancelBtn: { alignItems: "center", padding: 15 },
  cancelBtnText: { color: "#64748B", fontWeight: "700" },
});
