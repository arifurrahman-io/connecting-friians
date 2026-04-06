import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import Toast from "react-native-toast-message";

import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { auth } from "../src/firebase/config";

/**
 * NavigationGuard handles Protected Routes, Auto-Login, Ban Enforcement,
 * and standard app navigation flow.
 */
function NavigationGuard() {
  const { user, profile, loading, isAdmin, isEmailVerified } = useAuth();
  const segments = useSegments();

  // --- ROUTING & SECURITY LOGIC ---
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(public)";
    const inAdminTab = segments[1] === "adminDashboard";
    const onVerifyScreen = segments[0] === "verify-email";

    // 1. Enforce Bans
    if (
      user &&
      (profile?.status === "banned" || profile?.status === "blocked")
    ) {
      signOut(auth);
      Toast.show({
        type: "error",
        text1: "Account Restricted",
        text2: "Your account has been suspended.",
        visibilityTime: 5000,
      });
      router.replace("/(public)/login");
      return;
    }

    // 2. Guest Protection (Redirect to Login if not logged in)
    if (!user) {
      if (!inAuthGroup) router.replace("/(public)/login");
      return;
    }

    // 3. Force Email Verification
    if (user && !isEmailVerified) {
      if (!onVerifyScreen) router.replace("/verify-email");
      return;
    }

    // 4. Redirect Authenticated & Verified Users to Home
    if (user && isEmailVerified && (inAuthGroup || onVerifyScreen)) {
      router.replace("/(tabs)");
      return;
    }

    // 5. Protect Admin Dashboard
    if (user && inAdminTab && !isAdmin) {
      router.replace("/(tabs)");
      Toast.show({
        type: "error",
        text1: "Unauthorized",
        text2: "Admin access required.",
      });
    }
  }, [user, profile, loading, segments, isAdmin, isEmailVerified]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#0F172A",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="(public)" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen
        name="verify-email"
        options={{ animation: "slide_from_bottom", gestureEnabled: false }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{ headerShown: true, title: "Problem Details" }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{ headerShown: true, title: "Alumni Profile" }}
      />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", headerShown: true, title: "Notice" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <NavigationGuard />
      <Toast />
    </AuthProvider>
  );
}
