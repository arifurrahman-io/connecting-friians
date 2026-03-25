import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

const STATS_REF = doc(db, "platform_metadata", "global_metrics");

/**
 * Registers a new user with fail-safe database and email logic.
 */
export async function registerUser({ name, email, password }) {
  // 1. Create the Auth Account
  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  const user = result.user;
  const trimmedName = name.trim();

  // 2. CREATE FIRESTORE PROFILE (Crucial step)
  // We do this first so the user record exists immediately.
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name: trimmedName,
    email: email.trim().toLowerCase(),
    phone: "",
    gender: "",
    sscYear: "",
    sscRoll: "",
    lastEducationInstitute: "",
    lastEducationDepartment: "",
    completionYear: "",
    expertise: [],
    profileCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 3. SEND VERIFICATION EMAIL
  // We move this up so it triggers even if the "Stats" logic below fails.
  try {
    await sendEmailVerification(user);
  } catch (emailErr) {
    console.error("Verification email failed to send:", emailErr);
    // We don't throw here, because the account and profile are already created.
  }

  // 4. DYNAMIC SYNC (The "Stats" logic)
  // We wrap this in a try/catch so a missing 'global_metrics' doc doesn't break registration.
  try {
    await updateDoc(STATS_REF, {
      activeUsers: increment(1),
    });

    await addDoc(collection(db, "activities"), {
      type: "join",
      message: `Welcome to the community, ${trimmedName}!`,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // If this fails, it's usually because the document 'global_metrics' hasn't been created yet manually.
    console.warn(
      "Dynamic stats sync skipped: ensure platform_metadata/global_metrics exists.",
      err,
    );
  }

  return user;
}

/**
 * Logs in user and ensures fresh profile state.
 */
export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);

  // Force reload to pick up the verification status change
  await result.user.reload();

  if (!result.user.emailVerified) {
    throw new Error(
      "Please verify your email first. Check your inbox (and spam).",
    );
  }

  return result.user;
}

export async function forgotPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser() {
  await signOut(auth);
}
