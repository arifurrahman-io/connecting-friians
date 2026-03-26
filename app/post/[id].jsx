import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
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
import { formatTimeAgo } from "../../src/utils/timeAgo";

// --- SUB-COMPONENT: COMMENT ITEM ---
function CommentItem({ item, post, profile, onReply, level = 0 }) {
  const isExpert = item.authorExpertise?.includes(post.primaryExpertiseName);
  const isAuthor = item.authorId === post.authorId;
  const isNested = level > 0;

  return (
    <View style={[styles.commentWrapper, { marginLeft: isNested ? 20 : 0 }]}>
      {/* Visual Thread Connector */}
      {isNested && <View style={styles.connectorLine} />}

      <View
        style={[
          styles.commentCard,
          isExpert && styles.expertCardGlow,
          isAuthor && styles.authorCardBorder,
        ]}
      >
        <View style={styles.commentHeader}>
          <View
            style={[
              styles.miniAvatar,
              { backgroundColor: isExpert ? "#F59E0B" : COLORS.primary + "20" },
            ]}
          >
            <Text
              style={[
                styles.miniAvatarText,
                { color: isExpert ? "#FFF" : COLORS.primary },
              ]}
            >
              {(item.authorName || "U")[0].toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.commentMetaRow}>
              <Text style={styles.commentAuthorName}>{item.authorName}</Text>
              {isExpert && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
              {isAuthor && (
                <View style={styles.opBadge}>
                  <Text style={styles.opText}>OP</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentDate}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={styles.commentContent}>{item.body}</Text>

        <View style={styles.commentFooter}>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onReply(item);
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.ghostBtnText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {item.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          item={reply}
          post={post}
          onReply={onReply}
          level={level + 1}
        />
      ))}
    </View>
  );
}

// --- MAIN SCREEN ---
export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  // 1. Data Subscriptions
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

  // 2. Logic: Build Threaded Tree
  const threadedComments = useMemo(
    () => buildCommentTree(comments),
    [comments],
  );

  // 3. Logic: Add Comment / Reply
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Logic: Toggle Like
  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleLikePost(id, user.uid);
  };

  // 5. Logic: Mark Solved
  const handleSolved = async () => {
    Alert.alert(
      "Mark as Solved?",
      "This will signal that the solution is verified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await markPostSolved(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  if (!post)
    return (
      <View style={styles.loader}>
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );

  const isOwner = user?.uid === post.authorId;

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={threadedComments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.mainPostSection}>
            {/* Top Meta Data */}
            <View style={styles.topMetaRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryLabel}>
                  {post.primaryExpertiseName}
                </Text>
              </View>
              {isOwner && !post.solved && (
                <TouchableOpacity
                  style={styles.solveBtn}
                  onPress={handleSolved}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color="#10B981"
                  />
                  <Text style={styles.solveBtnText}>Mark Solved</Text>
                </TouchableOpacity>
              )}
              {post.solved && (
                <View style={styles.solvedPill}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={14}
                    color="#059669"
                  />
                  <Text style={styles.solvedPillText}>Verified Solution</Text>
                </View>
              )}
            </View>

            <Text style={styles.ultraTitle}>{post.title}</Text>

            <View style={styles.authorBar}>
              <View style={styles.authorLeft}>
                <View style={styles.mainAvatar}>
                  <Text style={styles.mainAvatarText}>
                    {(post.authorName || "U")[0]}
                  </Text>
                </View>
                <View>
                  <Text style={styles.mainAuthorName}>{post.authorName}</Text>
                  <Text style={styles.mainDate}>
                    {formatTimeAgo(post.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.ultraBody}>{post.body}</Text>

            <View style={styles.interactionBar}>
              <TouchableOpacity
                style={[styles.actionPill, liked && styles.activeLikePill]}
                onPress={handleLike}
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={18}
                  color={liked ? "#EF4444" : "#64748B"}
                />
                <Text style={[styles.pillText, liked && { color: "#EF4444" }]}>
                  {post.likesCount || 0}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionPill}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={18}
                  color="#64748B"
                />
                <Text style={styles.pillText}>{post.commentsCount || 0}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.convoHeader}>Discussion</Text>
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
            No replies yet. Be the first to help!
          </Text>
        }
      />

      {/* Floating Modern Composer */}
      <BlurView
        intensity={90}
        tint="extraLight"
        style={styles.composerContainer}
      >
        {replyTo && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyPreviewText} numberOfLines={1}>
              Replying to{" "}
              <Text style={{ fontWeight: "800", color: COLORS.primary }}>
                {replyTo.authorName}
              </Text>
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {post.solved ? (
          <View style={styles.lockedInput}>
            <Ionicons name="lock-closed" size={16} color="#059669" />
            <Text style={styles.lockedText}>This discussion is closed.</Text>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <InputField
                value={comment}
                onChangeText={setComment}
                placeholder={
                  replyTo ? "Write a reply..." : "Add to the discussion..."
                }
                containerStyle={styles.modernInput}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, !comment.trim() && styles.disabledSend]}
              onPress={handleComment}
              disabled={!comment.trim() || loading}
            >
              <Ionicons name="arrow-up" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  loadingText: { color: "#94A3B8", fontWeight: "600" },
  listContent: { paddingBottom: 160 },

  /* Post Header Section */
  mainPostSection: { paddingHorizontal: 20, paddingTop: 20 },
  topMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  solveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  solveBtnText: { color: "#10B981", fontWeight: "800", fontSize: 11 },

  solvedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  solvedPillText: { color: "#166534", fontWeight: "700", fontSize: 11 },

  ultraTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 32,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  authorBar: { marginBottom: 20 },
  authorLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  mainAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  mainAvatarText: { color: "#FFF", fontWeight: "700", fontSize: 18 },
  mainAuthorName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  mainDate: { fontSize: 12, color: "#94A3B8", marginTop: 2 },

  ultraBody: {
    fontSize: 16,
    color: "#334155",
    lineHeight: 25,
    marginBottom: 24,
  },
  interactionBar: { flexDirection: "row", gap: 10, marginBottom: 24 },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeLikePill: { backgroundColor: "#FEF2F2" },
  pillText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 20 },
  convoHeader: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },

  /* Comment UI */
  commentWrapper: { marginBottom: 12, position: "relative" },
  connectorLine: {
    position: "absolute",
    left: -10,
    top: 0,
    bottom: 20,
    width: 2,
    backgroundColor: "#E2E8F0",
    borderBottomLeftRadius: 10,
  },
  commentCard: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4,
  },
  expertCardGlow: {
    backgroundColor: "#FFFDF7",
    borderColor: "#FDE68A",
    borderWidth: 1,
  },
  authorCardBorder: { borderColor: COLORS.primary + "30", borderWidth: 1 },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  miniAvatarText: { fontSize: 12, fontWeight: "800" },
  commentMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentAuthorName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  proBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: { fontSize: 8, fontWeight: "900", color: "#B45309" },
  opBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  opText: { fontSize: 8, fontWeight: "900", color: "#FFF" },
  commentDate: { fontSize: 11, color: "#94A3B8" },
  commentContent: { fontSize: 15, color: "#475569", lineHeight: 22 },
  commentFooter: { marginTop: 12 },
  ghostBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  ghostBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 40,
    fontSize: 14,
  },

  /* Composer UI */
  composerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.5)",
  },
  replyPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 12,
  },
  replyPreviewText: { fontSize: 12, color: "#475569", flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputWrapper: { flex: 1 },
  modernInput: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { height: 4, width: 0 },
  },
  disabledSend: { backgroundColor: "#E2E8F0" },
  lockedInput: {
    backgroundColor: "#DCFCE7",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  lockedText: { color: "#166534", fontWeight: "700", fontSize: 13 },
});
