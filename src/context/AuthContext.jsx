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
      setUser(currentUser || null);

      if (currentUser) {
        // 1. Initial Fetch for fast loading
        try {
          const data = await getUserProfile(currentUser.uid);
          setProfile(data);
        } catch (err) {
          console.error("AuthContext: Initial profile fetch failed", err);
        }

        // 2. DYNAMIC SYNC: Listen for real-time profile changes (Header, Avatar, etc.)
        // This makes your UI "Dynamic from header to footer" as requested.
        unsubscribeProfile = onSnapshot(
          doc(db, "users", currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data());
            }
          },
          (err) => console.warn("Profile listener error:", err),
        );
      } else {
        // Clear state on logout
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
      }

      setLoading(false);
    });

    // Cleanup both listeners on unmount
    return () => {
      unsubAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  /**
   * Manually trigger a profile refresh if needed.
   */
  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const data = await getUserProfile(auth.currentUser.uid);
      setProfile(data);
    } catch (err) {
      console.error("Manual refresh failed", err);
    }
  };

  // Optimization: Memoize the value to prevent unnecessary re-renders of the entire app tree
  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      isAuthenticated: !!user && user.emailVerified, // Helper for easy gatekeeping
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
