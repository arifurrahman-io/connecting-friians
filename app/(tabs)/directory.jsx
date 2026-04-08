import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import AppScreen from "../../src/components/AppScreen";
import { ExpertiseService } from "../../src/services/ExpertiseService";
import { subscribeUsers } from "../../src/services/userService";
import { COLORS } from "../../src/theme/colors";

// --- SUB-COMPONENT: COMPACT ALUMNI CARD ---
function AlumniCard({ item, masterCategories, onPress }) {
  const avatarLetter = (item.fullName || "F")[0].toUpperCase();

  const expertiseNames = useMemo(() => {
    if (!item.expertise || !masterCategories.length) return [];
    return masterCategories
      .filter((cat) => item.expertise.includes(cat.id))
      .map((cat) => cat.name);
  }, [item.expertise, masterCategories]);

  // Modern Avatar Colors
  const bgColors = ["#6366F1", "#EC4899", "#8B5CF6", "#10B981", "#F59E0B"];
  const bgColor = bgColors[avatarLetter.charCodeAt(0) % bgColors.length];

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        {/* AVATAR SECTION */}
        <View style={[styles.miniAvatar, { backgroundColor: bgColor }]}>
          <Text style={styles.miniAvatarText}>{avatarLetter}</Text>
        </View>

        {/* INFO SECTION */}
        <View style={styles.infoWrapper}>
          <View style={styles.topRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.fullName || "Member"}
            </Text>

            {/* RIGHT ALIGNED FULL BATCH */}
            <View style={styles.batchBadge}>
              <Text style={styles.batchBadgeText}>
                SSC-{item.sscYear?.toString() || "—"}
              </Text>
            </View>
          </View>

          <Text style={styles.jobText} numberOfLines={1}>
            {item.jobDescription || "FRIIAN Alumnus"}
          </Text>

          {expertiseNames.length > 0 && (
            <Text style={styles.expertiseText} numberOfLines={1}>
              {expertiseNames.join(" • ")}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={12}
          color="#CBD5E1"
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// --- MAIN DIRECTORY SCREEN ---
export default function DirectoryScreen() {
  const [users, setUsers] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = subscribeUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    const unsubCats = ExpertiseService.subscribeCategories(setMasterCategories);
    return () => {
      unsubUsers();
      unsubCats();
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const activeUsers = users.filter(
      (u) => u.status !== "blocked" && u.status !== "banned",
    );

    if (!keyword) return activeUsers;

    return activeUsers.filter((u) => {
      const name = (u.fullName || "").toLowerCase();
      const year = String(u.sscYear || "");
      const matchesExpertise = masterCategories.some(
        (cat) =>
          u.expertise?.includes(cat.id) &&
          cat.name.toLowerCase().includes(keyword),
      );
      return (
        name.includes(keyword) || year.includes(keyword) || matchesExpertise
      );
    });
  }, [users, search, masterCategories]);

  return (
    <AppScreen backgroundColor="#FDFDFD">
      <View style={styles.compactHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Directory</Text>
          <View style={styles.onlinePill}>
            <View style={styles.dot} />
            <Text style={styles.onlineCount}>{users.length} FRIIANS</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search alumni, year, or skill..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlumniCard
              item={item}
              masterCategories={masterCategories}
              onPress={() => router.push(`/user/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  compactHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 4 : 10,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
  },
  onlineCount: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    marginLeft: 8,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 5,
    paddingBottom: 20,
    paddingTop: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f7ff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  miniAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  miniAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  infoWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Ensures right alignment of the batch
    alignItems: "center",
    marginBottom: 2,
  },
  nameText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  batchBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  batchBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.3,
  },
  jobText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  expertiseText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
