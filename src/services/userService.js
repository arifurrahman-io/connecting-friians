import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

/* -----------------------------
   GET SINGLE USER PROFILE
----------------------------- */
export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

/* -----------------------------
   REALTIME SINGLE USER PROFILE
----------------------------- */
export function subscribeUserProfile(uid, callback) {
  const ref = doc(db, "users", uid);

  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    });
  });
}

/* -----------------------------
   UPDATE USER PROFILE
----------------------------- */
export async function updateUserProfile(uid, payload) {
  const ref = doc(db, "users", uid);

  await updateDoc(ref, {
    ...payload,
    profileCompleted: true,
    updatedAt: serverTimestamp(),
  });
}

/* -----------------------------
   SUBSCRIBE ALL USERS
----------------------------- */
export function subscribeUsers(callback) {
  const q = query(collection(db, "users"), orderBy("fullName"));

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    callback(users);
  });
}

/* -----------------------------
   SEARCH USERS BY EXPERTISE
----------------------------- */
export async function searchUsersByExpertise(expertiseName) {
  const q = query(
    collection(db, "users"),
    where("expertise", "array-contains", expertiseName),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
