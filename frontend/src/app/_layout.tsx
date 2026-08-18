import { Stack } from "expo-router";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
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
  );
}