import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMontserratFont } from '@/hooks/use-montserrat-font';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error && Platform.OS !== 'web') {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
