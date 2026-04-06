import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppScreen from "../../src/components/AppScreen";
import PostCard from "../../src/components/PostCard";
import { ExpertiseService } from "../../src/services/ExpertiseService";
import { subscribePosts } from "../../src/services/postService";
import { COLORS } from "../../src/theme/colors";

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all"); // Logic moved to IDs
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to Posts
    const unsubPosts = subscribePosts((data) => {
      setPosts(data);
      setLoading(false);
    });

    // 2. Subscribe to Master Expertise Categories
    const unsubCats = ExpertiseService.subscribeCategories((data) => {
      setMasterCategories(data);
    });

    return () => {
      unsubPosts();
      unsubCats();
    };
  }, []);

  // --- DYNAMIC CATEGORY TABS WITH COUNTS ---
  const dynamicCategories = useMemo(() => {
    const counts = {};
    posts.forEach((p) => {
      const id = p.primaryExpertiseId;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });

    // We only show categories that actually have posts, + "All"
    const activeList = masterCategories
      .filter((cat) => counts[cat.id] > 0)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: counts[cat.id],
      }))
      .sort((a, b) => b.count - a.count);

    return [{ id: "all", name: "All", count: posts.length }, ...activeList];
  }, [posts, masterCategories]);

  // --- FILTERING LOGIC ---
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        p.title?.toLowerCase().includes(searchTerm) ||
        p.body?.toLowerCase().includes(searchTerm);

      const matchesCategory =
        activeCategoryId === "all" || p.primaryExpertiseId === activeCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [posts, search, activeCategoryId]);

  const handleCategoryPress = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategoryId(id);
  };

  return (
    <AppScreen backgroundColor="#FDFDFD">
      <StatusBar barStyle="dark-content" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Community</Text>
          <Text style={styles.headerTitle}>Problem Feed</Text>
        </View>
        <TouchableOpacity
          style={styles.profileCircle}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/profile");
          }}
        >
          <Ionicons
            name="person-circle-outline"
            size={26}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* --- SEARCH --- */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            placeholder="Search by keyword..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Ionicons name="close-circle" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* --- CATEGORY CHIPS --- */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={dynamicCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategoryPress(item.id)}
              style={[
                styles.categoryChip,
                activeCategoryId === item.id && styles.activeCategoryChip,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategoryId === item.id && styles.activeCategoryText,
                ]}
              >
                {item.name}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  activeCategoryId === item.id
                    ? styles.activeCountBadge
                    : styles.inactiveCountBadge,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    activeCategoryId === item.id && styles.activeCountText,
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* --- FEED --- */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <PostCard
                post={item}
                onPress={() => router.push(`/post/${item.id}`)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={32}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>No matching posts found</Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary + "12",
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#1E293B" },
  categoryContainer: { marginBottom: 8 },
  categoryList: { paddingHorizontal: 16, gap: 10 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeCategoryChip: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  categoryText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  activeCategoryText: { color: "#FFF" },
  countBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  inactiveCountBadge: { backgroundColor: "#F1F5F9" },
  activeCountBadge: { backgroundColor: "rgba(255,255,255,0.2)" },
  countText: { fontSize: 10, fontWeight: "800", color: "#94A3B8" },
  activeCountText: { color: "#FFF" },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 },
  cardWrapper: { marginBottom: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 8,
  },
});
