/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Paleta de colores tierra elegante y sobria.
 */

import { Platform } from 'react-native';

// Paleta de colores tierra elegante
export const EarthColors = {
  // Colores tierra
  earthPrimary: '#8B7355', // Tierra medio elegante (botón principal)
  earthDark: '#6B5B47', // Tierra oscuro (textos, bordes)
  earthDarker: '#5A4A3A', // Tierra muy oscuro (texto principal)
  earthLight: '#A0826D', // Tierra claro
  earthLighter: '#C9A882', // Tierra muy claro
  
  // Beiges y huesos
  beigeBone: '#FAF8F4', // Blanco hueso (fondo principal)
  beigeLight: '#F5F1EB', // Beige claro
  beigeMedium: '#E8DFD5', // Beige medio (inputs)
  beigeWarm: '#EDE8E0', // Beige cálido
  
  // Negros y blancos
  blackSoft: '#1A1A1A', // Negro suave elegante
  blackMedium: '#2C2C2C', // Negro medio
  blackSoftOpacity: 'rgba(26, 26, 26, 0.6)', // Negro suave con opacidad para placeholders
  whiteBone: '#FFFFFF', // Blanco puro
  whiteWarm: '#FFFEFB', // Blanco cálido
  
  // Grises tierra
  grayEarth: '#9B8B7A', // Gris tierra
  grayEarthLight: '#B5A896', // Gris tierra claro
  
  // Azul para navegación activa
  bluePrimary: '#2563EB', // Azul vibrante para tabs activos
  blueLight: '#60A5FA', // Azul claro para botones y elementos activos
  
  // Grises para fondos
  grayLight: '#F5F5F5', // Gris muy claro para fondos de tarjetas
  grayMedium: '#E5E5E5', // Gris medio para bordes
  grayInput: '#D1D5DB', // Gris para inputs (medio)
};

const tintColorLight = EarthColors.earthPrimary;
const tintColorDark = EarthColors.beigeLight;

export const Colors = {
  light: {
    text: EarthColors.earthDarker,
    background: EarthColors.beigeBone,
    tint: tintColorLight,
    icon: EarthColors.earthDark,
    tabIconDefault: EarthColors.grayEarth,
    tabIconSelected: EarthColors.earthPrimary,
  },
  dark: {
    text: EarthColors.beigeLight,
    background: EarthColors.blackSoft,
    tint: tintColorDark,
    icon: EarthColors.grayEarthLight,
    tabIconDefault: EarthColors.grayEarth,
    tabIconSelected: EarthColors.earthLight,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
