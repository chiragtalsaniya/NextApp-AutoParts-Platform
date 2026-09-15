import { Stack } from 'expo-router';

export default function PartsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[partNumber]" />
      <Stack.Screen name="add" />
    </Stack>
  );
}