import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { auth } from "../src/firebase/config";

/**
 * NavigationGuard handles Auto-Login, Admin Protection, Ban Enforcement,
 * and Email Verification routing.
 */
function NavigationGuard() {
  const { user, profile, loading, isAdmin, isEmailVerified } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(public)";
    const inAdminTab = segments[1] === "adminDashboard";
    const onVerifyScreen = segments[0] === "verify-email";

    // 1. BAN ENFORCEMENT (The "Real-Time Kick")
    if (
      user &&
      (profile?.status === "banned" || profile?.status === "blocked")
    ) {
      signOut(auth);
      Toast.show({
        type: "error",
        text1: "Account Restricted",
        text2: "Contact: arifurrahman.now@gmail.com",
        visibilityTime: 6000,
      });
      router.replace("/(public)/login");
      return;
    }

    // 2. GUEST ACCESS: If not logged in, force to Login
    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(public)/login");
      }
      return;
    }

    // 3. VERIFICATION GUARD: If logged in but NOT verified
    if (user && !isEmailVerified) {
      if (!onVerifyScreen) {
        router.replace("/verify-email");
      }
      return;
    }

    // 4. AUTHENTICATED ACCESS: Move from Public/Verify to Main App
    if (user && isEmailVerified && (inAuthGroup || onVerifyScreen)) {
      router.replace("/(tabs)");
      return;
    }

    // 5. ADMIN PROTECTION: Kick non-admins out of the admin panel
    if (user && inAdminTab && !isAdmin) {
      router.replace("/(tabs)");
      Toast.show({
        type: "error",
        text1: "Access Denied",
        text2: "Admin privileges required.",
      });
    }
  }, [user, profile, loading, segments, isAdmin, isEmailVerified]);

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

      {/* Added explicit screen for verify-email */}
      <Stack.Screen
        name="verify-email"
        options={{
          animation: "slide_from_bottom",
          gestureEnabled: false, // Prevent swiping back to login
        }}
      />

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
      <Toast />
    </AuthProvider>
  );
}
