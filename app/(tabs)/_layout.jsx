import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../src/context/AuthContext";
import { COLORS } from "../../src/theme/colors";

export default function TabLayout() {
  const { user, loading, isAdmin } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(public)/login" />;

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
          height: Platform.OS === "ios" ? 88 : 70,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          paddingTop: 12,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 12,
          elevation: 0,
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

      {/* ALIGNED CENTER ACTION */}
      <Tabs.Screen
        name="create-post"
        options={{
          title: "Post",
          tabBarIcon: ({ color, focused }) => (
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

      {/* ADMIN DASHBOARD */}
      <Tabs.Screen
        name="adminDashboard"
        options={{
          title: "Admin",
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

      {/* PROFILE TAB */}
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

      {/* Hidden Screens */}
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
    fontWeight: "700",
    textTransform: "capitalize",
    marginTop: 2,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
