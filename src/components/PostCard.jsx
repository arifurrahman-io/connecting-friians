import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme/colors";
import { timeAgo } from "../utils/timeAgo";

export default function PostCard({ post, onPress }) {
  const avatarLetter = (post.authorName || "F")[0].toUpperCase();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          <View>
            <Text style={styles.author}>{post.authorName || "FRIIAN"}</Text>
            <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {post.primaryExpertiseName || "General"}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>

      <Text style={styles.body} numberOfLines={3}>
        {post.body}
      </Text>

      <View style={styles.statusRow}>
        {post.solved ? (
          <View style={styles.solvedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#15803D" />
            <Text style={styles.solvedText}>Solved</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.leftActions}>
          <View style={styles.actionItem}>
            <Ionicons name="heart-outline" size={16} color="#64748B" />
            <Text style={styles.actionText}>{post.likesCount || 0}</Text>
          </View>

          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#64748B" />
            <Text style={styles.actionText}>{post.commentsCount || 0}</Text>
          </View>
        </View>

        <Ionicons
          name="arrow-forward-circle-outline"
          size={20}
          color={COLORS.primary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  author: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  time: {
    fontSize: 12,
    color: "#94A3B8",
  },

  badge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    color: COLORS.primary,
    fontSize: 7,
    fontWeight: "700",
  },

  title: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 22,
  },

  body: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
  },

  statusRow: {
    flexDirection: "row",
    marginTop: 12,
  },

  solvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  solvedText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#15803D",
    fontWeight: "700",
  },

  footer: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },

  actionText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
});
