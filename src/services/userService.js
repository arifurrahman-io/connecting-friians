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
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Consistent path for your dynamic bento grid stats
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
  const userRef = doc(db, "users", uid);

  // 1. Get current snapshot to compare old vs new state
  const currentSnap = await getDoc(userRef);
  const oldData = currentSnap.data() || {};

  const wasCompleted = oldData.profileCompleted || false;
  const wasExpert = oldData.expertise?.length > 0;
  const isNowExpert = payload.expertise?.length > 0;

  // 2. Prepare update object
  const updateData = {
    ...payload,
    updatedAt: serverTimestamp(),
  };

  // 3. DYNAMIC SYNC LOGIC
  try {
    const statsUpdate = {};

    // A. If first time completing profile
    if (!wasCompleted && payload.profileCompleted) {
      // Note: activeUsers is usually handled at registration,
      // but we can increment here if you only count "completed" profiles.
      // statsUpdate.activeUsers = increment(1);

      await addDoc(collection(db, "activities"), {
        type: "join",
        message: `${payload.fullName || "A new member"} completed their profile!`,
        userId: uid,
        createdAt: serverTimestamp(),
      });
    }

    // B. EXPERT COUNT SYNC: If they just added their first expertise
    if (!wasExpert && isNowExpert) {
      statsUpdate.expertCount = increment(1);

      await addDoc(collection(db, "activities"), {
        type: "join", // Using join icon for new experts
        message: `${payload.fullName || "Someone"} just became a verified Expert!`,
        userId: uid,
        createdAt: serverTimestamp(),
      });
    }
    // If they removed all expertise (unlikely but safe to handle)
    else if (wasExpert && !isNowExpert) {
      statsUpdate.expertCount = increment(-1);
    }

    // Apply stats update if any changes exist
    if (Object.keys(statsUpdate).length > 0) {
      await updateDoc(STATS_REF, statsUpdate);
    }

    // 4. Update the User Document
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Dynamic sync failed in profile update:", error);
    // Fallback: still try to update the user profile even if stats fail
    await updateDoc(userRef, updateData);
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
