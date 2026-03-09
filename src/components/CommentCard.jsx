import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme/colors";
import { timeAgo } from "../utils/timeAgo";

export default function CommentCard({ comment, onReply, level = 0 }) {
  const isReply = level > 0;

  return (
    <View style={styles.outerWrapper}>
      {/* Container for indentation and thread line */}
      <View
        style={[
          styles.threadContainer,
          { marginLeft: isReply ? level * 16 : 0 },
        ]}
      >
        {/* The Vertical Thread Line - only shows for replies */}
        {isReply && <View style={styles.verticalLine} />}

        <View style={[styles.card, isReply && styles.replyCard]}>
          <View style={styles.header}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: isReply ? "#CBD5F5" : COLORS.primary },
              ]}
            >
              <Text style={styles.avatarText}>
                {(comment.authorName || "U")[0].toUpperCase()}
              </Text>
            </View>

            <View style={styles.authorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{comment.authorName}</Text>
                {/* Optional: Add a badge if the user is a top contributor or expert */}
                {comment.isExpert && (
                  <View style={styles.expertBadge}>
                    <Text style={styles.expertBadgeText}>Expert</Text>
                  </View>
                )}
              </View>
              <Text style={styles.timeText}>{timeAgo(comment.createdAt)}</Text>
            </View>
          </View>

          <Text style={styles.bodyText}>{comment.body}</Text>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => onReply(comment)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-undo-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recursive Replies */}
      {comment.replies?.map((reply) => (
        <CommentCard
          key={reply.id}
          comment={reply}
          level={level + 1}
          onReply={onReply}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: "100%",
  },
  threadContainer: {
    position: "relative",
    paddingHorizontal: 16,
  },
  verticalLine: {
    position: "absolute",
    left: -8, // Positioned relative to the marginLeft of the reply
    top: 0,
    bottom: 20,
    width: 2,
    backgroundColor: "#E2E8F0",
    borderRadius: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  replyCard: {
    backgroundColor: "#F8FAFC", // Slightly different tint for replies
    borderColor: "#E2E8F0",
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorName: {
    fontWeight: "700",
    color: "#1E293B",
    fontSize: 14,
  },
  expertBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  expertBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },
  timeText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  replyText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
