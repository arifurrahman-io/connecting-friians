import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/config";
import { createNotification } from "./notificationService";

// Consistent reference for the dynamic Bento grid stats
const STATS_REF = doc(db, "platform_metadata", "global_metrics");

/* ------------------------------------------------
   CREATE POST
------------------------------------------------ */

export async function createPost({
  authorId,
  authorName,
  title,
  body,
  primaryExpertiseName,
  primaryExpertiseId,
}) {
  const trimmedTitle = title?.trim();
  const trimmedBody = body?.trim();

  if (!trimmedTitle || !trimmedBody) {
    throw new Error("Title and body are required.");
  }

  // 1. Create the Post
  const postRef = await addDoc(collection(db, "posts"), {
    authorId,
    authorName,
    title: trimmedTitle,
    body: trimmedBody,
    primaryExpertiseName,
    primaryExpertiseId,
    status: "open",
    commentsCount: 0,
    likesCount: 0,
    solved: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. DYNAMIC SYNC: Log Activity for the Global Feed
  try {
    await addDoc(collection(db, "activities"), {
      type: "post",
      category: primaryExpertiseName || "General",
      message: `${authorName} started a new discussion: "${trimmedTitle.slice(0, 35)}..."`,
      postId: postRef.id,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.log("Activity log failed", e);
  }

  // 3. Expertise Fan-out Notifications
  try {
    const q = query(
      collection(db, "users"),
      where("expertise", "array-contains", primaryExpertiseName),
    );

    const snap = await getDocs(q);
    const notifications = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((user) => user.id !== authorId)
      .map((user) =>
        createNotification({
          receiverId: user.id,
          senderId: authorId,
          title: "New challenge in your field",
          body: trimmedTitle,
          postId: postRef.id,
          type: "matched_expertise_post",
        }),
      );

    await Promise.all(notifications);
  } catch (error) {
    console.log("Expertise notification error:", error);
  }

  return postRef.id;
}

/* ------------------------------------------------
   POSTS SUBSCRIPTIONS
------------------------------------------------ */

export function subscribePosts(callback) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(posts);
  });
}

export function subscribePost(postId, callback) {
  return onSnapshot(doc(db, "posts", postId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    }
  });
}

/* ------------------------------------------------
   COMMENTS + REPLIES
------------------------------------------------ */

export async function addComment({
  postId,
  authorId,
  authorName,
  body,
  parentId = null,
}) {
  const trimmedBody = body?.trim();
  if (!trimmedBody) throw new Error("Comment cannot be empty.");

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) throw new Error("Post not found.");
  const post = postSnap.data();
  if (post.solved) throw new Error("This discussion is closed.");

  // 1. Add Comment
  const commentRef = await addDoc(collection(db, "comments"), {
    postId,
    authorId,
    authorName,
    body: trimmedBody,
    parentId,
    createdAt: serverTimestamp(),
  });

  // 2. DYNAMIC SYNC: Update Local Post and Global Collaboration Count
  try {
    await updateDoc(postRef, {
      commentsCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Update the "Collabs" box on the Home Screen
    await updateDoc(STATS_REF, {
      collabCount: increment(1),
    });
  } catch (err) {
    console.warn("Global stats update failed:", err);
  }

  // 3. Notifications logic
  if (!parentId && post.authorId !== authorId) {
    await createNotification({
      receiverId: post.authorId,
      senderId: authorId,
      title: "New feedback on your request",
      body: trimmedBody.slice(0, 50),
      postId,
      type: "comment_on_post",
    });
  }

  return commentRef.id;
}

/* ------------------------------------------------
   SUBSCRIPTIONS & UTILS
------------------------------------------------ */

export function subscribeComments(postId, callback) {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function buildCommentTree(comments) {
  const map = {};
  const roots = [];
  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });
  comments.forEach((c) => {
    if (c.parentId && map[c.parentId]) map[c.parentId].replies.push(map[c.id]);
    else roots.push(map[c.id]);
  });
  return roots;
}

/* ------------------------------------------------
   LIKES
------------------------------------------------ */

export async function toggleLikePost(postId, userId) {
  const likeId = `${postId}_${userId}`;
  const likeRef = doc(db, "postLikes", likeId);
  const postRef = doc(db, "posts", postId);
  const likeSnap = await getDoc(likeRef);

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(postRef, { likesCount: increment(-1) });
    return false;
  }

  await setDoc(likeRef, { postId, userId, createdAt: serverTimestamp() });
  await updateDoc(postRef, { likesCount: increment(1) });
  return true;
}

export function subscribeIsPostLiked(postId, userId, callback) {
  return onSnapshot(doc(db, "postLikes", `${postId}_${userId}`), (snap) => {
    callback(snap.exists());
  });
}

/* ------------------------------------------------
   MARK POST SOLVED
------------------------------------------------ */

export async function markPostSolved(postId) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) return;
  const postData = postSnap.data();

  // 1. Update the Post Status
  await updateDoc(postRef, {
    solved: true,
    status: "solved",
    updatedAt: serverTimestamp(),
  });

  // 2. DYNAMIC SYNC: Increment the "Solved" count on Home Screen
  try {
    await updateDoc(STATS_REF, {
      solvedCount: increment(1),
    });
  } catch (err) {
    console.error("Stats solvedCount sync failed:", err);
  }

  // 3. LOG ACTIVITY: Broadcast the success to the Live Updates feed
  try {
    await addDoc(collection(db, "activities"), {
      type: "solved",
      category: postData.primaryExpertiseName || "Success",
      message: `Success! ${postData.authorName}'s challenge was marked Solved.`,
      postId: postId,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.log("Activity log failed", err);
  }
}
