import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase/config"; // Verified path
import { getUserProfile } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      // 1. Set the Firebase Auth User
      setUser(currentUser || null);

      if (currentUser) {
        // 2. Initial Fetch for fast loading (Better UX)
        try {
          const data = await getUserProfile(currentUser.uid);
          setProfile(data);
        } catch (err) {
          console.error("AuthContext: Initial profile fetch failed", err);
        }

        // 3. DYNAMIC SYNC: Listen for real-time changes
        // This ensures if you change a role in Firebase, the UI updates INSTANTLY.
        unsubscribeProfile = onSnapshot(
          doc(db, "users", currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProfile(data);
              console.log("🔥 Profile Synced:", data.role); // Debugging role
            }
          },
          (err) => console.warn("Profile listener error:", err),
        );
      } else {
        // Clear state on logout
        setProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }

      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const data = await getUserProfile(auth.currentUser.uid);
      setProfile(data);
    } catch (err) {
      console.error("Manual refresh failed", err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      profile, // This contains your 'role'
      loading,
      refreshProfile,
      // Fixed: Check both user and profile for admin status
      isAdmin: profile?.role === "admin",
      isAuthenticated: !!user,
    }),
    [user, profile, loading],
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
