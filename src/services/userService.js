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
  if (!uid) throw new Error("UID is required for profile update");

  const userRef = doc(db, "users", uid);

  try {
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

    // 3. DYNAMIC SYNC LOGIC (Updates Global Bento Grid Stats)
    const statsUpdate = {};

    // A. If first time completing profile (New Active User)
    if (!wasCompleted && payload.profileCompleted) {
      statsUpdate.activeUsers = increment(1);

      // Log activity to the feed
      await addDoc(collection(db, "activities"), {
        type: "join",
        message: `${payload.fullName || "A new member"} joined the community!`,
        userId: uid,
        createdAt: serverTimestamp(),
      });
    }

    // B. EXPERT COUNT SYNC
    if (!wasExpert && isNowExpert) {
      statsUpdate.expertCount = increment(1);
    } else if (wasExpert && !isNowExpert) {
      statsUpdate.expertCount = increment(-1);
    }

    // Apply stats update to platform_metadata if changes exist
    if (Object.keys(statsUpdate).length > 0) {
      try {
        await setDoc(STATS_REF, statsUpdate, { merge: true });
      } catch (e) {
        console.warn("Stats update failed, continuing profile save:", e);
      }
    }

    // 4. Update the User Document
    // Using setDoc with merge: true is safer than updateDoc for first-time saves
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
