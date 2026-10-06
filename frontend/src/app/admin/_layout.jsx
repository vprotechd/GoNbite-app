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
      const adminToken = await AsyncStorage.getItem("adminToken");
      const userString = await AsyncStorage.getItem("user");

      console.log(
        "ADMIN AUTH CHECK:",
        pathname,
        adminToken ? "TOKEN FOUND" : "NO TOKEN"
      );

      /*
      =================================================
      ADMIN LOGIN PAGE
      =================================================
      */

      if (pathname === "/admin/login") {
        setIsCheckingAuth(false);
        return;
      }

      /*
      =================================================
      NO ADMIN TOKEN
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
      CHECK USER ROLE
      =================================================
      */

      let user = null;

      if (userString) {
        try {
          user = JSON.parse(userString);
        } catch (error) {
          console.log("USER DATA PARSE ERROR:", error);
        }
      }

      /*
      =================================================
      ONLY ADMIN CAN ACCESS ADMIN PANEL
      =================================================
      */

      if (user && user.role && user.role !== "admin") {
        console.log(
          "NON-ADMIN USER → ACCESS DENIED:",
          user.role
        );

      if (user && user.role !== "admin") {
  console.log(
    "NON-ADMIN USER → ACCESS DENIED:",
    user.role
  );

  router.replace("/admin/login");
  return;
}

        return;
      }

      /*
      =================================================
      ADMIN ACCESS GRANTED
      =================================================
      */

      console.log(
        "ADMIN TOKEN + ROLE VERIFIED → ACCESS GRANTED"
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
  LOADING
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
          color="#FF8500"
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

