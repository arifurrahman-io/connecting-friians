import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const FEEDBACK_REF = collection(db, "feedback");

// For Users to send feedback
export async function sendFeedback(uid, fullName, message) {
  return await addDoc(FEEDBACK_REF, {
    uid,
    fullName,
    message: message.trim(),
    createdAt: serverTimestamp(),
    status: "unread", // To help admin manage
  });
}

// For Admin to listen to feedback
export function subscribeToFeedback(callback) {
  const q = query(FEEDBACK_REF, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
}
