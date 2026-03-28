import {
  addDoc,
  arrayUnion,
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
   PUSH TOKEN MANAGEMENT (NEW)
------------------------------------------------ */
/**
 * Saves a device's push token to the user's profile.
 * Uses arrayUnion to support users logged into multiple devices.
 */
export async function saveDeviceToken(uid, token) {
  if (!uid || !token) return;
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      tokenUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving device token:", error);
  }
}

/* ------------------------------------------------
   CREATE NOTIFICATION (Internal App Feed)
------------------------------------------------ */
export async function createNotification({
  receiverId,
  senderId,
  title,
  body,
  postId = "",
  type = "general",
}) {
  if (receiverId === senderId) return; // Prevent self-notifications

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
        createdAt: d.data().createdAt?.toDate() || new Date(), // Handle sync lag
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
export function subscribeUnreadCount(uid, callback) {
  const q = query(
    collection(db, "notifications"),
    where("receiverId", "==", uid),
    where("isRead", "==", false),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size); // Returns unread count for the bell icon dot
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

  await batch.commit(); // Efficiently clear all alerts
}
