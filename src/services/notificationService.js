import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Creates an in-app notification.
 * userId: The recipient's UID
 * senderId: The person triggering the notification
 */
export async function createNotification({
  userId,
  senderId,
  title,
  body,
  postId = "",
  type = "general",
}) {
  // Guard: Don't notify yourself or empty users
  if (!userId || userId === senderId) return null;

  try {
    const notifData = {
      userId,
      senderId: senderId || "system",
      title: title.trim(),
      body: body.trim(),
      postId: String(postId), // Ensure it's a string for router.push
      type,
      isRead: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "notifications"), notifData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Real-time listener for the Notifications Screen list.
 */
export function subscribeNotifications(uid, callback) {
  if (!uid) return () => {};

  // Matches the composite index: userId (asc) + createdAt (desc)
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50), // Performance optimization: only show latest 50
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        // Firestore server timestamps can be null briefly during sync
        createdAt: d.data().createdAt?.toDate() || new Date(),
      }));
      callback(list);
    },
    (error) => {
      console.error("Subscription Error (Check Rules/Indexes):", error.code);
    },
  );
}

/**
 * Real-time unread count for badge icons.
 */
export function subscribeUnreadCount(uid, callback) {
  if (!uid) return () => {};

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    where("isRead", "==", false),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.size);
    },
    (error) => {
      console.error("Unread count error:", error);
    },
  );
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId) {
  if (!notificationId) return;
  const ref = doc(db, "notifications", notificationId);
  try {
    await updateDoc(ref, {
      isRead: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Single mark read failed:", error);
  }
}

/**
 * Batch update to clear all unread notifications.
 * Limits to 450 to stay safely under Firestore's 500-limit per batch.
 */
export async function markAllNotificationsRead(uid) {
  if (!uid) return;

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", uid),
    where("isRead", "==", false),
    limit(450),
  );

  try {
    const snapshot = await getDocs(q);

    if (snapshot.empty) return true;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, {
        isRead: true,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Batch clear failed:", error);
    throw error;
  }
}
