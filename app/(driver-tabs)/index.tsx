import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverHeader } from '@/components/ui/driver-header';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DriverHomeScreen() {
  // Datos del viaje actual - en el futuro vendrán de la API
  const currentTrip = {
    route: 'Lima - Cusco',
    busNumber: '23',
    departureTime: '10:00 AM',
    passengers: 35,
    totalSeats: 40,
  };

  const handleScanTickets = () => {
    router.push('/scan-ticket');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header Reutilizable */}
      <DriverHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Sección Viaje Actual */}
        <View style={styles.section}>
          <ThemedText
            lightColor={EarthColors.earthDarker}
            darkColor={EarthColors.beigeLight}
            style={styles.sectionTitle}>
            Viaje Actual
          </ThemedText>

          <View style={styles.tripCard}>
            <View style={styles.tripRow}>
              <View style={styles.tripItem}>
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.tripLabel}>
                  Ruta
                </ThemedText>
                <ThemedText
                  lightColor={EarthColors.earthDarker}
                  darkColor={EarthColors.beigeLight}
                  style={styles.tripValue}>
                  {currentTrip.route}
                </ThemedText>
              </View>
              <View style={styles.tripItem}>
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.tripLabel}>
                  Bus
                </ThemedText>
                <ThemedText
                  lightColor={EarthColors.earthDarker}
                  darkColor={EarthColors.beigeLight}
                  style={styles.tripValue}>
                  #{currentTrip.busNumber}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.tripRow, styles.tripRowLast]}>
              <View style={styles.tripItem}>
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.tripLabel}>
                  Hora de Salida
                </ThemedText>
                <ThemedText
                  lightColor={EarthColors.earthDarker}
                  darkColor={EarthColors.beigeLight}
                  style={styles.tripValue}>
                  {currentTrip.departureTime}
                </ThemedText>
              </View>
              <View style={styles.tripItem}>
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.tripLabel}>
                  Pasajeros
                </ThemedText>
                <ThemedText
                  lightColor={EarthColors.earthDarker}
                  darkColor={EarthColors.beigeLight}
                  style={styles.tripValue}>
                  {currentTrip.passengers} / {currentTrip.totalSeats}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Botón Escanear Boletos */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanTickets}
          activeOpacity={0.8}>
          <MaterialIcons
            name="qr-code-scanner"
            size={24}
            color={EarthColors.beigeBone}
          />
          <ThemedText
            lightColor={EarthColors.beigeBone}
            darkColor={EarthColors.beigeBone}
            style={styles.scanButtonText}>
            Escanear Boletos
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EarthColors.grayLight || '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  tripCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 20,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tripRowLast: {
    marginBottom: 0,
  },
  tripItem: {
    flex: 1,
  },
  tripLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  tripValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  scanButton: {
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 12,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
