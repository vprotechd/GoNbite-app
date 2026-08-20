import { Stack } from "expo-router";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";


export default function RootLayout() {
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