import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppScreen from "../../src/components/AppScreen";
import { subscribeUsers } from "../../src/services/userService";
import { COLORS } from "../../src/theme/colors";

// --- SUB-COMPONENT: ALUMNI CARD ---
function AlumniCard({ item, onPress }) {
  const avatarLetter = (item.fullName || "F")[0].toUpperCase();
  const expertiseList = Array.isArray(item.expertise)
    ? item.expertise.slice(0, 2)
    : [];

  const bgColors = ["#6366F1", "#EC4899", "#8B5CF6", "#10B981", "#F59E0B"];
  const bgColor = bgColors[avatarLetter.charCodeAt(0) % bgColors.length];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={styles.cardContent}>
        <View style={[styles.avatarFrame, { backgroundColor: bgColor + "15" }]}>
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
            <Ionicons name="mail-outline" size={12} color="#94A3B8" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.email || "Private"}
            </Text>
          </View>

          <View style={styles.expertiseContainer}>
            {expertiseList.map((exp, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{exp}</Text>
              </View>
            ))}
            {item.expertise?.length > 2 && (
              <Text style={styles.moreText}>
                +{item.expertise.length - 2} more
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );
}

// --- MAIN DIRECTORY SCREEN ---
export default function DirectoryScreen() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeUsers(setUsers);
    return unsub;
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    // 1. First, filter out blocked or banned users
    const activeUsers = users.filter(
      (u) => u.status !== "blocked" && u.status !== "banned",
    );

    // 2. Then, apply search keyword filtering
    if (!keyword) return activeUsers;

    return activeUsers.filter((u) => {
      const name = (u.fullName || "").toLowerCase();
      const exp = (u.expertise || []).join(" ").toLowerCase();
      const year = String(u.sscYear || "");

      return (
        name.includes(keyword) ||
        exp.includes(keyword) ||
        year.includes(keyword)
      );
    });
  }, [users, search]);

  return (
    <AppScreen backgroundColor="#FDFDFD">
      <View style={styles.fixedHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Community</Text>
            <Text style={styles.titleText}>FRIIANS Directory</Text>
          </View>
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
            onPress={() => router.push(`/user/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        ListHeaderComponent={
          filteredUsers.length > 0 ? (
            <Text style={styles.countText}>
              {filteredUsers.length} Professionals Found
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Members Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filters.
            </Text>
          </View>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    paddingHorizontal: 4,
    paddingTop: Platform.OS === "ios" ? 10 : 15,
    backgroundColor: "#FDFDFD",
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
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    marginLeft: 8,
  },
  listPadding: {
    paddingHorizontal: 4,
    paddingBottom: 40,
    paddingTop: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarFrame: {
    width: 54,
    height: 54,
    borderRadius: 16,
    padding: 3,
  },
  innerAvatar: {
    flex: 1,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  mainInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    flex: 1,
  },
  batchBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  batchText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  expertiseContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
  },
  moreText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#475569",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
