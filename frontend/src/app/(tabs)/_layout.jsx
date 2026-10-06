import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

const COLORS = {
  NAVY: "#081A33",
  ORANGE: "#FF6B35",
  CREAM: "#FFF9F5",
  TEXT: "#171717",
  MUTED: "#64748B",
  BORDER: "#E8E8E8",
  WHITE: "#FFFFFF",
};

export default function TabsLayout() {
  const [role, setRole] = useState(null);

  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallMobile = width < 380;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const isDesktop = width >= 1100;

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

  /*
   * ============================================================
   * RESPONSIVE TAB BAR
   * ============================================================
   */

  const tabBarHeight = Platform.select({
    ios: isSmallMobile ? 72 : isMobile ? 82 : 88,
    android: isSmallMobile ? 64 : isMobile ? 70 : 76,
    default: isMobile ? 64 : isTablet ? 68 : 72,
  });

  const tabBarPaddingBottom = Platform.select({
    ios: isSmallMobile ? 14 : isMobile ? 18 : 20,
    android: isSmallMobile ? 7 : isMobile ? 9 : 10,
    default: isMobile ? 7 : 8,
  });

  const tabBarPaddingTop = isSmallMobile ? 5 : isMobile ? 7 : 8;

  const iconSize = isSmallMobile ? 20 : isMobile ? 21 : isTablet ? 22 : 23;

  const labelFontSize = isSmallMobile ? 9 : isMobile ? 10 : isTablet ? 11 : 11;

  const tabBarStyle = {
    backgroundColor: COLORS.NAVY,

    borderTopWidth: 1,
    borderTopColor: COLORS.ORANGE,

    height: tabBarHeight,

    paddingBottom: tabBarPaddingBottom,
    paddingTop: tabBarPaddingTop,

    // Makes the tab bar adapt better on wider screens
    paddingHorizontal: isDesktop
      ? Math.min(120, width * 0.08)
      : isTablet
        ? 25
        : isSmallMobile
          ? 2
          : 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 10,
  };

  const tabBarLabelStyle = {
    fontSize: labelFontSize,
    fontWeight: "600",
    marginTop: isSmallMobile ? 1 : 3,
  };

  /*
   * ============================================================
   * CUSTOMER TABS
   * ============================================================
   */

  if (role === "customer") {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,

          // GoNbite brand colors
          tabBarActiveTintColor: COLORS.ORANGE,
          tabBarInactiveTintColor: COLORS.CREAM,

          tabBarStyle,

          tabBarLabelStyle,

          // Better responsive icon positioning
          tabBarIconStyle: {
            marginTop: 0,
          },

          // Prevent labels/icons from becoming too large
          tabBarItemStyle: {
            minWidth: 0,
            flex: 1,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={iconSize}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={iconSize}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="wishlist"
          options={{
            title: "Wishlist",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "heart" : "heart-outline"}
                size={iconSize}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                size={iconSize}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "receipt" : "receipt-outline"}
                size={iconSize}
                color={color}
              />
            ),
          }}
        />

        {/* Settings */}
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={iconSize}
                color={color}
              />
            ),
          }}
        />

        {/* Hides the admin-dashboard tab for customers */}
        {/* <Tabs.Screen name="admin-dashboard" options={{ href: null }} /> */}

        <Tabs.Screen name="active-order" options={{ href: null }} />

        <Tabs.Screen name="review-order" options={{ href: null }} />

        <Tabs.Screen name="checkout" options={{ href: null }} />

        <Tabs.Screen name="payment" options={{ href: null }} />

        <Tabs.Screen name="confirm-order" options={{ href: null }} />

        <Tabs.Screen name="limited-offer" options={{ href: null }} />

        <Tabs.Screen name="privacy-security" options={{ href: null }} />

        <Tabs.Screen name="profile" options={{ href: null }} />

        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
    );
  }

  /*
   * ============================================================
   * ADMIN TABS
   * ============================================================
   */

  if (role === "admin") {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,

          // GoNbite brand colors
          tabBarActiveTintColor: COLORS.ORANGE,
          tabBarInactiveTintColor: COLORS.CREAM,

          tabBarStyle,

          tabBarLabelStyle,

          tabBarIconStyle: {
            marginTop: 0,
          },

          tabBarItemStyle: {
            minWidth: 0,
            flex: 1,
          },
        }}
      >
        {/* The Admin Dashboard is the main tab */}
        <Tabs.Screen
          name="admin-dashboard"
          options={{
            title: "Admin",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "shield" : "shield-outline"}
                size={iconSize}
                color={color}
              />
            ),
          }}
        />

        {/* Hide Customer routes for Admin */}
        <Tabs.Screen name="index" options={{ href: null }} />

        <Tabs.Screen name="search" options={{ href: null }} />

        <Tabs.Screen name="wishlist" options={{ href: null }} />

        <Tabs.Screen name="cart" options={{ href: null }} />

        <Tabs.Screen name="profile" options={{ href: null }} />

        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
    );
  }

  return null;
}
