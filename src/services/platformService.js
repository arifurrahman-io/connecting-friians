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
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Consistent path for global metadata
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
    (snapshot) => {
      if (!snapshot.exists()) {
        // If document is missing, return zeros rather than trying to create it
        // Creating the global_metrics doc should be an Admin-only task
        callback({
          activeUsers: 0,
          solvedCount: 0,
          expertCount: 0,
          collabCount: 0,
        });
        return;
      }
      callback(snapshot.data());
    },
    (error) => {
      // This is where the [code=permission-denied] is caught
      console.error("Stats Subscription Error:", error);
      callback({ error: error.message });
    },
  );
};

/**
 * Listens to the activities collection for the live feed.
 */
export const subscribeToRecentActivity = (callback) => {
  const activityRef = collection(db, "activities");
  // Ensure "createdAt" is indexed in Firebase Console for this query
  const q = query(activityRef, orderBy("createdAt", "desc"), limit(6));

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        // Handle potential null createdAt during server latency
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
 * Used when a user joins, a post is created, or a problem is solved.
 */
export const updateGlobalMetric = async (field, value = 1) => {
  const docRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  try {
    await updateDoc(docRef, {
      [field]: increment(value),
      lastUpdated: serverTimestamp(),
    });
  } catch (err) {
    // If this fails, it's likely a rules issue with 'global_metrics' update permissions
    console.error(`Failed to increment ${field}:`, err);
  }
};

/**
 * Utility: Fetch stats once without a listener.
 */
export const getPlatformStatsOnce = async () => {
  const docRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  try {
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Fetch stats failed:", err);
    return null;
  }
};
