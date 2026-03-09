import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export async function registerUser({ name, email, password }) {
  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  await sendEmailVerification(result.user);

  await setDoc(doc(db, "users", result.user.uid), {
    uid: result.user.uid,
    fullName: name.trim(),
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

  return result.user;
}

export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  await result.user.reload();

  if (!result.user.emailVerified) {
    throw new Error("Please verify your email first.");
  }

  return result.user;
}

export async function forgotPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser() {
  await signOut(auth);
}
