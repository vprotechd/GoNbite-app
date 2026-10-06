import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function DeliveryLayout() {
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      /*
       * ------------------------------------------------
       * PUBLIC DELIVERY PAGES
       * ------------------------------------------------
       */

      const isLoginPage =
        pathname === "/delivery/login" ||
        pathname === "/delivery/login/";

      const isRegisterPage =
        pathname === "/delivery/register" ||
        pathname === "/delivery/register/";

      /*
       * Login and register must always be accessible.
       */
      if (isLoginPage || isRegisterPage) {
        setCheckingAuth(false);
        return;
      }

      /*
       * ------------------------------------------------
       * GET DELIVERY AUTH DATA
       * ------------------------------------------------
       */

      const userString =
        await AsyncStorage.getItem("user");

      const deliveryToken =
        await AsyncStorage.getItem("deliveryToken");

      console.log("🚴 DELIVERY AUTH CHECK");
      console.log("📍 DELIVERY PATH:", pathname);
      console.log("👤 STORED USER:", userString);
      console.log(
        "🔑 DELIVERY TOKEN:",
        deliveryToken ? "EXISTS" : "MISSING"
      );

      /*
       * ------------------------------------------------
       * NO DELIVERY AUTHENTICATION
       * ------------------------------------------------
       */

      if (!userString || !deliveryToken) {
        console.log(
          "❌ Delivery authentication missing"
        );

        router.replace("/delivery/login");
        return;
      }

      /*
       * ------------------------------------------------
       * PARSE USER
       * ------------------------------------------------
       */

      let user;

      try {
        user = JSON.parse(userString);
      } catch (error) {
        console.error(
          "❌ Invalid user data:",
          error
        );

        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem(
          "deliveryToken"
        );

        router.replace("/delivery/login");
        return;
      }

      console.log(
        "👤 DELIVERY USER:",
        user
      );

      console.log(
        "👤 DELIVERY USER ROLE:",
        user?.role
      );

      /*
       * ------------------------------------------------
       * CHECK DELIVERY ROLE
       * ------------------------------------------------
       */

      const isDeliveryUser =
        user?.role === "delivery" ||
        user?.role === "deliveryPartner";

      /*
       * ------------------------------------------------
       * VALID DELIVERY USER
       * ------------------------------------------------
       */

      if (isDeliveryUser) {
        console.log(
          "✅ DELIVERY AUTHENTICATION SUCCESS"
        );

        setCheckingAuth(false);
        return;
      }

      /*
       * ------------------------------------------------
       * WRONG ROLE
       * ------------------------------------------------
       *
       * IMPORTANT:
       *
       * We do NOT redirect a delivery route to
       * another panel here.
       *
       * This prevents an old restaurant/customer/admin
       * value stored in "user" from sending the user
       * to the wrong application panel.
       */

      console.log(
        "❌ Wrong role trying to access delivery panel:",
        user?.role
      );

      /*
       * Clear stale delivery authentication.
       *
       * Keep the user out of the restaurant panel.
       */
      await AsyncStorage.removeItem(
        "deliveryToken"
      );

      await AsyncStorage.removeItem("user");

      router.replace("/delivery/login");
      return;

    } catch (error) {
      console.error(
        "❌ Delivery auth check error:",
        error
      );

      await AsyncStorage.removeItem(
        "deliveryToken"
      );

      router.replace("/delivery/login");

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
    pathname === "/delivery/login" ||
    pathname === "/delivery/login/" ||
    pathname === "/delivery/register" ||
    pathname === "/delivery/register/";

  /*
   * ------------------------------------------------
   * LOADING SCREEN
   * ------------------------------------------------
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

  /*
   * ------------------------------------------------
   * DELIVERY STACK
   * ------------------------------------------------
   */

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
      <Stack.Screen name="active-order" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
