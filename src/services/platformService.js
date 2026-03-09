import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Fetches platform-wide statistics.
 * In a professional app, these are often cached in a 'metadata' doc
 * to avoid expensive counting queries on every load.
 */
export const getPlatformStats = async () => {
  try {
    // Recommendation: Point this to a single 'global_stats' document
    const statsDoc = await getDocs(collection(db, "platform_metadata"));

    if (!statsDoc.empty) {
      return statsDoc.docs[0].data();
    }

    // Fallback/Initial values if metadata doesn't exist yet
    return {
      activeUsers: "0",
      solvedCount: "0",
      expertCount: "0",
      collabCount: "0",
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
};

/**
 * Fetches the most recent activities across the platform.
 * This looks at a global 'activities' collection.
 */
export const getRecentActivity = async (itemLimit = 5) => {
  try {
    const activityRef = collection(db, "activities");
    const q = query(
      activityRef,
      orderBy("createdAt", "desc"),
      limit(itemLimit),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure timeAgo is handled (can use date-fns or similar)
      timeAgo: formatTimeAgo(doc.data().createdAt?.toDate()),
    }));
  } catch (error) {
    console.error("Error fetching activity:", error);
    return [];
  }
};

/**
 * Helper to turn timestamps into "2m ago" style strings
 */
const formatTimeAgo = (date) => {
  if (!date) return "Just now";
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};
