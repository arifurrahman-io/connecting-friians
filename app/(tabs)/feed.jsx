import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
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
import { subscribePosts } from "../../src/services/postService";
import { COLORS } from "../../src/theme/colors";

const CATEGORIES = ["All", "Tech", "Guidance", "Business", "Support"];

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const unsub = subscribePosts(setPosts);
    return unsub;
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const titleMatch = p.title?.toLowerCase().includes(search.toLowerCase());
      const bodyMatch = p.body?.toLowerCase().includes(search.toLowerCase());
      const matchesSearch = titleMatch || bodyMatch;

      const matchesCategory =
        activeCategory === "All" ||
        p.primaryExpertiseName === activeCategory ||
        p.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [posts, search, activeCategory]);

  const handleCategoryPress = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(item);
  };

  return (
    <AppScreen backgroundColor="#FDFDFD">
      <StatusBar barStyle="dark-content" />

      {/* --- COMPACT HEADER --- */}
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

      {/* --- COMPACT SEARCH --- */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            placeholder="Search problems..."
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

      {/* --- TIGHT CATEGORIES --- */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategoryPress(item)}
              style={[
                styles.categoryChip,
                activeCategory === item && styles.activeCategoryChip,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === item && styles.activeCategoryText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* --- MAIN FEED LIST --- */}
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
            <Ionicons name="document-text-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No matching posts</Text>
          </View>
        }
      />

      {/* --- FAB --- */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/create-post");
          }}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>Ask Guidance</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingHorizontal: 4,
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
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "12",
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1E293B",
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeCategoryChip: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  activeCategoryText: {
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 120,
  },
  cardWrapper: {
    marginBottom: 10, // Reduced space between cards
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 8,
  },
  fabWrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  fab: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 16,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabText: {
    color: "#fff",
    fontWeight: "800",
    marginLeft: 6,
    fontSize: 15,
  },
});
