import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Path for dynamic bento grid stats
const STATS_REF = doc(db, "platform_metadata", "global_metrics");

/* -----------------------------
   GET SINGLE USER PROFILE
----------------------------- */
export async function getUserProfile(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

/* -----------------------------
   REALTIME SINGLE USER PROFILE
----------------------------- */
export function subscribeUserProfile(uid, callback) {
  const ref = doc(db, "users", uid);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback({ id: snapshot.id, ...snapshot.data() });
    },
    (err) => console.error("User sub error:", err),
  );
}

/* -----------------------------
   UPDATE USER PROFILE + SYNC STATS
----------------------------- */
export async function updateUserProfile(uid, payload) {
  if (!uid) throw new Error("UID is required");

  const userRef = doc(db, "users", uid);

  try {
    const currentSnap = await getDoc(userRef);
    const oldData = currentSnap.data() || {};

    const wasCompleted = oldData.profileCompleted === true; // Strict check
    const isNowCompleting = payload.profileCompleted === true;

    const wasExpert = (oldData.expertise?.length || 0) > 0;
    const isNowExpert = (payload.expertise?.length || 0) > 0;

    const updateData = {
      ...payload,
      updatedAt: serverTimestamp(),
    };

    const statsUpdate = {};

    // Only increment activeUsers IF they were not completed before AND are now
    if (!wasCompleted && isNowCompleting) {
      statsUpdate.activeUsers = increment(1);

      await addDoc(collection(db, "activities"), {
        type: "join",
        message: `${payload.fullName || "A new member"} just completed their profile!`,
        userId: uid,
        createdAt: serverTimestamp(),
      });
    }

    // Expert count logic
    if (!wasExpert && isNowExpert) {
      statsUpdate.expertCount = increment(1);
    } else if (wasExpert && !isNowExpert) {
      statsUpdate.expertCount = increment(-1);
    }

    if (Object.keys(statsUpdate).length > 0) {
      // Use the correct ID "global_metrics" as per your code
      await setDoc(STATS_REF, statsUpdate, { merge: true });
    }

    await setDoc(userRef, updateData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Profile update failed:", error);
    throw error;
  }
}

/* -----------------------------
   SUBSCRIBE ALL USERS (Dynamic List)
----------------------------- */
export function subscribeUsers(callback) {
  // Only showing completed profiles for a better UI experience
  const q = query(
    collection(db, "users"),
    where("profileCompleted", "==", true),
    orderBy("fullName"),
  );

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
    where("profileCompleted", "==", true),
    where("expertise", "array-contains", expertiseName),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}
