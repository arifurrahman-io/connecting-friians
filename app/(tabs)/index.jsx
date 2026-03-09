import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
import AppScreen from "../../src/components/AppScreen";
import { useAuth } from "../../src/context/AuthContext";
import { COLORS } from "../../src/theme/colors";
// Assuming these services exist based on your project structure
import {
  getPlatformStats,
  getRecentActivity,
} from "../../src/services/platformService";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { profile } = useAuth();
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        getPlatformStats(),
        getRecentActivity(),
      ]);

      // Mapping colors/icons to dynamic data
      const mappedStats = [
        {
          label: "Active Users",
          value: statsData.activeUsers,
          icon: "people-outline",
          color: "#6366F1",
        },
        {
          label: "Solved",
          value: statsData.solvedCount,
          icon: "checkmark-done-outline",
          color: "#10B981",
        },
        {
          label: "Experts",
          value: statsData.expertCount,
          icon: "ribbon-outline",
          color: "#F59E0B",
        },
        {
          label: "Collabs",
          value: statsData.collabCount,
          icon: "flask-outline",
          color: "#EC4899",
        },
      ];

      setStats(mappedStats);
      setActivities(activityData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <AppScreen backgroundColor="#F8FAFC">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Modern Minimal Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.name}>
              {profile?.fullName?.split(" ")[0] || "Friian"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => router.push("/directory")}
            >
              <Ionicons name="search-outline" size={22} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#475569"
              />
              <View style={styles.activeDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Platform Snapshot - Dynamic Bento Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PLATFORM SNAPSHOT</Text>
          {loading && !refreshing ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginTop: 20 }}
            />
          ) : (
            <View style={styles.statsGrid}>
              {stats.map((item, index) => (
                <View key={index} style={styles.statCard}>
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: item.color + "10" },
                    ]}
                  >
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{item.value || "0"}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Premium CTA Card */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => router.push("/feed")}
          activeOpacity={0.92}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>LIVE FEED</Text>
            </View>
            <Text style={styles.heroTitle}>Community{"\n"}Knowledge Hub</Text>
            <Text style={styles.heroDesc}>
              Collaborate with top-tier alumni to solve complex problems in
              real-time.
            </Text>
            <View style={styles.heroFooter}>
              <Text style={styles.heroBtnText}>Explore Feed</Text>
              <Ionicons name="arrow-forward-circle" size={28} color="#fff" />
            </View>
          </View>
          <View style={styles.heroGraphic} />
        </TouchableOpacity>

        {/* Recent Activity - Dynamic List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECENT UPDATES</Text>
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Text style={styles.textBtn}>View History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {activities.length > 0 ? (
              activities.map((act, index) => (
                <ActivityItem
                  key={act.id}
                  icon={
                    act.type === "guidance" ? "flash-outline" : "trophy-outline"
                  }
                  text={act.message}
                  category={act.category}
                  time={act.timeAgo}
                  color={act.type === "guidance" ? "#6366F1" : "#10B981"}
                  isLast={index === activities.length - 1}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No recent updates found.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function ActivityItem({ icon, text, category, time, color, isLast }) {
  return (
    <View style={[styles.activityRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={[styles.activityIcon, { backgroundColor: color + "10" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.activityBody}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {text}
        </Text>
        <View style={styles.activityMeta}>
          <Text style={styles.activityCategory}>{category}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.activityTime}>{time}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 110 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  name: { fontSize: 32, fontWeight: "800", color: "#0F172A", marginTop: -2 },
  headerActions: { flexDirection: "row", gap: 10 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  activeDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "#fff",
  },
  section: { marginTop: 25 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 32,
    padding: 24,
    marginTop: 30,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  heroGraphic: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", lineHeight: 34 },
  heroDesc: { fontSize: 15, color: "#94A3B8", marginTop: 12, lineHeight: 22 },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    gap: 10,
  },
  heroBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  textBtn: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  activityList: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityBody: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  activityMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  activityCategory: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },
  dot: { marginHorizontal: 6, color: "#CBD5E1" },
  activityTime: { fontSize: 12, color: "#94A3B8" },
  emptyText: {
    padding: 20,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 14,
  },
});
