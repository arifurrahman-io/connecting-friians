import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

const COLL_NAME = "expertise_categories";

export const ExpertiseService = {
  // Listen to categories in real-time
  subscribeCategories: (callback) => {
    const q = query(collection(db, COLL_NAME), orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(cats);
    });
  },

  addCategory: async (name) => {
    return await addDoc(collection(db, COLL_NAME), {
      name: name.trim(),
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    });
  },

  updateCategory: async (id, newName) => {
    const ref = doc(db, COLL_NAME, id);
    return await updateDoc(ref, {
      name: newName.trim(),
      slug: newName.toLowerCase().replace(/\s+/g, "-"),
    });
  },

  deleteCategory: async (id) => {
    return await deleteDoc(doc(db, COLL_NAME, id));
  },
};
