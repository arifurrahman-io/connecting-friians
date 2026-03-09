import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
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
        {/* Crucial: We only define the groups here. 
           Expo Router will handle the internal files 
           (login, register, forgot-password) automatically 
           as long as (public)/_layout.jsx exists.
        */}
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
    </AuthProvider>
  );
}
