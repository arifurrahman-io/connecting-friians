import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import AppScreen from "../../src/components/AppScreen";
import { useAuth } from "../../src/context/AuthContext";
import {
  markAllNotificationsRead,
  markNotificationRead, // Added for high-performance batching
  subscribeNotifications,
} from "../../src/services/notificationService";
import { COLORS } from "../../src/theme/colors";
import { formatTimeAgo } from "../../src/utils/timeAgo"; // Fixed function name

function getNotificationIcon(type) {
  switch (type) {
    case "comment_on_post":
      return { name: "chatbubble-ellipses", bg: "#E0E7FF", color: "#4F46E5" };
    case "comment_reply":
      return { name: "arrow-undo", bg: "#DCFCE7", color: "#16A34A" };
    case "matched_expertise_post":
      return { name: "flash", bg: "#FEF3C7", color: "#D97706" };
    case "solved":
      return { name: "checkmark-done", bg: "#DBEAFE", color: "#2563EB" };
    default:
      return { name: "notifications", bg: "#F1F5F9", color: "#64748B" };
  }
}

function NotificationCard({ item, onPress }) {
  const icon = getNotificationIcon(item.type);

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress(item)}
        style={[styles.card, !item.isRead && styles.unreadCard]}
      >
        <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <Text
              style={[styles.title, !item.isRead && styles.unreadTitle]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.bodyText} numberOfLines={2}>
            {item.body}
          </Text>

          <View style={styles.bottomRow}>
            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
            {item.postId && (
              <View style={styles.viewBadge}>
                <Text style={styles.viewBadgeText}>View Details</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, setItems);
  }, [user]);

  const unreadCount = useMemo(
    () => items.filter((i) => !i.isRead).length,
    [items],
  );

  const handleOpen = async (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!item.isRead) {
      await markNotificationRead(item.id);
    }
    if (item.postId) {
      router.push(`/post/${item.postId}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await markAllNotificationsRead(user.uid);
    } catch (error) {
      console.error("Batch mark read failed:", error);
    }
  };

  return (
    <AppScreen backgroundColor="#F8FAFC">
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0
              ? `You have ${unreadCount} new alerts`
              : "You're all caught up!"}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={styles.markAllBtn}
          >
            <Ionicons
              name="checkmark-done-all"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.markAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <NotificationCard item={item} onPress={handleOpen} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {}}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="mail-open-outline" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Nothing to see here</Text>
            <Text style={styles.emptyDesc}>
              We'll notify you when something important happens.
            </Text>
          </View>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 10,
  },
  headerTitle: { fontSize: 32, fontWeight: "900", color: "#0F172A" },
  headerSub: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  markAllText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  unreadCard: {
    backgroundColor: "#F0F7FF",
    borderColor: "#BFDBFE",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardBody: { flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#334155" },
  unreadTitle: { color: "#1E293B", fontWeight: "800" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  bodyText: { fontSize: 13, color: "#64748B", lineHeight: 18 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  timeText: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  viewBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  viewBadgeText: { fontSize: 10, color: "#64748B", fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 100, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  emptyDesc: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
