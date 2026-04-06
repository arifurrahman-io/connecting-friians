import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp, Layout } from "react-native-reanimated";
import AppScreen from "../../src/components/AppScreen";
import { useAuth } from "../../src/context/AuthContext";
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from "../../src/services/notificationService";
import { COLORS } from "../../src/theme/colors";
import { formatTimeAgo } from "../../src/utils/timeAgo";

function getNotificationIcon(type) {
  switch (type) {
    case "comment_on_post":
      return { name: "chatbubble-ellipses", bg: "#EEF2FF", color: "#4F46E5" };
    case "comment_reply":
      return { name: "arrow-undo", bg: "#F0FDF4", color: "#16A34A" };
    case "matched_expertise_post":
      return { name: "flash", bg: "#FFFBEB", color: "#D97706" };
    case "solved":
      return { name: "checkmark-done", bg: "#EFF6FF", color: "#2563EB" };
    default:
      return { name: "notifications", bg: "#F8FAFC", color: "#64748B" };
  }
}

function NotificationCard({ item, onPress }) {
  const icon = getNotificationIcon(item.type);

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(item)}
        style={[styles.card, !item.isRead && styles.unreadCard]}
      >
        <View style={[styles.iconSquircle, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
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
            <View style={styles.timeWrapper}>
              <Ionicons name="time-outline" size={12} color="#94A3B8" />
              <Text style={styles.timeText}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
            {item.postId && (
              <View style={styles.viewBadge}>
                <Text style={styles.viewBadgeText}>Open</Text>
                <Ionicons
                  name="arrow-forward"
                  size={10}
                  color={COLORS.primary}
                />
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
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, setItems);
  }, [user]);

  const unreadItems = useMemo(() => items.filter((i) => !i.isRead), [items]);
  const unreadCount = unreadItems.length;

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
    if (unreadCount === 0 || isClearing) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsClearing(true);

    try {
      await markAllNotificationsRead(user.uid);
    } catch (error) {
      console.error("Clear all failed:", error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <AppScreen backgroundColor="#F8FAFC">
      {/* GLASSMORPHISM HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTextStack}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.headerSub}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </Animated.Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={styles.markAllBtn}
            disabled={isClearing}
            activeOpacity={0.8}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.markAllText}>Mark all read</Text>
            )}
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
            refreshing={false}
            onRefresh={() => {}}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptySquircle}>
              <Ionicons name="mail-open-outline" size={44} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Your inbox is empty</Text>
            <Text style={styles.emptyDesc}>
              We'll notify you here when alumni interact with your posts or when
              someone needs your expertise.
            </Text>
          </View>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
  },
  headerTextStack: { flex: 1 },
  headerTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  markAllBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minWidth: 110,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  markAllText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  listPadding: { paddingHorizontal: 20, paddingBottom: 120 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  unreadCard: {
    backgroundColor: "#FFFFFF",
    borderColor: COLORS.primary + "20",
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconSquircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
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
  title: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  unreadTitle: { color: "#0F172A", fontWeight: "900" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  bodyText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  viewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "08",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + "15",
  },
  viewBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptySquircle: {
    width: 110,
    height: 110,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
});
