import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLL_NAME = "expertise_categories";

/**
 * Service to manage expertise categories dynamically.
 * Uses Firestore Document IDs as the unique identifier for posts and profiles.
 */
export const ExpertiseService = {
  /**
   * Listen to categories in real-time.
   * Returns an array of objects: { id, name, slug, createdAt }
   */
  subscribeCategories: (callback) => {
    const q = query(collection(db, COLL_NAME), orderBy("name", "asc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const cats = snapshot.docs.map((d) => ({
          id: d.id, // THE UNIQUE ID (e.g., GwmaLDN...)
          ...d.data(),
        }));
        callback(cats);
      },
      (error) => {
        console.error("Expertise Subscription Error:", error);
      },
    );
  },

  /**
   * Adds a new category to the platform.
   * @param {string} name - Display name (e.g., "Web Development")
   */
  addCategory: async (name) => {
    if (!name.trim()) throw new Error("Category name cannot be empty");

    return await addDoc(collection(db, COLL_NAME), {
      name: name.trim(),
      // Slug is kept for URL/Deep-linking purposes, but ID is used for logic
      slug: name.toLowerCase().trim().replace(/\s+/g, "-"),
      createdAt: serverTimestamp(),
    });
  },

  /**
   * Updates an existing category's name.
   * Note: This only updates the category metadata.
   * It does not automatically update strings in existing posts/profiles.
   */
  updateCategory: async (id, newName) => {
    const ref = doc(db, COLL_NAME, id);
    return await updateDoc(ref, {
      name: newName.trim(),
      slug: newName.toLowerCase().trim().replace(/\s+/g, "-"),
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Permanently deletes a category.
   */
  deleteCategory: async (id) => {
    return await deleteDoc(doc(db, COLL_NAME, id));
  },
};
