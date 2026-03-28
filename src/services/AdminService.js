import * as Linking from "expo-linking";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const AdminService = {
  /**
   * DYNAMIC CONTENT REMOVAL
   * Automatically detects if the target is a post, comment, user, or feedback
   */
  deleteReportedContent: async (report) => {
    const { targetId, targetType, id: reportId } = report;
    const batch = writeBatch(db);

    // 1. Delete the actual content based on type
    // Handles 'post' -> 'posts', 'comment' -> 'comments', 'feedback' -> 'feedback'
    const collectionName = targetType.endsWith("s")
      ? targetType
      : `${targetType}s`;
    const contentRef = doc(db, collectionName, targetId);
    batch.delete(contentRef);

    // 2. Mark the report as resolved
    const reportRef = doc(db, "reports", reportId);
    batch.update(reportRef, {
      status: "resolved",
      resolvedAt: serverTimestamp(),
      actionTaken: "deleted_content",
    });

    // 3. Clean up any OTHER reports pointing to the same deleted content
    const otherReportsQuery = query(
      collection(db, "reports"),
      where("targetId", "==", targetId),
    );
    const snapshot = await getDocs(otherReportsQuery);
    snapshot.forEach((reportDoc) => {
      batch.delete(doc(db, "reports", reportDoc.id));
    });

    await batch.commit();
  },

  /**
   * USER OPINION / FEEDBACK MANAGEMENT
   */

  // Delete a specific feedback entry
  deleteFeedback: async (feedbackId) => {
    const feedbackRef = doc(db, "feedback", feedbackId);
    await deleteDoc(feedbackRef);
  },

  // Helper to reply via Email directly from Dashboard
  replyToUser: (email, userName, originalMessage) => {
    const subject = encodeURIComponent("Response to your FRIIANS Feedback");
    const body = encodeURIComponent(
      `Hello ${userName},\n\nThank you for your feedback: "${originalMessage}"\n\n---\nAdmin Response:\n`,
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  },

  /**
   * USER MODERATION
   */

  // Toggle Block (Hard Ban)
  toggleUserBlock: async (userId, shouldBlock) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isBlocked: shouldBlock,
      status: shouldBlock ? "banned" : "active",
      updatedAt: serverTimestamp(),
    });
  },

  // Shadow Ban (Dynamic UI filter)
  toggleShadowBan: async (userId, isShadowBanned) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isShadowBanned,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * BULK OPERATIONS
   */

  // Clean sweep of a spammer's content
  deleteAllUserContent: async (userId) => {
    const batch = writeBatch(db);
    const collections = ["posts", "comments", "feedback"];

    for (const col of collections) {
      // Note: Filter field is authorId in posts/comments, but uid in feedback
      const field = col === "feedback" ? "uid" : "authorId";
      const q = query(collection(db, col), where(field, "==", userId));
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => batch.delete(doc(db, col, d.id)));
    }

    await batch.commit();
  },

  /**
   * REPORT STATUS MANAGEMENT
   */

  // Dismiss a report (Mark as resolved without deleting)
  dismissReport: async (reportId) => {
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status: "resolved",
      resolvedAt: serverTimestamp(),
      actionTaken: "dismissed",
    });
  },

  // Warn User
  warnUser: async (userId, reason) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      hasWarning: true,
      lastWarningReason: reason,
      updatedAt: serverTimestamp(),
    });
  },
};
