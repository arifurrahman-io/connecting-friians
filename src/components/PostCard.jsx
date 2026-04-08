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

  useEffect(() => {
    const unsub = ExpertiseService.subscribeCategories(setMasterCategories);
    return unsub;
  }, []);

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
        activeOpacity={0.9}
        style={[styles.card, post.solved && styles.solvedCard]}
      >
        {/* TOP META ROW */}
        <View style={styles.metaHeader}>
          <View style={styles.categoryContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: post.solved ? "#10B981" : COLORS.primary },
              ]}
            />
            <Text
              style={[
                styles.categoryText,
                { color: post.solved ? "#10B981" : COLORS.primary },
              ]}
            >
              {dynamicCategoryName.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
        </View>

        {/* MAIN CONTENT */}
        <View style={styles.contentSection}>
          <Text style={styles.title} numberOfLines={1}>
            {post.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {post.body}
          </Text>
        </View>

        {/* BOTTOM ROW: AUTHOR & STATS */}
        <View style={styles.footer}>
          <View style={styles.authorSection}>
            <View
              style={[
                styles.miniAvatar,
                { backgroundColor: post.solved ? "#DCFCE7" : "#EEF2FF" },
              ]}
            >
              <Text
                style={[
                  styles.miniAvatarText,
                  { color: post.solved ? "#10B981" : COLORS.primary },
                ]}
              >
                {post.authorName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.authorName} numberOfLines={1}>
              {post.authorName}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons
                name={post.likesCount > 0 ? "heart" : "heart-outline"}
                size={14}
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
              <Ionicons name="chatbubble-outline" size={14} color="#94A3B8" />
              <Text style={styles.statText}>{post.commentsCount || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  solvedCard: {
    backgroundColor: "#FDFDFD",
    borderColor: "#ECFDF5",
  },
  metaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  contentSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: "900",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    maxWidth: "70%",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
});
