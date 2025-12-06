import { Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

export function useMontserratFont() {
  // Para web, las fuentes se cargan desde Google Fonts vía CSS (se inyecta en _layout.tsx)
  // Para móvil, usamos el paquete @expo-google-fonts/montserrat
  if (Platform.OS === 'web') {
    // En web, retornamos como cargado porque Google Fonts lo maneja vía CSS
    return {
      loaded: true,
      error: null,
    };
  }

  // Para móvil, cargamos las fuentes del paquete
  const [loaded, error] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  return {
    loaded,
    error,
  };
}

