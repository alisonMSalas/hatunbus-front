import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NotificationBell } from '@/components/ui/notification-bell';
import { EarthColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showNotifications?: boolean;
};

export function Header({ title, showBackButton = true, onBackPress, showNotifications = true }: HeaderProps) {
  const colorScheme = useColorScheme();
  const { logout, user } = useAuth();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
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
          
          <View style={styles.rightActions}>
            {/* Mostrar notificaciones solo si el usuario está logueado y es cliente/admin */}
            {showNotifications && user && (user.role === 'CLIENT' || user.role === 'ADMIN') && (
              <NotificationBell />
            )}
            
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <MaterialIcons
                name="logout"
                size={24}
                color={colorScheme === 'dark' ? EarthColors.beigeLight : EarthColors.earthDarker}
              />
            </TouchableOpacity>
          </View>
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
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

