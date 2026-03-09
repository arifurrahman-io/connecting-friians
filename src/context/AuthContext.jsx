import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/config";
import { getUserProfile } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser || null);

      if (currentUser) {
        const data = await getUserProfile(currentUser.uid);
        setProfile(data);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    const data = await getUserProfile(auth.currentUser.uid);
    setProfile(data);
  };

  const value = useMemo(
    () => ({ user, profile, loading, refreshProfile }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
