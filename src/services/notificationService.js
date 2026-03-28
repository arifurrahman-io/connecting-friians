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
   PUSH TOKEN MANAGEMENT
   Used to link physical device tokens to user profiles
   for Firebase Cloud Messaging (FCM).
------------------------------------------------ */

/**
 * Saves a device's push token to the user's profile in Firestore.
 * Uses arrayUnion to support users logged into multiple devices simultaneously.
 * @param {string} uid - The unique ID of the authenticated user.
 * @param {string} token - The FCM/Expo push token from the device.
 */
export async function saveDeviceToken(uid, token) {
  if (!uid || !token) return;
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token), // Stores multiple tokens per user
      tokenUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving device token:", error);
  }
}

/* ------------------------------------------------
   INTERNAL NOTIFICATION FEED (In-App)
   Handles the logic for the notifications tab.
------------------------------------------------ */

/**
 * Creates a notification document in the Firestore "notifications" collection.
 * This triggers the in-app feed for the receiver.
 */
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

/**
 * Listens for real-time updates to a user's notification list.
 * Typically used in the Notifications screen.
 */
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
        createdAt: d.data().createdAt?.toDate() || new Date(), // Handle potential sync lag
      }));
      callback(list);
    },
    (error) => {
      console.error("Notification subscription error:", error);
    },
  );
}

/**
 * Provides a real-time count of unread notifications.
 * Ideal for displaying a badge on the UI bell icon or tab bar.
 */
export function subscribeUnreadCount(uid, callback) {
  const q = query(
    collection(db, "notifications"),
    where("receiverId", "==", uid),
    where("isRead", "==", false),
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size); // Returns the numeric count of unread docs
  });
}

/* ------------------------------------------------
   NOTIFICATION STATE MANAGEMENT
------------------------------------------------ */

/**
 * Marks a specific notification as read.
 */
export async function markNotificationRead(notificationId) {
  const ref = doc(db, "notifications", notificationId);
  try {
    await updateDoc(ref, {
      isRead: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Marks all notifications for a specific user as read using a batch update.
 * Efficiently clears all alerts at once.
 */
export async function markAllNotificationsRead(uid) {
  const q = query(
    collection(db, "notifications"),
    where("receiverId", "==", uid),
    where("isRead", "==", false),
  );

  try {
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true, updatedAt: serverTimestamp() });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}
