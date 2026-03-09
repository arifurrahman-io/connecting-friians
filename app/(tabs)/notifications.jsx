import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppScreen from "../../src/components/AppScreen";
import { useAuth } from "../../src/context/AuthContext";
import {
  markNotificationRead,
  subscribeNotifications,
} from "../../src/services/notificationService";
import { COLORS } from "../../src/theme/colors";
import { timeAgo } from "../../src/utils/timeAgo";

function getNotificationIcon(type) {
  switch (type) {
    case "comment_on_post":
      return {
        name: "chatbubble-ellipses-outline",
        bg: "#EAF1FF",
        color: "#2563EB",
      };
    case "comment_reply":
      return {
        name: "return-up-forward-outline",
        bg: "#EEFCE8",
        color: "#15803D",
      };
    case "matched_expertise_post":
      return {
        name: "sparkles-outline",
        bg: "#FEF3C7",
        color: "#B45309",
      };
    case "like":
      return {
        name: "heart-outline",
        bg: "#FEE2E2",
        color: "#DC2626",
      };
    default:
      return {
        name: "notifications-outline",
        bg: "#F1F5F9",
        color: "#475569",
      };
  }
}

function NotificationCard({ item, onPress }) {
  const icon = getNotificationIcon(item.type);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item)}
      style={[styles.card, !item.isRead && styles.unreadCard]}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>

          {!item.isRead ? <View style={styles.unreadDot} /> : null}
        </View>

        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>

          {item.postId ? (
            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Open</Text>
              <Ionicons
                name="arrow-forward-outline"
                size={14}
                color={COLORS.primary}
              />
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeNotifications(user.uid, setItems);
    return unsub;
  }, [user, refreshKey]);

  const unreadCount = useMemo(() => {
    return items.filter((item) => !item.isRead).length;
  }, [items]);

  const hasUnread = unreadCount > 0;

  const handleOpen = async (item) => {
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
      }

      if (item.postId) {
        router.push(`/post/${item.postId}`);
      }
    } catch (error) {
      console.log("Notification open error:", error);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadItems = items.filter((item) => !item.isRead);

    for (const item of unreadItems) {
      try {
        await markNotificationRead(item.id);
      } catch (error) {
        console.log("Mark read error:", error);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setRefreshKey((prev) => prev + 1);

      // small delay for better refresh UX
      await new Promise((resolve) => setTimeout(resolve, 700));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <AppScreen backgroundColor="#F4F7FB">
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.header}>Notifications</Text>
        </View>

        <View
          style={[styles.headerIcon, hasUnread && styles.headerIconFocused]}
        >
          <Ionicons
            name={hasUnread ? "notifications" : "notifications-outline"}
            size={22}
            color={hasUnread ? "#FFFFFF" : COLORS.primary}
          />

          {hasUnread ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {items.length} total • {unreadCount} unread
        </Text>

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard item={item} onPress={handleOpen} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={8}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="notifications-off-outline"
                size={34}
                color="#94A3B8"
              />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              When someone replies, likes, or matches your expertise, you will
              see it here.
            </Text>
          </View>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  header: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  },

  subheader: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 22,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    position: "relative",
    borderWidth: 1,
    borderColor: "#D7E3FF",
  },

  headerIconFocused: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  summaryText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },

  markAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 24,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8EEF6",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  unreadCard: {
    borderColor: "#D7E3FF",
    backgroundColor: "#FCFDFF",
  },

  cardLeft: {
    marginRight: 12,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  cardBody: {
    flex: 1,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginRight: 8,
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.primary,
  },

  body: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.subtext,
  },

  bottomRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  time: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  linkText: {
    marginRight: 4,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },

  emptyState: {
    marginTop: 70,
    alignItems: "center",
    paddingHorizontal: 26,
  },

  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EEF2F7",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },
});
