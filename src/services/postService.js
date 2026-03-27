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

  if (!trimmedTitle || !trimmedBody)
    throw new Error("Title and body are required.");

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

  try {
    await addDoc(collection(db, "activities"), {
      type: "post",
      category: primaryExpertiseName || "General",
      message: `${authorName} started a new discussion: "${trimmedTitle.slice(0, 35)}..."`,
      postId: postRef.id,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.log("Log failed", e);
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

  // 1. Delete all comments associated with this post
  const commentsQuery = query(
    collection(db, "comments"),
    where("postId", "==", postId),
  );
  const commentsSnap = await getDocs(commentsQuery);
  commentsSnap.forEach((d) => batch.delete(d.ref));

  // 2. Delete all likes associated with this post
  const likesQuery = query(
    collection(db, "postLikes"),
    where("postId", "==", postId),
  );
  const likesSnap = await getDocs(likesQuery);
  likesSnap.forEach((d) => batch.delete(d.ref));

  // 3. Delete the post itself
  batch.delete(postRef);

  // 4. Update Stats
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

// For Global Feed
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

// For Details Screen
export function subscribePost(postId, callback) {
  const postRef = doc(db, "posts", postId);
  return onSnapshot(postRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
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
  if (postSnap.data().solved) throw new Error("Discussion is closed.");

  const commentRef = await addDoc(collection(db, "comments"), {
    postId,
    authorId,
    authorName,
    body: trimmedBody,
    parentId,
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(db);
  batch.update(postRef, {
    commentsCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  batch.update(STATS_REF, { collabCount: increment(1) });
  await batch.commit();

  return commentRef.id;
}

export async function updateComment(commentId, newBody) {
  const commentRef = doc(db, "comments", commentId);
  await updateDoc(commentRef, {
    body: newBody.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(postId, commentId) {
  const batch = writeBatch(db);

  const allCommentsQuery = query(
    collection(db, "comments"),
    where("postId", "==", postId),
  );
  const snap = await getDocs(allCommentsQuery);
  const allComments = snap.docs.map((d) => ({
    id: d.id,
    parentId: d.parentId,
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
  await batch.commit();
}
