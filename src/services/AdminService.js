import {
  collection,
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
   * Automatically detects if the target is a post, comment, or user
   */
  deleteReportedContent: async (report) => {
    const { targetId, targetType, id: reportId } = report;
    const batch = writeBatch(db);

    // 1. Delete the actual content based on type
    const contentRef = doc(db, `${targetType}s`, targetId); // pluralizes 'post' to 'posts'
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
    const collections = ["posts", "comments"];

    for (const col of collections) {
      const q = query(collection(db, col), where("userId", "==", userId));
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
    // Note: incrementing on client-side requires the current count
    // For a more dynamic feel, we use a generic flag
    await updateDoc(userRef, {
      hasWarning: true,
      lastWarningReason: reason,
      updatedAt: serverTimestamp(),
    });
  },
};
