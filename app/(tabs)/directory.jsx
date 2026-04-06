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

// --- SUB-COMPONENT: ALUMNI CARD ---
function AlumniCard({ item, masterCategories, onPress }) {
  const avatarLetter = (item.fullName || "F")[0].toUpperCase();

  // Logic: Map stored IDs back to human-readable names
  const expertiseNames = useMemo(() => {
    if (!item.expertise || !masterCategories.length) return [];
    return masterCategories
      .filter((cat) => item.expertise.includes(cat.id))
      .map((cat) => cat.name);
  }, [item.expertise, masterCategories]);

  const displayExpertise = expertiseNames.slice(0, 2);

  const bgColors = ["#6366F1", "#EC4899", "#8B5CF6", "#10B981", "#F59E0B"];
  const bgColor = bgColors[avatarLetter.charCodeAt(0) % bgColors.length];

  return (
    <Animated.View entering={FadeInUp} layout={Layout.springify()}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={styles.cardContent}>
          <View
            style={[styles.avatarFrame, { backgroundColor: bgColor + "15" }]}
          >
            <View style={[styles.innerAvatar, { backgroundColor: bgColor }]}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          </View>

          <View style={styles.mainInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.fullName || "FRIIAN Member"}
              </Text>
              <View style={styles.batchBadge}>
                <Text style={styles.batchText}>
                  SSC-{item.sscYear?.toString() || "—"}
                </Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <Ionicons name="briefcase-outline" size={12} color="#94A3B8" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.jobDescription || "Alumnus"}
              </Text>
            </View>

            <View style={styles.expertiseContainer}>
              {displayExpertise.map((name, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{name}</Text>
                </View>
              ))}
              {expertiseNames.length > 2 && (
                <Text style={styles.moreText}>
                  +{expertiseNames.length - 2} more
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
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
    // Subscribe to both Users and Categories for name mapping
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

    // 1. Filter out blocked users
    const activeUsers = users.filter(
      (u) => u.status !== "blocked" && u.status !== "banned",
    );

    if (!keyword) return activeUsers;

    // 2. Search logic (Name, Year, or Category Name)
    return activeUsers.filter((u) => {
      const name = (u.fullName || "").toLowerCase();
      const year = String(u.sscYear || "");

      // Check if keyword matches the name of any expertise IDs they possess
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
      <View style={styles.fixedHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Community</Text>
            <Text style={styles.titleText}>FRIIANS Directory</Text>
          </View>
          {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, year, or skill..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={8}
        ListHeaderComponent={
          filteredUsers.length > 0 ? (
            <Text style={styles.countText}>
              {filteredUsers.length} Professionals Found
            </Text>
          ) : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="people-outline" size={48} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>No Members Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or check your spelling.
              </Text>
            </View>
          )
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 15,
    backgroundColor: "#FDFDFD",
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  titleText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    marginLeft: 10,
    fontWeight: "600",
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarFrame: {
    width: 60,
    height: 60,
    borderRadius: 20,
    padding: 4,
  },
  innerAvatar: {
    flex: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  mainInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  batchBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  batchText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 5,
    fontWeight: "500",
  },
  expertiseContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.primary + "08",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "15",
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
  },
  moreText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1E293B",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
});
