import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { EarthColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

export function Header({ title, showBackButton = true, onBackPress }: HeaderProps) {
  const colorScheme = useColorScheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.headerContainer}>
        <ThemedView style={styles.header}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}>
              <IconSymbol
                name="chevron.left"
                size={24}
                color={colorScheme === 'dark' ? EarthColors.beigeLight : EarthColors.earthDarker}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          <ThemedText
            type="subtitle"
            lightColor={EarthColors.earthDarker}
            darkColor={EarthColors.beigeLight}
            style={styles.headerTitle}>
            {title}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: EarthColors.beigeBone,
    zIndex: 1000,
    elevation: 4,
  },
  headerContainer: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: EarthColors.beigeBone,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeWarm,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
});

