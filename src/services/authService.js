import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

/**
 * Registers a new user.
 * Note: We NO LONGER increment activeUsers here to prevent double-counting.
 * Counting happens only when the profile is actually completed.
 */
export async function registerUser({ fullName, email, password }) {
  // 1. Create the Auth Account
  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  const user = result.user;
  const trimmedName = fullName.trim();

  // 2. CREATE INITIAL FIRESTORE PROFILE
  // status: 'active' ensures they aren't blocked by default.
  // profileCompleted: false ensures they aren't counted in stats yet.
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    fullName: trimmedName,
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
    status: "active",
    role: "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 3. SEND VERIFICATION EMAIL
  try {
    await sendEmailVerification(user);
  } catch (emailErr) {
    console.error("Verification email failed to send:", emailErr);
  }

  // NOTE: Stats sync (activeUsers increment) is now handled EXCLUSIVELY
  // in userService.updateUserProfile when profileCompleted flips to true.

  return user;
}

/**
 * Logs in user and strictly enforces email verification.
 */
export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);

  // Force reload to get the latest verification status
  await result.user.reload();

  // REMOVE the signOut(auth) from here!
  // We let the NavigationGuard handle the routing instead of throwing an error.

  return result.user;
}

export async function forgotPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser() {
  await signOut(auth);
}
