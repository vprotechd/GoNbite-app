import { Stack } from "expo-router";

export default function DeliveryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="active-order" />
      <Stack.Screen name="history" />
    </Stack>
  );
}