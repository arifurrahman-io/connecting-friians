import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { ExpertiseService } from "../services/ExpertiseService";
import { COLORS } from "../theme/colors";
import { formatTimeAgo } from "../utils/timeAgo";

export default function PostCard({ post, onPress }) {
  const [masterCategories, setMasterCategories] = useState([]);
  const avatarLetter = (post.authorName || "F")[0].toUpperCase();

  // 1. Subscribe to the Master Expertise Collection
  useEffect(() => {
    const unsub = ExpertiseService.subscribeCategories(setMasterCategories);
    return unsub;
  }, []);

  // 2. DYNAMIC MAPPING: Resolve the latest name from the ID
  const dynamicCategoryName = useMemo(() => {
    const match = masterCategories.find(
      (cat) => cat.id === post.primaryExpertiseId,
    );
    return match ? match.name : post.primaryExpertiseName || "General";
  }, [masterCategories, post.primaryExpertiseId, post.primaryExpertiseName]);

  return (
    <Animated.View entering={FadeInUp.duration(400)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.card, post.solved ? styles.solvedCard : styles.openCard]}
      >
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.authorRow}>
            {/* AVATAR */}
            <View
              style={[
                styles.avatar,
                { backgroundColor: post.solved ? "#10B981" : COLORS.primary },
              ]}
            >
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>

            {/* AUTHOR NAME CONTAINER (Flex: 1 to prevent overlap) */}
            <View style={styles.nameContainer}>
              <Text
                style={styles.author}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {post.authorName || "FRIIAN Member"}
              </Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={10} color="#94A3B8" />
                <Text style={styles.time}>{formatTimeAgo(post.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* DYNAMIC BADGE (With specific width constraints) */}
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: post.solved
                  ? "#DCFCE7"
                  : COLORS.primary + "10",
              },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: post.solved ? "#15803D" : COLORS.primary },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {dynamicCategoryName.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* --- CONTENT --- */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          <Text style={styles.body} numberOfLines={3}>
            {post.body}
          </Text>
        </View>

        {/* --- FOOTER --- */}
        <View style={styles.footer}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons
                name={post.likesCount > 0 ? "heart" : "heart-outline"}
                size={18}
                color={post.likesCount > 0 ? "#EF4444" : "#94A3B8"}
              />
              <Text
                style={[
                  styles.statText,
                  post.likesCount > 0 && { color: "#EF4444" },
                ]}
              >
                {post.likesCount || 0}
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.iconCircleMini}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color="#64748B"
                />
              </View>
              <Text style={styles.statText}>{post.commentsCount || 0}</Text>
            </View>
          </View>

          {post.solved ? (
            <View style={styles.solvedStatus}>
              <Ionicons
                name="checkmark-done-circle"
                size={16}
                color="#10B981"
              />
              <Text style={styles.solvedLabel}>RESOLVED</Text>
            </View>
          ) : (
            <View style={styles.viewDetails}>
              <Text style={styles.viewLabel}>View Discussion</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={COLORS.primary}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderLeftWidth: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      },
      android: { elevation: 3 },
    }),
  },
  openCard: { borderLeftColor: COLORS.primary },
  solvedCard: { borderLeftColor: "#10B981", backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Crucial: Takes remaining space
  },
  nameContainer: {
    flex: 1, // Crucial: Forces text to respect the badge's boundary
    marginRight: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  author: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  time: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: "35%", // Strictly manages the category width
    alignItems: "center",
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  content: { marginBottom: 20 },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 26,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  body: { fontSize: 14, color: "#475569", lineHeight: 22, fontWeight: "500" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  statsContainer: { flexDirection: "row", alignItems: "center", gap: 18 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconCircleMini: { padding: 4, backgroundColor: "#F8FAFC", borderRadius: 8 },
  statText: { fontSize: 14, color: "#64748B", fontWeight: "800" },
  solvedStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  solvedLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#15803D",
    letterSpacing: 0.5,
  },
  viewDetails: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewLabel: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
});
