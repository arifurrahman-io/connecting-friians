import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import AppScreen from "../src/components/AppScreen";
import { subscribeToRecentActivity } from "../src/services/platformService";
import { COLORS } from "../src/theme/colors";
import { formatTimeAgo } from "../src/utils/timeAgo";

const FILTERS = [
  { id: "all", label: "All", icon: "infinite" },
  { id: "post", label: "Problems", icon: "help-buoy" },
  { id: "solved", label: "Solutions", icon: "checkmark-circle" },
  { id: "join", label: "Members", icon: "person-add" },
];

export default function ActivityLogScreen() {
  const [activities, setActivities] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToRecentActivity((items) => {
      setActivities(items || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter logic
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredData(activities);
    } else {
      setFilteredData(activities.filter((item) => item.type === activeFilter));
    }
  }, [activeFilter, activities]);

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

  const renderItem = ({ item, index }) => {
    const icon = getActivityIcon(item.type);
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50)}
        layout={Layout.springify()}
        style={styles.card}
      >
        <View
          style={[styles.iconCircle, { backgroundColor: icon.color + "15" }]}
        >
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <AppScreen backgroundColor="#F8FAFC">
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Activity Log",
          headerTitleStyle: { fontWeight: "900" },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* HORIZONTAL FILTERS */}
      <View style={styles.filterWrapper}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(item.id);
              }}
              style={[
                styles.filterTab,
                activeFilter === item.id && styles.filterTabActive,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={activeFilter === item.id ? "#FFF" : "#64748B"}
              />
              <Text
                style={[
                  styles.filterLabel,
                  activeFilter === item.id && styles.filterLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                No activity found for this category.
              </Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterWrapper: {
    backgroundColor: "#FFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#F1F5F9",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  filterLabelActive: {
    color: "#FFF",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
});
