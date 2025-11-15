import React from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from 'react-native';

import { EarthColors } from '@/constants/theme';

export type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const fontFamily = Platform.OS === 'web' ? 'Montserrat' : 'Montserrat_600SemiBold';
  const fontWeight = Platform.OS === 'web' ? '600' : 'normal';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? EarthColors.beigeBone : EarthColors.blackSoft} />
      ) : (
        <Text
          style={[
            styles.text,
            { fontFamily, fontWeight },
            variant === 'primary' ? styles.primaryText : styles.secondaryText,
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primary: {
    backgroundColor: EarthColors.blackSoft,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: EarthColors.blackSoft,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  primaryText: {
    color: EarthColors.beigeBone,
  },
  secondaryText: {
    color: EarthColors.blackSoft,
  },
});

