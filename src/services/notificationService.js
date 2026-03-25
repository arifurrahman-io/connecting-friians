import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";

/* ------------------------------------------------
   CREATE NOTIFICATION
------------------------------------------------ */
export async function createNotification({
  receiverId,
  senderId,
  title,
  body,
  postId = "",
  type = "general", // e.g., 'comment_on_post', 'matched_expertise_post', 'solved'
}) {
  // Prevent sending notifications to yourself
  if (receiverId === senderId) return;

  try {
    await addDoc(collection(db, "notifications"), {
      receiverId,
      senderId,
      title,
      body,
      postId,
      type,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/* ------------------------------------------------
   SUBSCRIBE TO NOTIFICATIONS (Real-time Feed)
------------------------------------------------ */
export function subscribeNotifications(uid, callback) {
  const q = query(
    collection(db, "notifications"),
    where("receiverId", "==", uid),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        // Ensure date is handled if serverTimestamp hasn't synced yet
        createdAt: d.data().createdAt?.toDate() || new Date(),
      }));
      callback(list);
    },
    (error) => {
      console.error("Notification subscription error:", error);
    },
  );
}

/* ------------------------------------------------
   SUBSCRIBE TO UNREAD COUNT (For UI Bell Icon)
------------------------------------------------ */
/**
 * This is crucial for your dynamic header.
 * Use this to show the "activeDot" on your bell icon.
 */
export function subscribeUnreadCount(uid, callback) {
  const q = query(
    collection(db, "notifications"),
    where("receiverId", "==", uid),
    where("isRead", "==", false),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size); // Returns the number of unread notifications
  });
}

/* ------------------------------------------------
   MARK SINGLE AS READ
------------------------------------------------ */
export async function markNotificationRead(notificationId) {
  const ref = doc(db, "notifications", notificationId);
  await updateDoc(ref, {
    isRead: true,
    updatedAt: serverTimestamp(),
  });
}

/* ------------------------------------------------
   MARK ALL AS READ (Batch Update)
------------------------------------------------ */
/**
 * Improves UX by allowing users to clear all alerts at once.
 */
export async function markAllNotificationsRead(uid) {
  const q = query(
    collection(db, "notifications"),
    where("receiverId", "==", uid),
    where("isRead", "==", false),
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((d) => {
    batch.update(d.ref, { isRead: true, updatedAt: serverTimestamp() });
  });

  await batch.commit();
}
