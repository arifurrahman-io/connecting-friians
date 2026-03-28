import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

import { db } from "../../src/firebase/config";
import { AdminService } from "../../src/services/AdminService";
import { ExpertiseService } from "../../src/services/ExpertiseService";
import { subscribeToFeedback } from "../../src/services/feedbackService";
import { COLORS } from "../../src/theme/colors";
import { formatTimeAgo } from "../../src/utils/timeAgo";

// --- SUB-COMPONENT: USER ROW ---
const UserManagementRow = ({ user, onToggleBlock, isProcessing }) => {
  const isBlocked = user.status === "blocked" || user.status === "banned";
  return (
    <Animated.View entering={FadeInDown} style={styles.userRow}>
      <View style={styles.avatarMini}>
        <Text style={styles.avatarMiniText}>
          {(user.fullName || "U")[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.fullName || "Unnamed User"}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.statusBtn,
          isBlocked ? styles.unblockBtn : styles.blockBtn,
        ]}
        onPress={() => onToggleBlock(user.id, !isBlocked)}
        disabled={isProcessing}
      >
        <Ionicons
          name={isBlocked ? "lock-open-outline" : "ban-outline"}
          size={14}
          color={isBlocked ? "#10B981" : "#EF4444"}
        />
        <Text
          style={[
            styles.statusBtnText,
            { color: isBlocked ? "#10B981" : "#EF4444" },
          ]}
        >
          {isBlocked ? "Unblock" : "Block"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- SUB-COMPONENT: EXPANDABLE FEEDBACK CARD ---
const FeedbackCard = ({ item, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(!expanded);
      }}
    >
      <Animated.View
        layout={Layout.springify()}
        entering={FadeInUp}
        exiting={FadeOut}
        style={[styles.glassCard, expanded && styles.expandedCard]}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userNameSmall}>{item.fullName}</Text>
            <Text style={styles.userEmailSmall}>
              {item.email || "No Email Provided"}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        <Text
          style={[styles.opinionMsg, expanded && { lineHeight: 22 }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {item.message}
        </Text>

        {expanded && (
          <Animated.View entering={FadeInUp} style={styles.expandedFooter}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.deleteFeedbackBtn}
              onPress={() => onDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.deleteFeedbackText}>Delete Opinion</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("reports");

  // Data States
  const [reports, setReports] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // Category Management States
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubReports = onSnapshot(
      query(collection(db, "reports"), where("status", "==", "open")),
      (snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const unsubUsers = onSnapshot(
      query(collection(db, "users"), orderBy("fullName"), limit(100)),
      (snap) => setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const unsubCats = ExpertiseService.subscribeCategories(setCategories);
    const unsubFeedback = subscribeToFeedback(setFeedbacks);

    setLoading(false);

    return () => {
      unsubReports();
      unsubUsers();
      unsubCats();
      unsubFeedback();
    };
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsProcessing(true);
    try {
      await ExpertiseService.addCategory(newCatName.trim());
      setNewCatName("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: "success", text1: "Category Added" });
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditing = (item) => {
    setEditingCatId(item.id);
    setEditingName(item.name);
  };

  const submitEdit = async (id) => {
    if (!editingName.trim()) return;
    try {
      setIsProcessing(true);
      await ExpertiseService.updateCategory(id, editingName.trim());
      setEditingCatId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Toast.show({ type: "success", text1: "Updated Skill" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCategory = (id, name) => {
    Alert.alert("Remove Skill", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => ExpertiseService.deleteCategory(id),
      },
    ]);
  };

  const handleToggleUserStatus = async (userId, shouldBlock) => {
    setIsProcessing(true);
    try {
      await AdminService.toggleUserBlock(userId, shouldBlock);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteFeedback = (id) => {
    Alert.alert("Delete Opinion", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await AdminService.deleteFeedback(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({ type: "success", text1: "Opinion Deleted" });
          } catch (e) {
            Toast.show({ type: "error", text1: "Failed to delete" });
          }
        },
      },
    ]);
  };

  const filteredUsers = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [allUsers, searchQuery],
  );

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Management</Text>
          <Text style={styles.headerSub}>Admin Controls & Operations</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
          <Text style={styles.headerBadgeText}>SECURE</Text>
        </View>
      </View>

      <View style={styles.statsOverview}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: "#EF4444" }]}>
            {reports.length}
          </Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={[styles.statBox, styles.borderLeft]}>
          <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
            {feedbacks.length}
          </Text>
          <Text style={styles.statLabel}>Opinions</Text>
        </View>
        <View style={[styles.statBox, styles.borderLeft]}>
          <Text style={styles.statNumber}>{allUsers.length}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={[styles.statBox, styles.borderLeft]}>
          <Text style={[styles.statNumber, { color: COLORS.primary }]}>
            {categories.length}
          </Text>
          <Text style={styles.statLabel}>Skills</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
      >
        {[
          { id: "reports", icon: "alert-circle", label: "Reports" },
          { id: "feedback", icon: "chatbubble-ellipses", label: "Opinions" },
          { id: "users", icon: "people", label: "Members" },
          { id: "categories", icon: "flask", label: "Skills" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => {
              setActiveTab(tab.id);
              Haptics.selectionAsync();
            }}
            style={[styles.tabButton, activeTab === tab.id && styles.tabActive]}
          >
            <Ionicons
              name={tab.icon + (activeTab === tab.id ? "" : "-outline")}
              size={16}
              color={activeTab === tab.id ? "#FFF" : "#64748B"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.id && styles.tabActiveText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {activeTab === "reports" && (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Animated.View entering={FadeInUp} style={styles.glassCard}>
                <View style={styles.cardTop}>
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertText}>{item.reason}</Text>
                  </View>
                  <Text style={styles.timeText}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>
                <Text style={styles.opinionMsg}>"{item.details}"</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.cardBtn, styles.btnOutline]}
                    onPress={() => AdminService.dismissReport(item.id)}
                  >
                    <Text style={styles.btnOutlineText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardBtn, styles.btnSolid]}
                    onPress={() => AdminService.deleteReportedContent(item)}
                  >
                    <Text style={styles.btnSolidText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No pending alerts.</Text>
            }
          />
        )}

        {activeTab === "feedback" && (
          <FlatList
            data={feedbacks}
            keyExtractor={(item) => item.id}
            itemLayoutAnimation={Layout.springify()}
            renderItem={({ item }) => (
              <FeedbackCard item={item} onDelete={handleDeleteFeedback} />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Waiting for user opinions...</Text>
            }
          />
        )}

        {activeTab === "users" && (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                placeholder="Find member..."
                style={styles.searchBox}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94A3B8"
              />
            </View>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserManagementRow
                  user={item}
                  onToggleBlock={handleToggleUserStatus}
                  isProcessing={isProcessing}
                />
              )}
            />
          </View>
        )}

        {activeTab === "categories" && (
          <View style={{ flex: 1 }}>
            <View style={styles.addInputRow}>
              <TextInput
                placeholder="New Skill Name..."
                style={styles.categoryInput}
                value={newCatName}
                onChangeText={setNewCatName}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.plusBtn}
                onPress={handleAddCategory}
                disabled={isProcessing}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.categoryCard}>
                  {editingCatId === item.id ? (
                    <View style={styles.inlineEditRow}>
                      <TextInput
                        style={styles.inlineInput}
                        value={editingName}
                        onChangeText={setEditingName}
                        autoFocus
                      />
                      <View style={styles.editActions}>
                        <TouchableOpacity onPress={() => submitEdit(item.id)}>
                          <Ionicons
                            name="checkmark-circle"
                            size={26}
                            color="#10B981"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingCatId(null)}>
                          <Ionicons
                            name="close-circle"
                            size={26}
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.catDisplayRow}>
                      <Text style={styles.categoryName}>{item.name}</Text>
                      <View style={styles.catRight}>
                        <TouchableOpacity
                          onPress={() => startEditing(item)}
                          style={styles.iconBtn}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteCategory(item.id, item.name)
                          }
                          style={styles.iconBtn}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        )}
      </View>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#0F172A" },
  headerSub: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: -2,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerBadgeText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  statsOverview: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 25,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  borderLeft: { borderLeftWidth: 1, borderColor: "#F1F5F9" },
  statNumber: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 2,
  },
  tabScroll: { flexGrow: 0, marginBottom: 20 },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginLeft: 8,
  },
  tabActiveText: { color: "#FFF" },
  glassCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  alertBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EF4444",
    textTransform: "uppercase",
  },
  timeText: { fontSize: 11, color: "#94A3B8" },
  opinionMsg: { fontSize: 14, color: "#475569", fontWeight: "500" },
  userNameSmall: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  userEmailSmall: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 15 },
  cardBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnOutline: { borderWidth: 1, borderColor: "#E2E8F0" },
  btnSolid: { backgroundColor: "#0F172A" },
  btnOutlineText: { fontSize: 12, fontWeight: "800", color: "#64748B" },
  btnSolidText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  searchBox: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarMiniText: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  userEmail: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  statusBtnText: { fontSize: 11, fontWeight: "800" },
  addInputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  categoryInput: {
    flex: 1,
    backgroundColor: "#FFF",
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    fontWeight: "600",
    color: "#1E293B",
  },
  plusBtn: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  catDisplayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  catRight: { flexDirection: "row", gap: 15 },
  iconBtn: { padding: 4 },
  inlineEditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginRight: 15,
  },
  editActions: { flexDirection: "row", gap: 8 },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 50,
    fontWeight: "600",
  },

  // NEW STYLES
  expandedCard: { borderColor: COLORS.primary, borderWidth: 1.5, elevation: 4 },
  expandedFooter: { marginTop: 15 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 12 },
  deleteFeedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#FFF1F2",
    borderRadius: 12,
  },
  deleteFeedbackText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
