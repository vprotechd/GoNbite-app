import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AdminLayout() {
  const pathname = usePathname();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, [pathname]);

  const checkAdminAuth = async () => {
    try {
      const adminToken =
        await AsyncStorage.getItem("adminToken");

      console.log(
        "ADMIN AUTH CHECK:",
        pathname,
        adminToken ? "TOKEN FOUND" : "NO TOKEN"
      );

      /*
      =================================================
      ADMIN LOGIN PAGE
      =================================================

      Login page must remain accessible without
      an admin token.
      */

      if (pathname === "/admin/login") {
        setIsCheckingAuth(false);
        return;
      }

      /*
      =================================================
      PROTECT ALL OTHER ADMIN ROUTES
      =================================================
      */

      if (!adminToken) {
        console.log(
          "NO ADMIN TOKEN → REDIRECTING TO ADMIN LOGIN"
        );

        router.replace("/admin/login");
        return;
      }

      /*
      =================================================
      ADMIN TOKEN EXISTS
      =================================================
      */

      console.log(
        "ADMIN TOKEN FOUND → ACCESS GRANTED"
      );

      setIsCheckingAuth(false);

    } catch (error) {
      console.error(
        "ADMIN AUTH CHECK ERROR:",
        error
      );

      router.replace("/admin/login");
    }
  };

  /*
  =================================================
  SHOW LOADING WHILE CHECKING ADMIN AUTH
  =================================================
  */

  if (isCheckingAuth) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
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
  =================================================
  ADMIN STACK
  =================================================
  */

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}