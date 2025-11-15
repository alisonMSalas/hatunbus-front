import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverHeader } from '@/components/ui/driver-header';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface Passenger {
  id: string;
  name: string;
  seat: string;
  status: 'scanned' | 'pending';
}

export default function DriverPassengersScreen() {
  const [sortBy, setSortBy] = useState<'seat' | 'name'>('seat');

  // Datos de ejemplo - en el futuro vendrán de la API
  const tripDetails = {
    route: 'Lima a Arequipa',
    departureTime: '12:00 PM',
    arrivalTime: '4:00 PM',
  };

  const passengers: Passenger[] = [
    { id: '1', name: 'Carlos Ramirez', seat: '1A', status: 'scanned' },
    { id: '2', name: 'Sofia Vargas', seat: '2B', status: 'pending' },
    { id: '3', name: 'Diego Rodriguez', seat: '3C', status: 'pending' },
    { id: '4', name: 'Isabella Torres', seat: '4D', status: 'scanned' },
    { id: '5', name: 'Mateo Fernandez', seat: '5A', status: 'scanned' },
    { id: '6', name: 'Alejandro Castro', seat: '6B', status: 'pending' },
  ];

  const handleVerifyID = (passengerId: string) => {
    // Aquí irá la lógica para verificar la cédula
  };

  const handleScanTicket = () => {
    router.push('/scan-ticket');
  };

  const sortedPassengers = [...passengers].sort((a, b) => {
    if (sortBy === 'seat') {
      return a.seat.localeCompare(b.seat);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <ThemedView style={styles.container}>
      <DriverHeader />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Detalles del Viaje */}
        <View style={styles.tripDetailsCard}>
          <MaterialIcons
            name="directions-bus"
            size={32}
            color={EarthColors.earthPrimary}
          />
          <View style={styles.tripDetailsContent}>
            <ThemedText
              lightColor={EarthColors.earthDarker}
              darkColor={EarthColors.beigeLight}
              style={styles.tripRoute}>
              {tripDetails.route}
            </ThemedText>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.tripTime}>
              {tripDetails.departureTime} - {tripDetails.arrivalTime}
            </ThemedText>
          </View>
        </View>

        {/* Lista de Pasajeros Header */}
        <View style={styles.listHeader}>
          <ThemedText
            lightColor={EarthColors.earthDarker}
            darkColor={EarthColors.beigeLight}
            style={styles.listTitle}>
            Lista de Pasajeros ({passengers.length})
          </ThemedText>
          <View style={styles.sortContainer}>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.sortLabel}>
              Ordenar por
            </ThemedText>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortBy(sortBy === 'seat' ? 'name' : 'seat')}
              activeOpacity={0.7}>
              <ThemedText
                lightColor={EarthColors.earthDarker}
                darkColor={EarthColors.beigeLight}
                style={styles.sortText}>
                {sortBy === 'seat' ? 'Asiento' : 'Nombre'}
              </ThemedText>
              <MaterialIcons
                name="arrow-drop-down"
                size={20}
                color={EarthColors.earthDarker}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Passenger List */}
        <View style={styles.passengerList}>
          {sortedPassengers.map((passenger) => (
            <View
              key={passenger.id}
              style={[
                styles.passengerCard,
                passenger.status === 'pending' && styles.pendingCard,
              ]}>
              <View style={styles.passengerInfo}>
                <ThemedText
                  lightColor={EarthColors.earthDarker}
                  darkColor={EarthColors.beigeLight}
                  style={styles.passengerName}>
                  {passenger.name}
                </ThemedText>
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.passengerSeat}>
                  Asiento {passenger.seat}
                </ThemedText>
                {passenger.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => handleVerifyID(passenger.id)}
                    activeOpacity={0.7}>
                    <MaterialIcons
                      name="badge"
                      size={16}
                      color={EarthColors.earthPrimary}
                    />
                    <ThemedText
                      lightColor={EarthColors.earthPrimary}
                      darkColor={EarthColors.earthLight}
                      style={styles.verifyButtonText}>
                      Verificar Cédula
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.statusContainer}>
                {passenger.status === 'scanned' ? (
                  <>
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color="#10B981"
                    />
                    <ThemedText
                      lightColor="#10B981"
                      darkColor="#10B981"
                      style={styles.statusText}>
                      Escaneado
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <MaterialIcons
                      name="hourglass-empty"
                      size={24}
                      color="#F59E0B"
                    />
                    <ThemedText
                      lightColor="#F59E0B"
                      darkColor="#F59E0B"
                      style={styles.statusText}>
                      Pendiente
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Scan Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanTicket}
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
            Escanear Boleto
          </ThemedText>
        </TouchableOpacity>
      </View>
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
  tripDetailsCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tripDetailsContent: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  tripTime: {
    fontSize: 14,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '700',
  },
  passengerList: {
    gap: 12,
  },
  passengerCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingCard: {
    borderWidth: 2,
    borderColor: EarthColors.earthPrimary,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  passengerSeat: {
    fontSize: 14,
    marginBottom: 8,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  scanButton: {
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    fontWeight: '700',
  },
});
