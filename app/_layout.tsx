import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { authBridge } from '@/utils/authBridge';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    authBridge.initialize();
    console.log('[App] Auth bridge initialized');

    return () => {
      authBridge.clearCallbacks();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
