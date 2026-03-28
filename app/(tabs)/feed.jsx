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
import { subscribePosts } from "../../src/services/postService";
import { COLORS } from "../../src/theme/colors";

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // --- DYNAMIC CATEGORIES WITH POST COUNT ---
  const dynamicCategories = useMemo(() => {
    const counts = {};

    posts.forEach((p) => {
      const cat = p.primaryExpertiseName || p.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    // Sort by usage count and take top 5
    const top5Names = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Structure the data for the FlatList
    const categoriesList = [{ name: "All", count: posts.length }];

    top5Names.forEach((name) => {
      categoriesList.push({ name, count: counts[name] });
    });

    return categoriesList;
  }, [posts]);

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

  const handleCategoryPress = (name) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(name);
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

      {/* --- DYNAMIC CATEGORIES WITH COUNTS --- */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={dynamicCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleCategoryPress(item.name)}
              style={[
                styles.categoryChip,
                activeCategory === item.name && styles.activeCategoryChip,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === item.name && styles.activeCategoryText,
                ]}
              >
                {item.name}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  activeCategory === item.name
                    ? styles.activeCountBadge
                    : styles.inactiveCountBadge,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    activeCategory === item.name && styles.activeCountText,
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.name}
        />
      </View>

      {/* --- MAIN FEED LIST --- */}
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
              <Text style={styles.emptyTitle}>No matching posts</Text>
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
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
    fontWeight: "700",
    color: "#64748B",
  },
  activeCategoryText: {
    color: "#FFF",
  },
  countBadge: {
    marginLeft: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  inactiveCountBadge: {
    backgroundColor: "#F1F5F9",
  },
  activeCountBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  countText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
  },
  activeCountText: {
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
  },
  cardWrapper: {
    marginBottom: 10,
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
});
