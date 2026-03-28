import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../src/context/AuthContext";
import { COLORS } from "../../src/theme/colors";

export default function TabLayout() {
  // Destructuring isAuthenticated and isEmailVerified from our updated AuthContext
  const { user, loading, isAdmin, isAuthenticated, isEmailVerified } =
    useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  // --- AUTHENTICATION GATE ---
  // 1. If no user is logged in, go to login
  if (!user) return <Redirect href="/(public)/login" />;

  // 2. If user exists but email isn't verified, go to verification screen
  // This prevents unverified users from seeing the bottom tabs
  if (!isEmailVerified) return <Redirect href="/verify-email" />;

  // Dynamic height calculation to handle system navigation bars
  const TAB_BAR_HEIGHT =
    Platform.OS === "ios" ? 60 + insets.bottom : 68 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          paddingTop: 12,
          // Prevents overlapping with Android navigation buttons or iOS home bar
          paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 12,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* CENTER ACTION BUTTON */}
      <Tabs.Screen
        name="create-post"
        options={{
          title: "Post",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: focused ? COLORS.primary : "#F1F5F9" },
              ]}
            >
              <Ionicons
                name="add"
                size={24}
                color={focused ? "#FFF" : "#64748B"}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="directory"
        options={{
          title: "Network",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="adminDashboard"
        options={{
          title: "Admin",
          // Only show Admin tab if the profile role is 'admin'
          href: isAdmin ? "/adminDashboard" : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Internal Screens Hidden from Tab Bar */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "capitalize",
    marginTop: 4,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14, // Squircle style
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Platform.OS === "android" ? 4 : 0,
  },
});
