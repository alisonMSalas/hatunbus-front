import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function RoleSelectionScreen() {
  const handleSelectRole = (role: 'driver' | 'passenger') => {
    if (role === 'driver') {
      // Navegar a las tabs del conductor
      router.replace('/(driver-tabs)');
    } else {
      // Navegar a las tabs del pasajero
      router.replace('/(tabs)');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Título con Logo */}
        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            <Image
              source={require('@/assets/images/hatunbus2-removebg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText 
              type="title" 
              lightColor={EarthColors.earthDarker} 
              darkColor={EarthColors.beigeLight} 
              style={styles.title}>
              Selecciona tu Rol
            </ThemedText>
          </View>
          <ThemedText 
            lightColor={EarthColors.earthDark} 
            darkColor={EarthColors.beigeMedium} 
            style={styles.subtitle}>
            Elige cómo quieres usar la aplicación
          </ThemedText>
        </View>

        {/* Opciones de Rol */}
        <View style={styles.optionsContainer}>
          {/* Opción Conductor */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleSelectRole('driver')}
            activeOpacity={0.7}>
            <View style={styles.roleIconContainer}>
              <MaterialIcons
                name="directions-bus"
                size={48}
                color={EarthColors.earthPrimary}
              />
            </View>
            <ThemedText
              lightColor={EarthColors.earthDarker}
              darkColor={EarthColors.beigeLight}
              style={styles.roleTitle}>
              Conductor
            </ThemedText>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.roleDescription}>
              Gestiona tus viajes y pasajeros
            </ThemedText>
          </TouchableOpacity>

          {/* Opción Pasajero */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleSelectRole('passenger')}
            activeOpacity={0.7}>
            <View style={styles.roleIconContainer}>
              <MaterialIcons
                name="person"
                size={48}
                color={EarthColors.earthPrimary}
              />
            </View>
            <ThemedText
              lightColor={EarthColors.earthDarker}
              darkColor={EarthColors.beigeLight}
              style={styles.roleTitle}>
              Pasajero
            </ThemedText>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.roleDescription}>
              Busca y reserva tus viajes
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EarthColors.beigeBone,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 48,
    alignItems: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    opacity: 0.75,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
  },
  optionsContainer: {
    width: '100%',
    gap: 20,
  },
  roleCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  roleIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: EarthColors.earthPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

