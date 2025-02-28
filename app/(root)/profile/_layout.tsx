import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/contexts/AuthProvider";

export default function ProfileLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
   

    <Stack screenOptions={{ headerShown: false }} />

  
    // Include the TabsLayout inside ProfileLayout
  );
}
