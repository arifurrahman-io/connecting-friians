import auth from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export async function createReport({
  targetType,
  targetId,
  targetOwnerId = null,
  reason,
  details = "",
}) {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error("Unauthorized");

  await addDoc(collection(db, "reports"), {
    reporterId: currentUser.uid,
    targetType,
    targetId,
    targetOwnerId,
    reason,
    details,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
