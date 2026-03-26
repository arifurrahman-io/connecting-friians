import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme/colors";
import { formatTimeAgo } from "../utils/timeAgo"; // Fixed import name

export default function PostCard({ post, onPress }) {
  const avatarLetter = (post.authorName || "F")[0].toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, post.solved && styles.solvedCardBorder]}
    >
      {/* Top Section: Author & Category */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: post.solved ? "#10B981" : COLORS.primary },
            ]}
          >
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          <View>
            <Text style={styles.author} numberOfLines={1}>
              {post.authorName || "Member"}
            </Text>
            <Text style={styles.time}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </View>

        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: post.solved ? "#DCFCE7" : "#EEF2FF" },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: post.solved ? "#15803D" : COLORS.primary },
            ]}
          >
            {post.primaryExpertiseName?.toUpperCase() || "GENERAL"}
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.body} numberOfLines={3}>
          {post.body}
        </Text>
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons
              name={post.likesCount > 0 ? "heart" : "heart-outline"}
              size={18}
              color={post.likesCount > 0 ? "#EF4444" : "#94A3B8"}
            />
            <Text style={styles.statText}>{post.likesCount || 0}</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color="#94A3B8"
            />
            <Text style={styles.statText}>{post.commentsCount || 0}</Text>
          </View>
        </View>

        {post.solved ? (
          <View style={styles.solvedStatus}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.solvedLabel}>SOLVED</Text>
          </View>
        ) : (
          <View style={styles.openStatus}>
            <Text style={styles.openLabel}>OPEN</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    // Shadow for iOS
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 3,
  },
  solvedCardBorder: {
    borderColor: "#BBF7D0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14, // Squircle style
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  author: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  time: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "500",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  content: {
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 24,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },
  solvedStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  solvedLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10B981",
  },
  openStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  openLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
});
