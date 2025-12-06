import { EarthColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  containerStyle?: any;
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  containerStyle,
  ...props
}: ThemedTextInputProps) {
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  // Colores tierra elegantes usando variables - fondo muy claro casi como el fondo
  const backgroundColor = colorScheme === 'dark' ? EarthColors.blackMedium : EarthColors.beigeBone;
  const borderColor = colorScheme === 'dark' ? EarthColors.earthDarker : EarthColors.earthLighter;

  const fontFamily = Platform.OS === 'web' ? 'Montserrat' : 'Montserrat_400Regular';

  return (
    <View style={[styles.container, { backgroundColor, borderColor }, containerStyle]}>
      <TextInput
        style={[
          styles.input,
          {
            color: textColor,
            backgroundColor: 'transparent',
            fontFamily,
          },
          style,
        ]}
        placeholderTextColor={colorScheme === 'dark' ? EarthColors.grayEarth : EarthColors.earthPrimary}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginVertical: 8,
    borderWidth: 1.5,
    minHeight: 54,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    flex: 1,
  },
});

