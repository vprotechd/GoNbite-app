import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";

import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";

// Prevent Expo from automatically hiding the splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Keep splash screen visible for 2.5 seconds
        await new Promise((resolve) =>
          setTimeout(resolve, 2500)
        );
      } catch (error) {
        console.warn(error);
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  // Don't render the app until splash is ready
  if (!isAppReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <CartProvider>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="restaurant-menu"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="admin"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="restaurant"
            options={{ headerShown: false }}
          />
        </Stack>
      </CartProvider>
    </ThemeProvider>
  );
}