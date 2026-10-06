import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RestaurantLayout() {
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      /*
       * ------------------------------------------------
       * PUBLIC RESTAURANT PAGES
       * ------------------------------------------------
       */

      const isLoginPage =
        pathname === "/restaurant/login" ||
        pathname === "/restaurant/login/";

      const isRegisterPage =
        pathname === "/restaurant/register" ||
        pathname === "/restaurant/register/";

      if (isLoginPage || isRegisterPage) {
        setCheckingAuth(false);
        return;
      }

      /*
       * ------------------------------------------------
       * RESTAURANT AUTHENTICATION
       * ------------------------------------------------
       *
       * RestaurantToken is the main authentication
       * for the restaurant panel.
       */

      const restaurantToken =
        await AsyncStorage.getItem("restaurantToken");

      const userString =
        await AsyncStorage.getItem("user");

      console.log("🍽️ RESTAURANT AUTH CHECK");
      console.log("📍 RESTAURANT PATH:", pathname);
      console.log(
        "🔑 RESTAURANT TOKEN:",
        restaurantToken ? "EXISTS" : "MISSING"
      );
      console.log("👤 STORED USER:", userString);

      /*
       * No restaurant token means the restaurant
       * is not logged in.
       */
      if (!restaurantToken) {
        console.log(
          "❌ NO RESTAURANT TOKEN - REDIRECTING TO LOGIN"
        );

        router.replace("/restaurant/login");
        return;
      }

      /*
       * ------------------------------------------------
       * PARSE USER
       * ------------------------------------------------
       *
       * The user object is shared with other panels,
       * so its role can sometimes contain "delivery".
       *
       * Therefore we DO NOT use it as the primary
       * authentication check here.
       */

      let user = null;

      if (userString) {
        try {
          user = JSON.parse(userString);
        } catch (error) {
          console.log(
            "⚠️ Could not parse shared user data."
          );

          /*
           * Do NOT remove restaurantToken here.
           *
           * The restaurant token itself is still valid.
           */
          user = null;
        }
      }

      console.log("👤 RESTAURANT USER:", user);
      console.log(
        "👤 RESTAURANT USER ROLE:",
        user?.role
      );

      /*
       * ------------------------------------------------
       * IMPORTANT
       * ------------------------------------------------
       *
       * DO NOT redirect to delivery/admin/customer
       * based on the shared "user" object.
       *
       * restaurantToken already proves that the
       * restaurant session exists.
       */

      if (user?.role && user.role !== "restaurant") {
        console.log(
          "⚠️ SHARED USER ROLE IS NOT RESTAURANT:",
          user.role
        );

        console.log(
          "ℹ️ IGNORING SHARED ROLE BECAUSE RESTAURANT TOKEN EXISTS"
        );
      }

      /*
       * ------------------------------------------------
       * RESTAURANT AUTHENTICATION SUCCESS
       * ------------------------------------------------
       */

      console.log(
        "✅ RESTAURANT AUTHENTICATION SUCCESS"
      );

      setCheckingAuth(false);
    } catch (error) {
      console.error(
        "❌ Restaurant auth check error:",
        error
      );

      /*
       * Only remove the restaurant token if
       * the restaurant authentication check itself
       * fails.
       */
      await AsyncStorage.removeItem(
        "restaurantToken"
      );

      router.replace("/restaurant/login");
    } finally {
      setCheckingAuth(false);
    }
  };

  /*
   * ------------------------------------------------
   * PUBLIC PAGE CHECK
   * ------------------------------------------------
   */

  const isPublicPage =
    pathname === "/restaurant/login" ||
    pathname === "/restaurant/login/" ||
    pathname === "/restaurant/register" ||
    pathname === "/restaurant/register/";

  /*
   * Show loading only on protected pages.
   */
  if (checkingAuth && !isPublicPage) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#081A33",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#F5B82E"
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* PUBLIC */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />

      {/* PROTECTED */}
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="food" />
      <Stack.Screen name="orders" />
    </Stack>
  );
}

