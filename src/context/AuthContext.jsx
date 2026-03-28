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
      // 1. Set the Firebase Auth User
      setUser(currentUser || null);

      if (currentUser) {
        // 2. Initial Fetch for immediate UI response
        try {
          const data = await getUserProfile(currentUser.uid);
          setProfile(data);
        } catch (err) {
          // Likely a permission error because doc doesn't exist yet; we catch it silently
          console.log("AuthContext: Initial fetch pending profile creation...");
        }

        // 3. DYNAMIC SYNC: Real-time listener
        unsubscribeProfile = onSnapshot(
          doc(db, "users", currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data());
            }
            // Once we have a snapshot (even if empty), we can stop the loading spinner
            setLoading(false);
          },
          (err) => {
            console.warn(
              "Profile listener error (Rules/Network):",
              err.message,
            );
            // FAILSAFE: Ensure app doesn't stay on loading screen if rules block read
            setLoading(false);
          },
        );
      } else {
        // Handle Logout
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
      // Force reload the auth user to check for updated emailVerified status
      await auth.currentUser.reload();

      // We must manually spread the properties to trigger a re-render in useMemo
      const updatedUser = auth.currentUser;
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
      // Status flags used by Navigation Guards
      isAdmin: profile?.role === "admin" && user?.emailVerified === true,
      isAuthenticated: !!user && user?.emailVerified === true,
      isEmailVerified: user?.emailVerified === true,
    }),
    // Added user?.emailVerified to the dependency array to ensure UI updates
    // immediately when the reload() completes.
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
