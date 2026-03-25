import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Consistent path for global metadata (matching your Firestore screenshot)
const STATS_DOC_ID = "global_metrics";
const STATS_COLLECTION = "platform_metadata";

/**
 * Listens to Platform Statistics.
 * Provides real-time updates for the Home Screen Bento grid.
 */
export const subscribeToPlatformStats = (callback) => {
  const docRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);

  return onSnapshot(
    docRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        console.warn("Stats document missing. Initializing global_metrics...");

        const initialData = {
          activeUsers: 0,
          solvedCount: 0,
          expertCount: 0,
          collabCount: 0,
          lastUpdated: serverTimestamp(),
        };

        try {
          // Use setDoc with {merge: true} to avoid overwriting if it was created mid-flight
          await setDoc(docRef, initialData, { merge: true });
          callback(initialData);
        } catch (err) {
          console.error(
            "Critical: Check Firebase Rules for platform_metadata.",
            err,
          );
          callback({ error: "Permission Denied" });
        }
        return;
      }

      callback(snapshot.data());
    },
    (error) => {
      console.error("Stats Subscription Error:", error);
      callback({ error: error.message });
    },
  );
};

/**
 * Listens to the activities collection for the live feed.
 * Returns the 6 most recent events.
 */
export const subscribeToRecentActivity = (callback) => {
  const activityRef = collection(db, "activities");
  const q = query(activityRef, orderBy("createdAt", "desc"), limit(6));

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        // Ensure formatTimeAgo has a valid date even during sync
        createdAt: d.data().createdAt?.toDate() || new Date(),
      }));
      callback(activities);
    },
    (error) => {
      console.error("Activity Feed Error:", error);
      callback([]);
    },
  );
};

/**
 * Helper: Record a new community activity.
 * This makes the "Live Updates" section move!
 * @param {string} message - e.g., "John solved a React issue"
 * @param {string} type - 'join' | 'solved' | 'post'
 */
export const recordActivity = async (message, type = "post") => {
  try {
    await addDoc(collection(db, "activities"), {
      message,
      type,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to record activity:", err);
  }
};

/**
 * Helper: Atomic Increment for global stats.
 * Call this when a user joins or a post is solved.
 * @param {string} field - 'activeUsers' | 'solvedCount' | 'expertCount' | 'collabCount'
 */
export const updateGlobalMetric = async (field, value = 1) => {
  const docRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  try {
    await updateDoc(docRef, {
      [field]: increment(value),
      lastUpdated: serverTimestamp(),
    });
  } catch (err) {
    console.error(`Failed to increment ${field}:`, err);
  }
};

/**
 * Utility: Fetch stats once without a listener.
 */
export const getPlatformStatsOnce = async () => {
  const docRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};
