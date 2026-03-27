import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { auth } from "../src/firebase/config"; // Ensure auth is imported

/**
 * NavigationGuard handles Auto-Login, Admin Protection, and Ban Enforcement.
 */
function NavigationGuard() {
  const { user, profile, loading, isAdmin } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(public)";
    const inAdminTab = segments[1] === "adminDashboard";

    // 1. BAN ENFORCEMENT (The "Real-Time Kick")
    // If the user is authenticated but their Firestore profile is banned/blocked
    if (user && (profile?.status === "banned" || profile?.isBlocked === true)) {
      signOut(auth); // Kill the session

      Toast.show({
        type: "error",
        text1: "Account Restricted",
        text2: "Contact: arifurrahman.now@gmail.com",
        visibilityTime: 6000,
        autoHide: true,
      });

      // Move them back to login immediately
      router.replace("/(public)/login");
      return;
    }

    // 2. GUEST ACCESS: Redirect to Login if not authenticated
    if (!user && !inAuthGroup) {
      router.replace("/(public)/login");
    }

    // 3. LOGGED IN: Move from Login to Main App
    else if (user && inAuthGroup) {
      if (user.emailVerified || user) {
        router.replace("/(tabs)");
      }
    }

    // 4. ADMIN PROTECTION: Kick non-admins out of the admin panel
    if (user && inAdminTab && !isAdmin) {
      router.replace("/(tabs)");
      Toast.show({
        type: "error",
        text1: "Access Denied",
        text2: "You do not have permission to view this area.",
      });
    }
  }, [user, profile, loading, segments, isAdmin]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "900",
          color: "#0F172A",
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#0F172A",
        headerBackTitleVisible: false,
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="(public)" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />

      <Stack.Screen
        name="post/[id]"
        options={{
          headerShown: true,
          title: "Problem Details",
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="user/[id]"
        options={{
          headerShown: true,
          title: "Profile View",
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Information",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <NavigationGuard />
      {/* Toast must be here to be visible across all screens */}
      <Toast />
    </AuthProvider>
  );
}
