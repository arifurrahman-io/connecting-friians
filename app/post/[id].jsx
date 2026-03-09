import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import InputField from "../../src/components/InputField";
import PrimaryButton from "../../src/components/PrimaryButton";
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
import { timeAgo } from "../../src/utils/timeAgo";

function CommentItem({ item, post, profile, onReply, level = 0 }) {
  // Check if the author of THIS comment is an expert for THIS post's category
  // Assuming comment data might include author info or we derive it
  const isExpert = item.authorExpertise?.includes(post.primaryExpertiseName);

  return (
    <View style={styles.commentWrapper}>
      {/* 1. INDENTATION & THREAD LINE WRAPPER */}
      <View
        style={[
          styles.threadContainer,
          { marginLeft: level > 0 ? level * 20 : 16 },
        ]}
      >
        {/* Visual Line for replies */}
        {level > 0 && <View style={styles.verticalLine} />}

        <View style={[styles.commentCard, level > 0 && styles.replyCard]}>
          <View style={styles.commentHeader}>
            <View
              style={[
                styles.commentAvatar,
                level > 0 && { width: 28, height: 28, borderRadius: 14 },
              ]}
            >
              <Text
                style={[
                  styles.commentAvatarText,
                  level > 0 && { fontSize: 12 },
                ]}
              >
                {(item.authorName || "F")[0].toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.commentTopRow}>
                <Text style={styles.commentAuthor}>{item.authorName}</Text>
                {isExpert && (
                  <View style={styles.expertBadge}>
                    <Text style={styles.expertText}>Expert</Text>
                  </View>
                )}
              </View>
              <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>

          <Text style={styles.commentBody}>{item.body}</Text>

          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => onReply(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.replyBtnText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. RECURSIVE REPLIES (Rendered outside the parent card but inside the wrapper) */}
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

  const handleReply = (commentItem) => setReplyTo(commentItem);
  const handleCancelReply = () => setReplyTo(null);

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
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await toggleLikePost(id, user.uid);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleSolved = async () => {
    try {
      await markPostSolved(id);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  const isOwner = user?.uid === post.authorId;

  return (
    <View style={styles.container}>
      <FlatList
        data={threadedComments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.postCard}>
              <View style={styles.header}>
                <View style={styles.authorRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(post.authorName || "F")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.author}>{post.authorName}</Text>
                    <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {post.primaryExpertiseName}
                  </Text>
                </View>
              </View>

              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.body}>{post.body}</Text>

              {post.solved && (
                <View style={styles.solvedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                  <Text style={styles.solvedText}>Solved</Text>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={22}
                    color={liked ? "#DC2626" : "#64748B"}
                  />
                  <Text
                    style={[styles.actionText, liked && { color: "#DC2626" }]}
                  >
                    {post.likesCount || 0}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionBtn}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color="#64748B"
                  />
                  <Text style={styles.actionText}>
                    {post.commentsCount || 0}
                  </Text>
                </View>

                {isOwner && !post.solved && (
                  <TouchableOpacity
                    style={styles.solveActionBtn}
                    onPress={handleSolved}
                  >
                    <Ionicons
                      name="checkmark-done-circle"
                      size={20}
                      color="#15803D"
                    />
                    <Text style={styles.solveActionText}>Mark Solved</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={styles.commentTitle}>Conversation</Text>
          </>
        }
        renderItem={({ item }) => (
          <CommentItem
            item={item}
            post={post}
            profile={profile}
            onReply={handleReply}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Be the first to reply!</Text>
        }
      />

      {/* COMPOSER DYNAMIC STYLING */}
      <View style={styles.composerWrapper}>
        {replyTo && (
          <View style={styles.replyingBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.replyingLabel}>
                Replying to{" "}
                <Text style={styles.replyingName}>{replyTo.authorName}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={handleCancelReply}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {post?.solved ? (
          <View style={styles.closedBox}>
            <Ionicons name="lock-closed" size={16} color="#15803D" />
            <Text style={styles.closedText}>
              Post Solved - Discussion Closed
            </Text>
          </View>
        ) : (
          <View style={styles.composerInner}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputField
                value={comment}
                onChangeText={setComment}
                placeholder={
                  replyTo
                    ? `Reply to ${replyTo.authorName}...`
                    : "Write a reply..."
                }
              />
            </View>
            <PrimaryButton
              title={replyTo ? "Send" : "Post"}
              onPress={handleComment}
              loading={loading}
              style={{ paddingHorizontal: 20 }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#94A3B8", fontWeight: "600" },

  // Post Card UI
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    // Modern shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  authorRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  author: { fontWeight: "700", color: "#1E293B", fontSize: 15 },
  time: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  // categoryBadge: {
  //   paddingHorizontal: 2,
  //   paddingVertical: 2,
  //   borderRadius: 12,
  // },
  categoryText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 7,
    textAlign: "right",
    backgroundColor: "#EEF2FF",
    padding: 3,
    borderRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    color: "#0F172A",
    lineHeight: 28,
  },
  body: { fontSize: 14, lineHeight: 17, color: "#475569" },

  // Comments UI
  commentTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 15,
    marginHorizontal: 20,
    color: "#1E293B",
  },
  commentWrapper: { width: "100%" },
  threadContainer: { position: "relative", marginRight: 16 },
  verticalLine: {
    position: "absolute",
    left: -12,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#E2E8F0",
    borderRadius: 1,
  },
  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  replyCard: { backgroundColor: "#FDFDFD", borderColor: "#E2E8F0" },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentTopRow: { flexDirection: "row", alignItems: "center" },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  commentAvatarText: { fontWeight: "700", color: "#64748B", fontSize: 14 },
  commentAuthor: {
    fontWeight: "700",
    color: "#334155",
    marginRight: 8,
    fontSize: 13,
  },
  commentTime: { fontSize: 11, color: "#94A3B8" },
  commentBody: { fontSize: 14, color: "#475569", lineHeight: 20 },
  expertBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expertText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },
  replyBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
  },
  replyBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },

  // Actions
  actions: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", marginRight: 25 },
  actionText: {
    marginLeft: 8,
    fontWeight: "700",
    color: "#64748B",
    fontSize: 14,
  },
  solveActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  solveActionText: {
    marginLeft: 6,
    fontWeight: "700",
    color: "#15803D",
    fontSize: 13,
  },
  solvedBadge: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  solvedText: {
    marginLeft: 6,
    color: "#15803D",
    fontWeight: "800",
    fontSize: 12,
  },

  // Composer
  composerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  composerInner: { flexDirection: "row", alignItems: "center" },
  replyingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  replyingLabel: { fontSize: 12, color: "#64748B" },
  replyingName: { fontWeight: "700", color: COLORS.primary },
  closedBox: {
    padding: 12,
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  closedText: { color: "#15803D", fontWeight: "700", fontSize: 14 },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 40,
    fontWeight: "600",
  },
});
