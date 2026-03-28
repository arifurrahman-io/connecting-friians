import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { auth } from "../src/firebase/config";
import { saveDeviceToken } from "../src/services/notificationService";

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Helper to register for push notifications and save token to Firestore
 */
async function registerForPushNotificationsAsync(uid) {
  // 1. Web Guard: Push notifications require different setup for Web
  if (Platform.OS === "web") return;

  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    // Get the token specifically for FCM (Android)
    const token = (await Notifications.getDevicePushTokenAsync()).data;

    // Save to your Firestore users collection
    await saveDeviceToken(uid, token);

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  } catch (error) {
    console.error("Error during push notification registration:", error);
  }
}

function NavigationGuard() {
  const { user, profile, loading, isAdmin, isEmailVerified } = useAuth();
  const segments = useSegments();
  const notificationListener = useRef();
  const responseListener = useRef();

  // --- NOTIFICATION LISTENERS ---
  useEffect(() => {
    if (user && isEmailVerified && Platform.OS !== "web") {
      registerForPushNotificationsAsync(user.uid);

      // Listen for notifications while app is open
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification Received:", notification);
        });

      // Listen for taps on notifications
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const { postId } = response.notification.request.content.data;
          if (postId) {
            router.push(`/post/${postId}`);
          } else {
            router.push("/(tabs)/notifications");
          }
        });

      return () => {
        // FIX: Correct way to remove subscriptions
        if (notificationListener.current) notificationListener.current.remove();
        if (responseListener.current) responseListener.current.remove();
      };
    }
  }, [user, isEmailVerified]);

  // --- ROUTING & PROTECTION LOGIC ---
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(public)";
    const inAdminTab = segments[1] === "adminDashboard";
    const onVerifyScreen = segments[0] === "verify-email";

    // 1. BAN ENFORCEMENT
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

    // 2. GUEST ACCESS
    if (!user) {
      if (!inAuthGroup) router.replace("/(public)/login");
      return;
    }

    // 3. VERIFICATION GUARD
    if (user && !isEmailVerified) {
      if (!onVerifyScreen) router.replace("/verify-email");
      return;
    }

    // 4. AUTHENTICATED ACCESS (Redirect from Login/Verify to Home)
    if (user && isEmailVerified && (inAuthGroup || onVerifyScreen)) {
      router.replace("/(tabs)");
      return;
    }

    // 5. ADMIN PROTECTION
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
        headerTitleStyle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#0F172A",
        headerBackTitleVisible: false,
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
        options={{ headerShown: true, title: "Profile View" }}
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
