import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

/**
 * NavigationGuard handles the Auto-Login logic.
 * It monitors the Auth state and moves the user to the correct group.
 */
function NavigationGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // Check if the user is currently in a public or private route
    const inAuthGroup = segments[0] === "(public)";

    if (!user && !inAuthGroup) {
      // 1. If not logged in and trying to access private pages -> redirect to Login
      router.replace("/(public)/login");
    } else if (user && inAuthGroup) {
      // 2. If logged in and trying to access login/register -> redirect to Home
      // Note: Only redirect if email is verified (optional based on your flow)
      if (user.emailVerified) {
        router.replace("/(tabs)");
      }
    }
  }, [user, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAFC" },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "800",
          color: "#1E293B",
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#1E293B",
        headerBackTitleVisible: false,
      }}
    >
      {/* Group Routes */}
      <Stack.Screen name="(public)" />
      <Stack.Screen name="(tabs)" />

      {/* Standalone Screens */}
      <Stack.Screen
        name="post/[id]"
        options={{
          headerShown: true,
          title: "Problem Details",
          presentation: "card",
          headerTitleAlign: "center",
        }}
      />

      <Stack.Screen
        name="user/[id]"
        options={{
          headerShown: true,
          title: "Alumni Profile",
          presentation: "card",
          headerTitleAlign: "center",
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
    </AuthProvider>
  );
}
