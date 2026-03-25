import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import InputField from "../../src/components/InputField";
import { useAuth } from "../../src/context/AuthContext";
import {
  addComment,
  buildCommentTree,
  markPostSolved,
  subscribeComments,
  subscribeIsPostLiked,
  subscribePost,
  toggleLikePost,
} from "../../src/services/postService";
import { COLORS } from "../../src/theme/colors";
import { formatTimeAgo } from "../../src/utils/timeAgo"; // Fixed Import

function CommentItem({ item, post, profile, onReply, level = 0 }) {
  // Enhanced Expert Check
  const isExpert = item.authorExpertise?.includes(post.primaryExpertiseName);
  const isAuthor = item.authorId === post.authorId;

  return (
    <View style={styles.commentWrapper}>
      <View
        style={[styles.threadContainer, { marginLeft: level > 0 ? 24 : 16 }]}
      >
        {/* Visual Thread Line */}
        {level > 0 && <View style={styles.verticalLine} />}

        <View
          style={[
            styles.commentCard,
            level > 0 && styles.replyCard,
            isExpert && styles.expertCard,
          ]}
        >
          <View style={styles.commentHeader}>
            <View
              style={[
                styles.commentAvatar,
                { backgroundColor: isExpert ? "#F59E0B" : "#CBD5E1" },
              ]}
            >
              <Text style={styles.commentAvatarText}>
                {(item.authorName || "U")[0].toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.commentTopRow}>
                <Text style={styles.commentAuthor} numberOfLines={1}>
                  {item.authorName}
                </Text>
                {isExpert && (
                  <View style={styles.expertBadge}>
                    <Ionicons name="ribbon" size={10} color="#B45309" />
                    <Text style={styles.expertText}>Expert</Text>
                  </View>
                )}
                {isAuthor && <Text style={styles.authorTag}>OP</Text>}
              </View>
              <Text style={styles.commentTime}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>

          <Text style={styles.commentBody}>{item.body}</Text>

          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onReply(item);
            }}
          >
            <Ionicons
              name="arrow-undo-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.replyBtnText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {item.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          item={reply}
          post={post}
          profile={profile}
          onReply={onReply}
          level={level + 1}
        />
      ))}
    </View>
  );
}

export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    const unsubPost = subscribePost(id, setPost);
    const unsubComments = subscribeComments(id, setComments);
    let unsubLiked;
    if (user?.uid) {
      unsubLiked = subscribeIsPostLiked(id, user.uid, setLiked);
    }
    return () => {
      unsubPost?.();
      unsubComments?.();
      unsubLiked?.();
    };
  }, [id, user?.uid]);

  const threadedComments = useMemo(
    () => buildCommentTree(comments),
    [comments],
  );

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      setLoading(true);
      await addComment({
        postId: id,
        authorId: user.uid,
        authorName: profile?.fullName || "User",
        body: comment,
        parentId: replyTo?.id || null,
      });
      setComment("");
      setReplyTo(null);
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleLikePost(id, user.uid);
  };

  const handleSolved = async () => {
    Alert.alert("Mark as Solved?", "This will close the discussion.", [
      { text: "Cancel", style: "cancel" },
      { text: "Solve", onPress: () => markPostSolved(id) },
    ]);
  };

  if (!post)
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );

  const isOwner = user?.uid === post.authorId;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <FlatList
          data={threadedComments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <View style={styles.postCard}>
                <View style={styles.headerRow}>
                  <View style={styles.authorInfo}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: COLORS.primary },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {(post.authorName || "U")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.authorName}>{post.authorName}</Text>
                      <Text style={styles.timeLabel}>
                        {formatTimeAgo(post.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {post.primaryExpertiseName?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postBody}>{post.body}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.mainAction}
                    onPress={handleLike}
                  >
                    <Ionicons
                      name={liked ? "heart" : "heart-outline"}
                      size={22}
                      color={liked ? "#EF4444" : "#64748B"}
                    />
                    <Text
                      style={[
                        styles.actionCount,
                        liked && { color: "#EF4444" },
                      ]}
                    >
                      {post.likesCount || 0}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.mainAction}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color="#64748B"
                    />
                    <Text style={styles.actionCount}>
                      {post.commentsCount || 0}
                    </Text>
                  </View>

                  {isOwner && !post.solved && (
                    <TouchableOpacity
                      style={styles.solveBtn}
                      onPress={handleSolved}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="#10B981"
                      />
                      <Text style={styles.solveBtnText}>Solve</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {post.solved && (
                  <View style={styles.solvedBanner}>
                    <Ionicons name="checkmark-seal" size={18} color="#059669" />
                    <Text style={styles.solvedBannerText}>
                      Solution Found & Verified
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.sectionTitle}>Conversation</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CommentItem
              item={item}
              post={post}
              profile={profile}
              onReply={setReplyTo}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No replies yet. Start the conversation!
            </Text>
          }
        />

        {/* Dynamic Composer */}
        <View style={styles.composerWrapper}>
          {replyTo && (
            <View style={styles.replyBar}>
              <Text style={styles.replyBarText}>
                Replying to{" "}
                <Text style={{ fontWeight: "800" }}>{replyTo.authorName}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          {post.solved ? (
            <View style={styles.lockedInput}>
              <Ionicons name="lock-closed" size={16} color="#059669" />
              <Text style={styles.lockedText}>Discussion closed by author</Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <View style={{ flex: 1 }}>
                <InputField
                  value={comment}
                  onChangeText={setComment}
                  placeholder={
                    replyTo ? "Write a reply..." : "Share your thoughts..."
                  }
                />
              </View>
              <TouchableOpacity
                style={[styles.sendCircle, !comment.trim() && { opacity: 0.5 }]}
                onPress={handleComment}
                disabled={loading || !comment.trim()}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#94A3B8", fontWeight: "600" },
  headerSection: { paddingTop: 10 },
  postCard: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  authorInfo: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#FFF", fontWeight: "800", fontSize: 18 },
  authorName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  timeLabel: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  categoryBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  postTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
    lineHeight: 28,
  },
  postBody: { fontSize: 15, color: "#475569", lineHeight: 24 },
  actionRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    alignItems: "center",
  },
  mainAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    gap: 8,
  },
  actionCount: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  solveBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  solveBtnText: { color: "#10B981", fontWeight: "800", fontSize: 12 },
  solvedBanner: {
    marginTop: 15,
    backgroundColor: "#D1FAE5",
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  solvedBannerText: { color: "#065F46", fontWeight: "700", fontSize: 13 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginLeft: 20,
    marginBottom: 15,
  },
  commentWrapper: { marginBottom: 4 },
  threadContainer: { position: "relative" },
  verticalLine: {
    position: "absolute",
    left: -14,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#E2E8F0",
    borderRadius: 1,
  },
  commentCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  replyCard: { backgroundColor: "#F8FAFC" },
  expertCard: { borderColor: "#FDE68A", backgroundColor: "#FFFDF7" },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  commentAvatarText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  commentTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentAuthor: { fontSize: 14, fontWeight: "700", color: "#334155" },
  expertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expertText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },
  authorTag: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  commentTime: { fontSize: 11, color: "#94A3B8" },
  commentBody: { fontSize: 14, color: "#475569", lineHeight: 21 },
  replyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  replyBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  composerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  inputContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  sendCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  replyBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: 12,
    marginBottom: 10,
  },
  replyBarText: { fontSize: 12, color: "#64748B" },
  lockedInput: {
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  lockedText: { color: "#059669", fontWeight: "700", fontSize: 14 },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 40,
    fontWeight: "600",
  },
});
