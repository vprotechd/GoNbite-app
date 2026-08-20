import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export default function TabsLayout() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const user = JSON.parse(userString);
          setRole(user.role);
        }
      } catch (error) {
        console.error("Error getting user role:", error);
      }
    };
    getUserRole();
  }, []);

  // If we haven't loaded the role yet, return empty to avoid flickering
  if (role === null) return null;

  // --- CUSTOMER TABS ---
  if (role === "customer") {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#F5B82E", // Golden Yellow
          tabBarInactiveTintColor: "#64748B", // Muted Text
          tabBarStyle: {
            backgroundColor: "#081A33", // Midnight Navy
            borderTopWidth: 1,
            borderTopColor: "#F5B82E", // Golden Yellow
            height: Platform.OS === "ios" ? 90 : 70,
            paddingBottom: Platform.OS === "ios" ? 25 : 10,
            paddingTop: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 10,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        

        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "receipt" : "receipt-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        
        {/* Hides the admin-dashboard tab for customers */}
        <Tabs.Screen name="admin-dashboard" options={{ href: null }} />
         <Tabs.Screen name="review-order" options={{ href: null }} />
        <Tabs.Screen name="checkout" options={{ href: null }} />
        <Tabs.Screen name="payment" options={{ href: null }} />
        <Tabs.Screen name="confirm-order" options={{ href: null }} />
         <Tabs.Screen name="limited-offer" options={{ href: null }} />
        <Tabs.Screen name="privacy-security" options={{ href: null }} />
         <Tabs.Screen name="profile" options={{ href: null }} />

      </Tabs>
    );
  }

  // --- ADMIN TABS ---
  if (role === "admin") {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#F5B82E", // Golden Yellow
          tabBarInactiveTintColor: "#64748B", // Muted Text
          tabBarStyle: {
            backgroundColor: "#081A33", // Midnight Navy
            borderTopWidth: 1,
            borderTopColor: "#F5B82E", // Golden Yellow
            height: Platform.OS === "ios" ? 90 : 70,
            paddingBottom: Platform.OS === "ios" ? 25 : 10,
            paddingTop: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 10,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 4 },
        }}
      >
        {/* The Admin Dashboard is the main tab */}
        <Tabs.Screen
          name="admin-dashboard"
          options={{
            title: "Admin",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "shield" : "shield-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Hide Customer routes for Admin */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="cart" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    );
  }

  return null; // Fallback
}
