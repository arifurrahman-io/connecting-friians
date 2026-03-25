import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  Layout,
} from "react-native-reanimated";

import AppScreen from "../../src/components/AppScreen";
import { useAuth } from "../../src/context/AuthContext";
import { subscribeUnreadCount } from "../../src/services/notificationService";
import {
  subscribeToPlatformStats,
  subscribeToRecentActivity,
} from "../../src/services/platformService";

import { COLORS } from "../../src/theme/colors";
import { formatTimeAgo } from "../../src/utils/timeAgo";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { profile, user } = useAuth();

  const [stats, setStats] = useState([
    {
      label: "Active Users",
      value: 0,
      icon: "people",
      color: "#6366F1",
      target: "/directory",
    },
    {
      label: "Solved",
      value: 0,
      icon: "checkmark-done-circle",
      color: "#10B981",
      target: "/feed",
    },
    {
      label: "Experts",
      value: 0,
      icon: "ribbon",
      color: "#F59E0B",
      target: "/directory",
    },
    {
      label: "Collabs",
      value: 0,
      icon: "flask",
      color: "#EC4899",
      target: "/feed",
    },
  ]);

  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  useEffect(() => {
    let unsubStats = () => {};
    let unsubActivity = () => {};
    let unsubNotifications = () => {};

    unsubStats = subscribeToPlatformStats((data) => {
      if (data) {
        setStats([
          {
            label: "Active Users",
            value: data.activeUsers || 0,
            icon: "people",
            color: "#6366F1",
            target: "/directory",
          },
          {
            label: "Solved",
            value: data.solvedCount || 0,
            icon: "checkmark-done-circle",
            color: "#10B981",
            target: "/feed",
          },
          {
            label: "Experts",
            value: data.expertCount || 0,
            icon: "ribbon",
            color: "#F59E0B",
            target: "/directory",
          },
          {
            label: "Collabs",
            value: data.collabCount || 0,
            icon: "flask",
            color: "#EC4899",
            target: "/feed",
          },
        ]);
      }
      setLoading(false);
    });

    unsubActivity = subscribeToRecentActivity((items) => {
      // FIX: Only take the last 5 activities for the Live Feed
      setActivities((items || []).slice(0, 5));
    });

    if (user?.uid) {
      unsubNotifications = subscribeUnreadCount(user.uid, setUnreadCount);
    }

    return () => {
      unsubStats();
      unsubActivity();
      unsubNotifications();
    };
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 800);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "join":
        return { name: "person-add", color: "#6366F1" };
      case "solved":
        return { name: "checkmark-circle", color: "#10B981" };
      case "post":
        return { name: "help-buoy", color: "#F59E0B" };
      default:
        return { name: "flash", color: COLORS.primary };
    }
  };

  return (
    <AppScreen backgroundColor="#F8FAFC">
      <ScrollView
        showsVerticalScrollIndicator={false}
        // FIX: Added large padding to prevent the Quick Action card from hiding under the Tab Bar
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* HEADER */}
        <Animated.View
          entering={FadeInDown.duration(700)}
          style={styles.header}
        >
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>
              {profile?.fullName?.split(" ")[0] || "Friend"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/notifications");
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* PLATFORM STATS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PLATFORM SNAPSHOT</Text>
            {loading && (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )}
          </View>
          <View style={styles.statsGrid}>
            {stats.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={{ width: "48%" }}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(item.target);
                }}
              >
                <Animated.View
                  entering={FadeInRight.delay(index * 100)}
                  style={styles.statCard}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: item.color + "15" },
                    ]}
                  >
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LIVE ACTIVITY */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionLabel}>LIVE UPDATES</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/activity-log"); // Ensure this route exists
              }}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          <Animated.View
            entering={FadeIn.delay(300)}
            style={styles.activityList}
          >
            {activities.length > 0 ? (
              activities.map((act, index) => {
                const icon = getActivityIcon(act.type);
                return (
                  <Animated.View
                    key={act.id || index}
                    layout={Layout.springify()}
                    style={[
                      styles.activityRow,
                      index === activities.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.activityIconCircle,
                        { backgroundColor: icon.color + "10" },
                      ]}
                    >
                      <Ionicons name={icon.name} size={14} color={icon.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityText} numberOfLines={2}>
                        {act.message}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatTimeAgo(act.createdAt)}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="pulse-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyText}>
                  Waiting for new activity...
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* QUICK ACTION */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <TouchableOpacity
            style={styles.footerAction}
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/create-post");
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.footerActionText}>Stuck on a problem?</Text>
              <Text style={styles.footerActionSubtext}>
                Our alumni experts are ready to help you.
              </Text>
            </View>
            <View style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Ask Experts</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  greeting: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: { fontSize: 32, fontWeight: "900", color: "#0F172A", marginTop: -4 },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  badgeText: { color: "#FFF", fontSize: 8, fontWeight: "900" },
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.2,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 24,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconBox: { padding: 10, borderRadius: 16 },
  statValue: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  activityList: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  activityIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  activityText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
    lineHeight: 20,
  },
  activityTime: { fontSize: 11, color: "#94A3B8", marginTop: 4 },
  emptyContainer: { alignItems: "center", padding: 20 },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 10,
  },
  footerAction: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  footerActionText: { color: "#FFF", fontWeight: "800", fontSize: 17 },
  footerActionSubtext: { color: "#94A3B8", fontSize: 12, marginTop: 4 },
  footerButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginLeft: 10,
  },
  footerButtonText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
});
