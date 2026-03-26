import { getAuth } from "firebase/auth"; // Correct v9+ import
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Creates a formal report for a User, Post, or Comment.
 * @param {Object} reportData - The report details
 */
export async function createReport({
  targetType, // 'user', 'post', or 'comment'
  targetId, // ID of the specific content/user being reported
  targetOwnerId = null, // ID of the user who owns the reported content
  reason, // Brief reason (e.g., "Spam", "Harassment")
  details = "", // Long-form description
}) {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // 1. Check Auth State
    if (!currentUser) {
      throw new Error("You must be signed in to submit a report.");
    }

    // 2. Data Validation
    if (!targetType || !targetId || !reason) {
      throw new Error("Missing required reporting fields.");
    }

    // 3. Document Creation
    const reportPayload = {
      reporterId: currentUser.uid,
      reporterEmail: currentUser.email, // Helpful for admin review
      targetType,
      targetId,
      targetOwnerId,
      reason: reason.trim(),
      details: details.trim(),
      status: "open", // Options: open, under-review, resolved, dismissed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "reports"), reportPayload);

    console.log("Report successfully created with ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Report Service Error:", error);
    throw error; // Re-throw to be caught by the UI Alert
  }
}
