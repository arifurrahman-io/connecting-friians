import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import Animated, { FadeIn } from "react-native-reanimated";
import { useAuth } from "../../src/context/AuthContext";
import { ExpertiseService } from "../../src/services/ExpertiseService";
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
    <View style={[styles.commentWrapper, { marginLeft: isNested ? 16 : 0 }]}>
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
                    <Text style={styles.opText}>OP</Text>
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
                <Ionicons name="create-outline" size={16} color="#64748B" />
              </TouchableOpacity>
            )}
            {(isAdmin || isCommentOwner) && (
              <TouchableOpacity
                onPress={() => onDelete(post.id, item.id)}
                style={styles.actionIconBtn}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
            <Ionicons
              name="arrow-undo-outline"
              size={14}
              color={COLORS.primary}
            />
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
  const flatListRef = useRef(null);

  const [post, setPost] = useState(null);
  const [masterCategories, setMasterCategories] = useState([]);
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
    const unsubCats = ExpertiseService.subscribeCategories(setMasterCategories);
    let unsubLiked;
    if (user?.uid) unsubLiked = subscribeIsPostLiked(id, user.uid, setLiked);

    return () => {
      unsubPost?.();
      unsubComments?.();
      unsubCats?.();
      unsubLiked?.();
    };
  }, [id, user?.uid]);

  const dynamicCategoryName = useMemo(() => {
    if (!post) return "...";
    const match = masterCategories.find(
      (cat) => cat.id === post.primaryExpertiseId,
    );
    return match ? match.name : post.primaryExpertiseName || "Discussion";
  }, [masterCategories, post]);

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
        authorName: profile?.fullName || "Member",
        body: comment,
        parentId: replyTo?.id || null,
      });
      setComment("");
      setReplyTo(null);
      Keyboard.dismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 300);
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

  if (!post)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  const isOwner = user?.uid === post.authorId;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // Offset for Header height + Safe area
        keyboardVerticalOffset={Platform.OS === "ios" ? 110 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={threadedComments}
          keyExtractor={(item) => item.id}
          // Remove huge paddingBottom since composer is now in the flow
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <View style={styles.metaRow}>
                <View style={[styles.badge, post.solved && styles.solvedBadge]}>
                  <Text
                    style={[
                      styles.badgeText,
                      post.solved && styles.solvedBadgeText,
                    ]}
                  >
                    {post.solved ? "Resolved" : dynamicCategoryName}
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
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  )}
                  {isAdmin && (
                    <TouchableOpacity
                      onPress={() => deletePost(id)}
                      style={styles.actionIconBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
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
              </View>

              <Text style={styles.bodyText}>{post.body}</Text>

              <View style={styles.statsBar}>
                <TouchableOpacity
                  style={[styles.statBtn, liked && styles.statBtnLiked]}
                  onPress={() => toggleLikePost(id, user.uid)}
                >
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={20}
                    color={liked ? "#EF4444" : "#64748B"}
                  />
                  <Text
                    style={[styles.statBtnText, liked && { color: "#EF4444" }]}
                  >
                    {post.likesCount || 0}
                  </Text>
                </TouchableOpacity>
                {isOwner && !post.solved && (
                  <TouchableOpacity
                    style={styles.solveActionBtn}
                    onPress={() => markPostSolved(id)}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#FFF"
                    />
                    <Text style={styles.solveActionBtnText}>Mark Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.sectionDivider} />
              <Text style={styles.commentHeading}>
                {comments.length} Responses
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <CommentItem
              item={item}
              post={post}
              isAdmin={isAdmin}
              currentUserId={user?.uid}
              onReply={setReplyTo}
              onDelete={deleteComment}
              onEdit={openEditModal}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubbles-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyCommentsText}>
                Be the first to respond
              </Text>
            </View>
          }
        />

        {/* INPUT COMPOSER - Pushed up by KeyboardAvoidingView */}
        {post.solved ? (
          <View style={styles.solvedFooter}>
            <BlurView intensity={80} tint="light" style={styles.solvedBlur}>
              <Ionicons name="lock-closed" size={16} color="#64748B" />
              <Text style={styles.solvedFooterText}>
                This discussion has been resolved.
              </Text>
            </BlurView>
          </View>
        ) : (
          <BlurView
            intensity={100}
            tint="light"
            style={styles.composerContainer}
          >
            {replyTo && (
              <Animated.View entering={FadeIn} style={styles.replyBanner}>
                <Text style={styles.replyBannerText}>
                  Replying to{" "}
                  <Text style={{ fontWeight: "800" }}>
                    {replyTo.authorName}
                  </Text>
                </Text>
                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </Animated.View>
            )}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputField}
                placeholder={
                  replyTo ? "Write a reply..." : "Add to the discussion..."
                }
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={1000}
                onFocus={() =>
                  setTimeout(() => flatListRef.current?.scrollToEnd(), 200)
                }
              />
              <TouchableOpacity
                style={[styles.sendBtn, !comment.trim() && { opacity: 0.4 }]}
                onPress={handleComment}
                disabled={!comment.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        )}
      </KeyboardAvoidingView>

      {/* EDIT MODAL */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>
              {editingItem ? "Edit Response" : "Edit Post"}
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
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdate}
                style={styles.btnPrimary}
              >
                <Text style={styles.btnPrimaryText}>Update</Text>
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
  listContent: { paddingBottom: 24 }, // Smaller padding needed now
  headerSection: { padding: 24, paddingBottom: 0 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  solvedBadge: { backgroundColor: "#DCFCE7" },
  solvedBadgeText: { color: "#15803D" },
  headerActions: { flexDirection: "row", gap: 10 },
  actionIconBtn: { padding: 4 },
  titleText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 36,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  authorInfo: { flexDirection: "row", alignItems: "center" },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  smallAvatarText: { color: "#FFF", fontSize: 14, fontWeight: "900" },
  authorNameText: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  dotSeparator: { marginHorizontal: 8, color: "#CBD5E1" },
  timeAgoText: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  bodyText: {
    fontSize: 16,
    color: "#334155",
    lineHeight: 26,
    marginBottom: 30,
    fontWeight: "500",
  },
  statsBar: { flexDirection: "row", alignItems: "center", gap: 12 },
  statBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  statBtnLiked: { backgroundColor: "#FEE2E2" },
  statBtnText: { fontSize: 14, fontWeight: "900", color: "#64748B" },
  solveActionBtn: {
    marginLeft: "auto",
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  solveActionBtnText: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  sectionDivider: { height: 1, backgroundColor: "#F1F5F9", marginTop: 32 },
  commentHeading: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 24,
    marginBottom: 8,
  },
  commentWrapper: { paddingHorizontal: 24, marginTop: 20 },
  connectorLine: {
    position: "absolute",
    left: -12,
    top: 0,
    bottom: 20,
    width: 2,
    backgroundColor: "#F1F5F9",
    borderRadius: 1,
  },
  commentCard: { marginBottom: 2 },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  commentUserInfo: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatarSquircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "900" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  commentAuthorName: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  opBadge: {
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  opText: { fontSize: 9, fontWeight: "900", color: COLORS.primary },
  commentDate: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  commentContent: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    fontWeight: "500",
  },
  replyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  replyActionText: { fontSize: 13, fontWeight: "900", color: COLORS.primary },

  composerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFFFA",
    // Remove position: absolute to allow flex flow with KeyboardAvoidingView
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
  },
  replyBannerText: { fontSize: 12, color: "#64748B" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    maxHeight: 120,
    paddingVertical: 8,
    fontWeight: "500",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },

  solvedFooter: { padding: 20, paddingBottom: Platform.OS === "ios" ? 40 : 20 },
  solvedBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#F8FAFCF0",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  solvedFooterText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "800",
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    minHeight: 150,
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  btnPrimaryText: { color: "#FFF", fontWeight: "900", fontSize: 15 },
  btnSecondary: { paddingHorizontal: 20, paddingVertical: 14 },
  btnSecondaryText: { color: "#64748B", fontWeight: "800", fontSize: 15 },
  emptyComments: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyCommentsText: { fontSize: 14, color: "#94A3B8", fontWeight: "700" },
});
