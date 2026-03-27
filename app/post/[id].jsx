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
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import {
  addComment,
  buildCommentTree,
  deleteComment,
  deletePost,
  markPostSolved,
  subscribeComments,
  subscribeIsPostLiked,
  subscribePost,
  toggleLikePost,
  updateComment,
  updatePost,
} from "../../src/services/postService";
import { COLORS } from "../../src/theme/colors";
import { formatTimeAgo } from "../../src/utils/timeAgo";

// --- SUB-COMPONENT: COMMENT ITEM ---
function CommentItem({
  item,
  post,
  isAdmin,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
}) {
  const isPostAuthor = item.authorId === post.authorId;
  const isCommentOwner = item.authorId === currentUserId;
  const isNested = item.parentId !== null;

  return (
    <View style={[styles.commentWrapper, { marginLeft: isNested ? 12 : 0 }]}>
      {isNested && <View style={styles.connectorLine} />}

      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={styles.commentUserInfo}>
            <View
              style={[
                styles.avatarSquircle,
                { backgroundColor: isPostAuthor ? COLORS.primary : "#F1F5F9" },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: isPostAuthor ? "#FFF" : COLORS.primary },
                ]}
              >
                {item.authorName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <View style={styles.nameRow}>
                <Text style={styles.commentAuthorName}>{item.authorName}</Text>
                {isPostAuthor && (
                  <View style={styles.opBadge}>
                    <Text style={styles.opText}>Author</Text>
                  </View>
                )}
              </View>
              <Text style={styles.commentDate}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.commentActions}>
            {isCommentOwner && !post.solved && (
              <TouchableOpacity
                onPress={() => onEdit(item)}
                style={styles.actionIconBtn}
              >
                <Ionicons name="create-outline" size={18} color="#1a2cd1" />
              </TouchableOpacity>
            )}
            {(isAdmin || isCommentOwner) && (
              <TouchableOpacity
                onPress={() => onDelete(post.id, item.id)} // FIXED: Pass both IDs
                style={styles.actionIconBtn}
              >
                <Ionicons name="trash-sharp" size={18} color="#ff354d" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.commentContent}>{item.body}</Text>

        {!post.solved && (
          <TouchableOpacity
            style={styles.replyAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onReply(item);
            }}
          >
            <Text style={styles.replyActionText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          item={reply}
          post={post}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </View>
  );
}

// --- MAIN SCREEN ---
export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, profile, isAdmin } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    const unsubPost = subscribePost(id, (data) => {
      if (!data) router.back();
      setPost(data);
    });
    const unsubComments = subscribeComments(id, setComments);
    let unsubLiked;
    if (user?.uid) unsubLiked = subscribeIsPostLiked(id, user.uid, setLiked);

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
    if (!comment.trim() || post.solved) return;
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

  const openEditModal = (item = null) => {
    setEditingItem(item);
    setEditBody(item ? item.body : post.body);
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editBody.trim()) return;
    try {
      setLoading(true);
      if (editingItem) {
        await updateComment(editingItem.id, editBody);
      } else {
        await updatePost(id, { body: editBody.trim() });
      }
      setEditModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = () => {
    Alert.alert("Delete Post", "Permanently remove this discussion?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            router.back();
            await deletePost(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            Alert.alert("Error", error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteComment = async (postId, commentId) => {
    Alert.alert("Remove Response", "Delete this comment and its replies?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteComment(postId, commentId); // Correctly passing both IDs
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (error) {
            Alert.alert("Error", "Could not delete comment.");
          }
        },
      },
    ]);
  };

  const handleMarkSolved = async () => {
    try {
      await markPostSolved(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Could not mark as solved.");
    }
  };

  if (!post)
    return (
      <View style={styles.loader}>
        <Text>Loading...</Text>
      </View>
    );

  const isOwner = user?.uid === post.authorId;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={threadedComments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <View style={styles.metaRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {post.primaryExpertiseName}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  {(isAdmin || isOwner) && (
                    <TouchableOpacity
                      onPress={() => openEditModal(null)}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color="#1a2cd1"
                      />
                    </TouchableOpacity>
                  )}
                  {isAdmin && (
                    <TouchableOpacity
                      onPress={handleDeletePost}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons name="trash-sharp" size={20} color="#ff354d" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={styles.titleText}>{post.title}</Text>

              <View style={styles.authorRow}>
                <View style={styles.authorInfo}>
                  <View style={styles.smallAvatar}>
                    <Text style={styles.smallAvatarText}>
                      {post.authorName?.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.authorNameText}>{post.authorName}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.timeAgoText}>
                    {formatTimeAgo(post.createdAt)}
                  </Text>
                </View>
                {post.solved && (
                  <View style={styles.solvedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#10B981"
                    />
                    <Text style={styles.solvedText}>Solved</Text>
                  </View>
                )}
              </View>

              <Text style={styles.bodyText}>{post.body}</Text>

              <View style={styles.statsBar}>
                <TouchableOpacity
                  style={[styles.statItem, liked && styles.statItemActive]}
                  onPress={() => toggleLikePost(id, user.uid)}
                >
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={18}
                    color={liked ? "#EF4444" : "#64748B"}
                  />
                  <Text
                    style={[styles.statText, liked && { color: "#EF4444" }]}
                  >
                    {post.likesCount || 0}
                  </Text>
                </TouchableOpacity>
                <View style={styles.statItem}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color="#64748B"
                  />
                  <Text style={styles.statText}>{post.commentsCount || 0}</Text>
                </View>
                {isOwner && !post.solved && (
                  <TouchableOpacity
                    style={styles.solveActionBtn}
                    onPress={handleMarkSolved}
                  >
                    <Text style={styles.solveActionBtnText}>
                      Resolve Challenge
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.sectionDivider} />
            </View>
          }
          renderItem={({ item }) => (
            <CommentItem
              item={item}
              post={post}
              isAdmin={isAdmin}
              currentUserId={user?.uid}
              onReply={setReplyTo}
              onDelete={handleDeleteComment}
              onEdit={openEditModal}
            />
          )}
        />

        {post.solved ? (
          <View style={styles.solvedFooter}>
            <BlurView intensity={60} tint="light" style={styles.solvedBlur}>
              <Ionicons name="lock-closed" size={16} color="#64748B" />
              <Text style={styles.solvedFooterText}>
                This discussion is closed.
              </Text>
            </BlurView>
          </View>
        ) : (
          <BlurView intensity={80} tint="light" style={styles.composerWrapper}>
            {replyTo && (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText}>
                  Replying to{" "}
                  <Text style={{ fontWeight: "700" }}>
                    {replyTo.authorName}
                  </Text>
                </Text>
                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Ionicons name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="Write a response..."
                value={comment}
                onChangeText={setComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendCircle, !comment.trim() && { opacity: 0.5 }]}
                onPress={handleComment}
                disabled={!comment.trim() || loading}
              >
                <Ionicons name="arrow-up" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </BlurView>
        )}
      </KeyboardAvoidingView>

      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} style={StyleSheet.absoluteFill} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalHeader}>
              {editingItem ? "Edit Response" : "Edit Discussion"}
            </Text>
            <TextInput
              style={styles.modalInput}
              multiline
              value={editBody}
              onChangeText={setEditBody}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.btnSecondary}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdate}
                style={styles.btnPrimary}
              >
                <Text style={{ color: "#FFF", fontWeight: "600" }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 160 },
  headerSection: { padding: 24, paddingTop: 20 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerActions: { flexDirection: "row", gap: 8 },
  actionIconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  titleText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 34,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  authorInfo: { flexDirection: "row", alignItems: "center" },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  smallAvatarText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  authorNameText: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  dotSeparator: { marginHorizontal: 8, color: "#CBD5E1" },
  timeAgoText: { fontSize: 13, color: "#94A3B8" },
  bodyText: {
    fontSize: 17,
    color: "#334155",
    lineHeight: 26,
    marginBottom: 28,
  },
  statsBar: { flexDirection: "row", alignItems: "center", gap: 10 },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  statItemActive: { backgroundColor: "#FEF2F2" },
  statText: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  solveActionBtn: {
    marginLeft: "auto",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  solveActionBtnText: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  solvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  solvedText: { fontSize: 12, fontWeight: "800", color: "#10B981" },
  sectionDivider: { height: 1.5, backgroundColor: "#F8FAFC", marginTop: 32 },
  commentWrapper: { paddingHorizontal: 20, marginTop: 24 },
  connectorLine: {
    position: "absolute",
    left: -8,
    top: 0,
    bottom: 24,
    width: 2,
    backgroundColor: "#F1F5F9",
    borderRadius: 1,
  },
  commentCard: { marginBottom: 4 },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  commentUserInfo: { flexDirection: "row", gap: 12 },
  avatarSquircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "800" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  commentAuthorName: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  commentDate: { fontSize: 12, color: "#94A3B8" },
  commentActions: { flexDirection: "row", gap: 4 },
  opBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  opText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  commentContent: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    paddingLeft: 48,
  },
  replyAction: { paddingLeft: 48, marginTop: 12 },
  replyActionText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  composerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputField: { flex: 1, fontSize: 15, color: "#1E293B", maxHeight: 100 },
  sendCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  replyBannerText: { fontSize: 12, color: "#64748B" },
  solvedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  solvedBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  solvedFooterText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
    marginLeft: 8,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 18,
    minHeight: 180,
    fontSize: 16,
    color: "#334155",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnSecondary: { paddingHorizontal: 20, paddingVertical: 16 },
});
