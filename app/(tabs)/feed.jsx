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
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPosts = subscribePosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    const unsubCats = ExpertiseService.subscribeCategories(setMasterCategories);
    return () => {
      unsubPosts();
      unsubCats();
    };
  }, []);

  const dynamicCategories = useMemo(() => {
    const counts = {};
    posts.forEach((p) => {
      const id = p.primaryExpertiseId;
      if (id) counts[id] = (counts[id] || 0) + 1;
    });

    const activeList = masterCategories
      .filter((cat) => counts[cat.id] > 0)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: counts[cat.id],
      }))
      .sort((a, b) => b.count - a.count);

    return [
      { id: "all", name: "All Topics", count: posts.length },
      ...activeList,
    ];
  }, [posts, masterCategories]);

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

      {/* --- COMPACT HEADER --- */}
      <View style={styles.header}>
        <View style={styles.titleStack}>
          <Text style={styles.headerTitle}>Feed</Text>
          <View style={styles.activeIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{posts.length} Active</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/profile");
          }}
        >
          <Ionicons name="person-circle" size={30} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* --- SLIM SEARCH --- */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            placeholder="Search discussion..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* --- TIGHT HORIZONTAL CATEGORIES --- */}
      <View style={styles.catWrapper}>
        <FlatList
          data={dynamicCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = activeCategoryId === item.id;
            return (
              <TouchableOpacity
                onPress={() => handleCategoryPress(item.id)}
                style={[styles.catChip, isActive && styles.activeCatChip]}
              >
                <Text
                  style={[styles.catText, isActive && styles.activeCatText]}
                >
                  {item.name}
                </Text>
                <View
                  style={[styles.countPill, isActive && styles.activeCountPill]}
                >
                  <Text
                    style={[
                      styles.countValue,
                      isActive && styles.activeCountValue,
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* --- FEED LIST --- */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator color={COLORS.primary} size="small" />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => router.push(`/post/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={32} color="#E2E8F0" />
              <Text style={styles.emptyText}>Nothing here yet...</Text>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
    marginBottom: 8,
  },
  titleStack: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4, // Aligns with bottom of text
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  onlineText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  catWrapper: {
    marginBottom: 6,
  },
  catList: {
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 2,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  activeCatChip: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  catText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  activeCatText: {
    color: "#FFF",
  },
  countPill: {
    marginLeft: 5,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  activeCountPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  countValue: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
  },
  activeCountValue: {
    color: "#FFF",
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 80,
  },
  centerLoader: {
    marginTop: 30,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
