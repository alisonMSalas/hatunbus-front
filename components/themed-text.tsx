import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { EarthColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  // En web usamos "Montserrat" directamente (desde Google Fonts)
  // En móvil usamos los nombres del paquete
  const getFontFamily = (fontType: string) => {
    if (Platform.OS === 'web') {
      return 'Montserrat';
    }
    switch (fontType) {
      case 'regular':
        return 'Montserrat_400Regular';
      case 'semiBold':
        return 'Montserrat_600SemiBold';
      case 'bold':
        return 'Montserrat_700Bold';
      default:
        return 'Montserrat_400Regular';
    }
  };

  const getStyle = () => {
    // Para links, usar color tierra si no se especifica lightColor/darkColor
    const linkColor = type === 'link' && !lightColor && !darkColor ? EarthColors.earthPrimary : color;
    const baseStyle = { color: linkColor };
    switch (type) {
      case 'default':
        return { ...baseStyle, ...styles.default, fontFamily: getFontFamily('regular') };
      case 'title':
        return { ...baseStyle, ...styles.title, fontFamily: getFontFamily('bold') };
      case 'defaultSemiBold':
        return { ...baseStyle, ...styles.defaultSemiBold, fontFamily: getFontFamily('semiBold') };
      case 'subtitle':
        return { ...baseStyle, ...styles.subtitle, fontFamily: getFontFamily('bold') };
      case 'link':
        return { ...baseStyle, ...styles.link, fontFamily: getFontFamily('semiBold'), color: linkColor };
      default:
        return { ...baseStyle, ...styles.default, fontFamily: getFontFamily('regular') };
    }
  };

  return (
    <Text
      style={[getStyle(), style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontWeight: '600',
  },
});
