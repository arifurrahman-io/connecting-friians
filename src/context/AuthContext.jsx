import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase/config";
import { getUserProfile } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      // 1. Initial State Sync
      if (currentUser) {
        setUser(currentUser);

        // 2. Fetch Profile immediately to prevent UI lag
        try {
          const data = await getUserProfile(currentUser.uid);
          setProfile(data);
        } catch (err) {
          console.log(
            "AuthContext: Profile not found yet, waiting for snapshot...",
          );
        }

        // 3. Real-time Profile Listener
        unsubscribeProfile = onSnapshot(
          doc(db, "users", currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data());
            }
            // Ensure loading is set to false only after we've attempted to get the profile
            setLoading(false);
          },
          (err) => {
            console.warn("Profile listener error:", err.message);
            setLoading(false);
          },
        );
      } else {
        // Handle Logout / No User
        setUser(null);
        setProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;

      // Update local state to reflect fresh Firebase Auth data (like emailVerified)
      setUser({
        ...updatedUser,
        emailVerified: updatedUser.emailVerified,
      });

      const data = await getUserProfile(updatedUser.uid);
      setProfile(data);
    } catch (err) {
      console.error("Manual refresh failed", err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      // Helper flags for Navigation Guards
      isAdmin: profile?.role === "admin" && user?.emailVerified === true,
      isAuthenticated: !!user && user?.emailVerified === true,
      isEmailVerified: user?.emailVerified === true,
    }),
    [user, profile, loading, user?.emailVerified],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
