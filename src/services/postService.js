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

  /* ----------------------------------------------
     HELP REQUEST NOTIFICATIONS
     (fan-out for matched expertise)
  ---------------------------------------------- */

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
          title: "New help request in your expertise",
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
      callback({
        id: snap.id,
        ...snap.data(),
      });
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

  if (!trimmedBody) {
    throw new Error("Comment cannot be empty.");
  }

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    throw new Error("Post not found.");
  }

  const post = postSnap.data();

  if (post.solved) {
    throw new Error("This problem is already solved. Replies are closed.");
  }

  const commentRef = await addDoc(collection(db, "comments"), {
    postId,
    authorId,
    authorName,
    body: trimmedBody,
    parentId,
    createdAt: serverTimestamp(),
  });

  /* update post stats */

  await updateDoc(postRef, {
    commentsCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  /* ----------------------------------------------
     NOTIFY POST OWNER
  ---------------------------------------------- */

  if (!parentId && post.authorId !== authorId) {
    try {
      await createNotification({
        receiverId: post.authorId,
        senderId: authorId,
        title: "Someone commented on your post",
        body: post.title,
        postId,
        type: "comment_on_post",
      });
    } catch (err) {
      console.log("Post owner notification failed:", err);
    }
  }

  /* ----------------------------------------------
     NOTIFY COMMENT AUTHOR
  ---------------------------------------------- */

  if (parentId) {
    try {
      const parentRef = doc(db, "comments", parentId);
      const parentSnap = await getDoc(parentRef);

      if (parentSnap.exists()) {
        const parent = parentSnap.data();

        if (parent.authorId !== authorId) {
          await createNotification({
            receiverId: parent.authorId,
            senderId: authorId,
            title: "Someone replied to your comment",
            body: trimmedBody.slice(0, 80),
            postId,
            type: "comment_reply",
          });
        }
      }
    } catch (err) {
      console.log("Reply notification failed:", err);
    }
  }

  return commentRef.id;
}

/* ------------------------------------------------
   COMMENT SUBSCRIPTION
------------------------------------------------ */

export function subscribeComments(postId, callback) {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    callback(comments);
  });
}

/* ------------------------------------------------
   COMMENT TREE BUILDER
------------------------------------------------ */

export function buildCommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });

  comments.forEach((c) => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

/* ------------------------------------------------
   POST LIKES
------------------------------------------------ */

export async function toggleLikePost(postId, userId) {
  const likeId = `${postId}_${userId}`;

  const likeRef = doc(db, "postLikes", likeId);
  const postRef = doc(db, "posts", postId);

  const likeSnap = await getDoc(likeRef);

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);

    await updateDoc(postRef, {
      likesCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    return false;
  }

  await setDoc(likeRef, {
    postId,
    userId,
    createdAt: serverTimestamp(),
  });

  await updateDoc(postRef, {
    likesCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  return true;
}

export function subscribeIsPostLiked(postId, userId, callback) {
  const likeId = `${postId}_${userId}`;

  return onSnapshot(doc(db, "postLikes", likeId), (snap) => {
    callback(snap.exists());
  });
}

/* ------------------------------------------------
   MARK POST SOLVED
------------------------------------------------ */

export async function markPostSolved(postId) {
  await updateDoc(doc(db, "posts", postId), {
    solved: true,
    status: "solved",
    updatedAt: serverTimestamp(),
  });
}
