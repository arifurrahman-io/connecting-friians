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

/* ------------------------------------------------
   GET SINGLE USER PROFILE
------------------------------------------------ */
export async function getUserProfile(uid) {
  if (!uid) return null;
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

/* ------------------------------------------------
   REALTIME SINGLE USER PROFILE
------------------------------------------------ */
export function subscribeUserProfile(uid, callback) {
  if (!uid) return () => {};
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

/* ------------------------------------------------
   UPDATE USER PROFILE + SYNC STATS
------------------------------------------------ */
/**
 * Updates user profile and manages global metrics (Active Users & Expert Count).
 * Payload should now contain category IDs in the 'expertise' array.
 */
export async function updateUserProfile(uid, payload) {
  if (!uid) throw new Error("UID is required");

  const userRef = doc(db, "users", uid);

  try {
    const currentSnap = await getDoc(userRef);
    const oldData = currentSnap.data() || {};

    // 1. Completion Logic
    const wasCompleted = oldData.profileCompleted === true;
    const isNowCompleting = payload.profileCompleted === true;

    // 2. Expert Logic (Based on the existence of expertise IDs)
    const wasExpert = (oldData.expertise?.length || 0) > 0;
    const isNowExpert = (payload.expertise?.length || 0) > 0;

    const updateData = {
      ...payload,
      updatedAt: serverTimestamp(),
    };

    const statsUpdate = {};

    // Logic: Increment activeUsers only once when profile is first completed
    if (!wasCompleted && isNowCompleting) {
      statsUpdate.activeUsers = increment(1);

      // Record Activity Feed for the new member
      await addDoc(collection(db, "activities"), {
        type: "join",
        message: `${payload.fullName || "A member"} just joined the directory!`,
        userId: uid,
        createdAt: serverTimestamp(),
      });
    }

    // Logic: Manage Expert Count in global stats
    if (!wasExpert && isNowExpert) {
      statsUpdate.expertCount = increment(1);
    } else if (wasExpert && !isNowExpert) {
      statsUpdate.expertCount = increment(-1);
    }

    // Update Global Metrics if needed
    if (Object.keys(statsUpdate).length > 0) {
      await setDoc(STATS_REF, statsUpdate, { merge: true });
    }

    // Save User Profile
    await setDoc(userRef, updateData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Profile update failed:", error);
    throw error;
  }
}

/* ------------------------------------------------
   SUBSCRIBE ALL USERS (Directory)
------------------------------------------------ */
export function subscribeUsers(callback) {
  // Only show profiles that are actually setup
  const q = query(
    collection(db, "users"),
    where("profileCompleted", "==", true),
    orderBy("fullName"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const users = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(users);
    },
    (err) => {
      console.error("Directory subscription failed:", err);
    },
  );
}

/* ------------------------------------------------
   SEARCH USERS BY EXPERTISE ID
------------------------------------------------ */
/**
 * Search users based on Expertise ID (the Document ID from expertise_categories).
 */
export async function searchUsersByExpertise(expertiseId) {
  if (!expertiseId) return [];

  const q = query(
    collection(db, "users"),
    where("profileCompleted", "==", true),
    where("expertise", "array-contains", expertiseId), // SEARCH BY UNIQUE ID
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    console.error("Search by expertise ID failed:", error);
    return [];
  }
}
