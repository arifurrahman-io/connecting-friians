import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StatusBar as RNStatusBar,
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
} from "react-native-reanimated";

import AppScreen from "../../src/components/AppScreen";
import { useAuth } from "../../src/context/AuthContext";
import { subscribeUnreadCount } from "../../src/services/notificationService";
import {
  subscribeToPlatformStats,
  subscribeToRecentActivity,
} from "../../src/services/platformService";

import { LinearGradient } from "expo-linear-gradient";
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
      target: "/(tabs)/directory",
    },
    {
      label: "Solved",
      value: 0,
      icon: "checkmark-done-circle",
      color: "#10B981",
      target: "/(tabs)/feed",
    },
    {
      label: "Experts",
      value: 0,
      icon: "ribbon",
      color: "#F59E0B",
      target: "/(tabs)/directory",
    },
    {
      label: "Efforts",
      value: 0,
      icon: "flask",
      color: "#EC4899",
      target: "/(tabs)/feed",
    },
  ]);

  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- GREETING & THEME LOGIC ---
  const theme = useMemo(() => {
    const hour = new Date().getHours();
    const firstName = profile?.fullName || "Friend";

    let text,
      icon,
      bgColors,
      isDark = false;

    if (hour >= 5 && hour < 12) {
      text = "Good Morning";
      icon = "sunny";
      bgColors = ["#EEF2FF", "#C7D2FE"];
    } else if (hour >= 12 && hour < 17) {
      text = "Good Afternoon";
      icon = "cloud-outline";
      bgColors = ["#E0F2FE", "#7DD3FC"];
    } else if (hour >= 17 && hour < 22) {
      text = "Good Evening";
      icon = "partly-sunny";
      bgColors = ["#FAE8FF", "#F0ABFC"];
    } else {
      text = "Good Night";
      icon = "moon";
      bgColors = ["#1E293B", "#0F172A"];
      isDark = true;
    }

    return { text, firstName, icon, bgColors, isDark };
  }, [profile?.fullName]);

  useEffect(() => {
    let unsubStats = subscribeToPlatformStats((data) => {
      if (data) {
        setStats([
          {
            label: "Members",
            value: data.activeUsers || 0,
            icon: "people",
            color: "#6366F1",
            target: "/(tabs)/directory",
          },
          {
            label: "Solved",
            value: data.solvedCount || 0,
            icon: "checkmark-done-circle",
            color: "#10B981",
            target: "/(tabs)/feed",
          },
          {
            label: "Experts",
            value: data.expertCount || 0,
            icon: "ribbon",
            color: "#F59E0B",
            target: "/(tabs)/directory",
          },
          {
            label: "Efforts",
            value: data.collabCount || 0,
            icon: "flask",
            color: "#EC4899",
            target: "/(tabs)/feed",
          },
        ]);
      }
      setLoading(false);
    });

    let unsubActivity = subscribeToRecentActivity((items) => {
      setActivities((items || []).slice(0, 5));
    });

    let unsubNotifications = () => {};
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
    <AppScreen backgroundColor={theme.isDark ? "#0F172A" : "#F8FAFC"}>
      <RNStatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingBottom: 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.isDark ? "#FFF" : COLORS.primary}
          />
        }
      >
        {/* HEADER */}
        <Animated.View
          entering={FadeInDown.duration(700)}
          style={styles.header}
        >
          <View style={styles.greetingWrapper}>
            <View style={styles.timeLabelRow}>
              <Ionicons
                name={theme.icon}
                size={14}
                color={theme.isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[styles.greeting, theme.isDark && { color: "#94A3B8" }]}
              >
                {theme.text}
              </Text>
            </View>
            <Text style={[styles.name, theme.isDark && { color: "#FFF" }]}>
              {theme.firstName}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.iconCircle,
              theme.isDark && {
                backgroundColor: "#1E293B",
                borderColor: "#334155",
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/notifications");
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.isDark ? "#FFF" : "#1E293B"}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* BENTO STATS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionLabel,
                theme.isDark && { color: "#64748B" },
              ]}
            >
              PLATFORM SNAPSHOT
            </Text>
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
                  style={[
                    styles.statCard,
                    theme.isDark && {
                      backgroundColor: "#1E293B",
                      borderColor: "#334155",
                    },
                  ]}
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
                    <Text
                      style={[
                        styles.statValue,
                        theme.isDark && { color: "#FFF" },
                      ]}
                    >
                      {item.value}
                    </Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LIVE UPDATES */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text
              style={[
                styles.sectionLabel,
                theme.isDark && { color: "#64748B" },
              ]}
            >
              LIVE UPDATES
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/activity-log")}
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
            style={[
              styles.activityList,
              theme.isDark && {
                backgroundColor: "#1E293B",
                borderColor: "#334155",
              },
            ]}
          >
            {activities.length > 0 ? (
              activities.map((act, index) => {
                const icon = getActivityIcon(act.type);
                return (
                  <View
                    key={act.id || index}
                    style={[
                      styles.activityRow,
                      index === activities.length - 1 && {
                        borderBottomWidth: 0,
                      },
                      theme.isDark && { borderBottomColor: "#334155" },
                    ]}
                  >
                    <View
                      style={[
                        styles.activityIconCircle,
                        { backgroundColor: icon.color + "15" },
                      ]}
                    >
                      <Ionicons name={icon.name} size={14} color={icon.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.activityText,
                          theme.isDark && { color: "#CBD5E1" },
                        ]}
                        numberOfLines={2}
                      >
                        {act.message}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatTimeAgo(act.createdAt)}
                      </Text>
                    </View>
                  </View>
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

        {/* ASK EXPERTS ACTION */}
        <TouchableOpacity
          style={[
            styles.footerAction,
            theme.isDark && { backgroundColor: COLORS.primary },
          ]}
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(tabs)/create-post");
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.footerActionText}>Need support?</Text>
            <Text
              style={[
                styles.footerActionSubtext,
                theme.isDark && { color: "#FFF", opacity: 0.8 },
              ]}
            >
              Experts are ready to help you.
            </Text>
          </View>
          <View
            style={[
              styles.footerButton,
              theme.isDark && { backgroundColor: "#FFF" },
            ]}
          >
            <Text
              style={[
                styles.footerButtonText,
                theme.isDark && { color: COLORS.primary },
              ]}
            >
              Ask Experts
            </Text>
          </View>
        </TouchableOpacity>

        {/* OPINION ACTION */}
        <TouchableOpacity
          style={styles.opinionCard}
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/contact");
          }}
        >
          <LinearGradient
            colors={["#4044fc", "#2015e2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.opinionGradient}
          >
            <View style={styles.opinionContent}>
              <View style={styles.opinionIconCircle}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color="#6366F1"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opinionTitle}>Have an opinion?</Text>
                <Text style={styles.opinionSubtext}>
                  Help us build the perfect alumni network.
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
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
    marginTop: 10,
  },
  greetingWrapper: { gap: 2 },
  timeLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  greeting: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  name: { fontSize: 24, fontWeight: "900", color: "#0F172A", marginTop: -2 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
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
    gap: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconBox: { padding: 10, borderRadius: 14 },
  statValue: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  activityList: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  activityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "500",
  },
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
  },
  footerActionText: { color: "#FFF", fontWeight: "900", fontSize: 18 },
  footerActionSubtext: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  footerButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  footerButtonText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  opinionCard: { marginTop: 16, borderRadius: 24, overflow: "hidden" },
  opinionGradient: { padding: 20 },
  opinionContent: { flexDirection: "row", alignItems: "center", gap: 15 },
  opinionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  opinionTitle: { fontSize: 18, fontWeight: "900", color: "#FFF" },
  opinionSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 2,
  },
});
