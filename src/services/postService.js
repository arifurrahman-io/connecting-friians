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
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/config";

const STATS_REF = doc(db, "platform_metadata", "global_metrics");

/* ------------------------------------------------
   POST MANAGEMENT
------------------------------------------------ */

/**
 * Creates a new post and triggers expert notifications based on Category ID.
 */
export async function createPost({
  authorId,
  authorName,
  title,
  body,
  primaryExpertiseName,
  primaryExpertiseId, // NOW USING UNIQUE ID FROM DB
}) {
  const trimmedTitle = title?.trim();
  const trimmedBody = body?.trim();

  if (!trimmedTitle || !trimmedBody)
    throw new Error("Title and body are required.");

  // 1. Create the Post Document
  const postRef = await addDoc(collection(db, "posts"), {
    authorId,
    authorName,
    title: trimmedTitle,
    body: trimmedBody,
    primaryExpertiseName, // Keep name for display
    primaryExpertiseId, // Use ID for logic/filtering
    status: "open",
    commentsCount: 0,
    likesCount: 0,
    solved: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Secondary Actions: Activity Feed & Expert Notifications
  try {
    const batch = writeBatch(db);

    // Record Global Activity
    const activityRef = doc(collection(db, "activities"));
    batch.set(activityRef, {
      type: "post",
      category: primaryExpertiseName || "General",
      message: `${authorName} started a new discussion: "${trimmedTitle.slice(0, 35)}..."`,
      postId: postRef.id,
      createdAt: serverTimestamp(),
    });

    // FIND EXPERTS BY ID (Instead of Name)
    // Your User profiles should now store IDs in their 'expertise' array
    const expertsQuery = query(
      collection(db, "users"),
      where("expertise", "array-contains", primaryExpertiseId),
    );

    const expertsSnap = await getDocs(expertsQuery);

    expertsSnap.forEach((expertDoc) => {
      // Don't notify the person who wrote the post
      if (expertDoc.id !== authorId) {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          userId: expertDoc.id,
          type: "matched_expertise_post",
          title: "Expertise Match! 🚀",
          body: `${authorName} needs help with ${primaryExpertiseName}`,
          postId: postRef.id,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }
    });

    await batch.commit();
  } catch (e) {
    console.error("Post secondary actions (Batch) failed:", e);
  }

  return postRef.id;
}

export async function updatePost(postId, updates) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) return;
  const postData = postSnap.data();
  const batch = writeBatch(db);

  // 1. Delete associated data (Comments, Likes, Notifications)
  const collections = ["comments", "postLikes", "notifications"];
  for (const col of collections) {
    const q = query(collection(db, col), where("postId", "==", postId));
    const snap = await getDocs(q);
    snap.forEach((d) => batch.delete(d.ref));
  }

  // 2. Delete the Post itself
  batch.delete(postRef);

  // 3. Update Platform Stats
  batch.update(STATS_REF, {
    collabCount: increment(-(postData.commentsCount || 0)),
    ...(postData.solved && { solvedCount: increment(-1) }),
  });

  await batch.commit();
  return true;
}

/* ------------------------------------------------
   SUBSCRIPTIONS
------------------------------------------------ */

export function subscribePosts(callback) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribePost(postId, callback) {
  return onSnapshot(doc(db, "posts", postId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

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

/* ------------------------------------------------
   COMMENTS & REPLIES
------------------------------------------------ */

export async function addComment({
  postId,
  authorId,
  authorName,
  body,
  parentId = null,
}) {
  const trimmedBody = body?.trim();
  if (!trimmedBody) throw new Error("Empty comment.");

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) throw new Error("Post not found.");
  const postData = postSnap.data();
  if (postData.solved) throw new Error("Discussion is closed.");

  const commentRef = await addDoc(collection(db, "comments"), {
    postId,
    authorId,
    authorName,
    body: trimmedBody,
    parentId,
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(db);

  // Update Counters
  batch.update(postRef, {
    commentsCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  batch.update(STATS_REF, { collabCount: increment(1) });

  // 1. Notify Post Owner
  if (postData.authorId !== authorId) {
    const notifRef = doc(collection(db, "notifications"));
    batch.set(notifRef, {
      userId: postData.authorId,
      type: "comment_on_post",
      title: "New Response 💬",
      body: `${authorName} commented on your post`,
      postId,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  }

  // 2. Notify Parent Comment Author (if this is a nested reply)
  if (parentId) {
    const parentSnap = await getDoc(doc(db, "comments", parentId));
    const parentData = parentSnap.data();
    if (
      parentData &&
      parentData.authorId !== authorId &&
      parentData.authorId !== postData.authorId
    ) {
      const replyNotifRef = doc(collection(db, "notifications"));
      batch.set(replyNotifRef, {
        userId: parentData.authorId,
        type: "comment_reply",
        title: "New Reply ↩️",
        body: `${authorName} replied to your comment`,
        postId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
  return commentRef.id;
}

export async function updateComment(commentId, newBody) {
  await updateDoc(doc(db, "comments", commentId), {
    body: newBody.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(postId, commentId) {
  const batch = writeBatch(db);
  const snap = await getDocs(
    query(collection(db, "comments"), where("postId", "==", postId)),
  );

  const allComments = snap.docs.map((d) => ({
    id: d.id,
    parentId: d.get("parentId"),
    ref: d.ref,
  }));

  const toDeleteRefs = [];
  const findChildren = (id) => {
    const target = allComments.find((c) => c.id === id);
    if (!target) return;
    toDeleteRefs.push(target.ref);
    allComments
      .filter((c) => c.parentId === id)
      .forEach((child) => findChildren(child.id));
  };

  findChildren(commentId);
  const count = toDeleteRefs.length;
  toDeleteRefs.forEach((ref) => batch.delete(ref));

  batch.update(doc(db, "posts", postId), { commentsCount: increment(-count) });
  batch.update(STATS_REF, { collabCount: increment(-count) });
  await batch.commit();
}

/**
 * Helper to build recursive comment structure for UI
 */
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
   LIKES & SOLVE
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

/**
 * Marks a post as solved and notifies the author.
 */
export async function markPostSolved(postId) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists() || postSnap.data().solved) return;

  const batch = writeBatch(db);
  batch.update(postRef, {
    solved: true,
    status: "solved",
    updatedAt: serverTimestamp(),
  });
  batch.update(STATS_REF, { solvedCount: increment(1) });

  const participantNotif = doc(collection(db, "notifications"));
  batch.set(participantNotif, {
    userId: postSnap.data().authorId,
    type: "solved",
    title: "Challenge Solved! 🎉",
    body: `Your discussion "${postSnap.data().title.slice(0, 20)}..." is now marked as solved.`,
    postId,
    isRead: false,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}
