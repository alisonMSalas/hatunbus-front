import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMontserratFont } from '@/hooks/use-montserrat-font';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen is not available
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loaded, error } = useMontserratFont();

  // Agregar Google Fonts en el head para web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Verificar si los links ya existen para evitar duplicados
      const existingLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
      if (existingLinks.length === 0) {
        const link1 = document.createElement('link');
        link1.rel = 'preconnect';
        link1.href = 'https://fonts.googleapis.com';
        document.head.appendChild(link1);

        const link2 = document.createElement('link');
        link2.rel = 'preconnect';
        link2.href = 'https://fonts.gstatic.com';
        link2.crossOrigin = 'anonymous';
        document.head.appendChild(link2);

        const link3 = document.createElement('link');
        link3.href =
          'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Poppins&family=Roboto&display=swap';
        link3.rel = 'stylesheet';
        document.head.appendChild(link3);
      }
    }
  }, []);

  useEffect(() => {
    if (loaded || error || Platform.OS === 'web') {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen is not available
      });
    }
  }, [loaded, error]);

  if (!loaded && !error && Platform.OS !== 'web') {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer colorScheme={colorScheme} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function NavigationContainer({ colorScheme }: { colorScheme: ReturnType<typeof useColorScheme> }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const firstSegment = segments[0] ?? '';
    const authRoutes = new Set(['login', 'register', 'role-selection']);

    if (!isAuthenticated && !authRoutes.has(firstSegment)) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && authRoutes.has(firstSegment)) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="role-selection" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="search-results" options={{ headerShown: false }} />
        <Stack.Screen name="trip-details" options={{ headerShown: false }} />
        <Stack.Screen name="passenger-details" options={{ headerShown: false }} />
        <Stack.Screen name="select-seats" options={{ headerShown: false }} />
        <Stack.Screen name="payment-method" options={{ headerShown: false }} />
        <Stack.Screen name="ticket-detail" options={{ headerShown: false }} />
        <Stack.Screen name="scan-ticket" options={{ headerShown: false }} />
        <Stack.Screen name="driver-trip-report" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
