import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export async function createNotification({
  receiverId,
  senderId,
  title,
  body,
  postId = "",
  type = "general",
}) {
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
}

export function subscribeNotifications(uid, callback) {
  const q = query(
    collection(db, "notifications"),
    where("receiverId", "==", uid),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, "notifications", notificationId), {
    isRead: true,
  });
}
