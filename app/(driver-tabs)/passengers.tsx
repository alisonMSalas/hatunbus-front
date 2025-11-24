import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverHeader } from '@/components/ui/driver-header';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { getJsonWithAuth } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

// Helper para convertir array de fecha/hora a Date
const arrayToDate = (dateArray: any): Date => {
  if (Array.isArray(dateArray)) {
    // Formato: [year, month, day, hour, minute] o [year, month, day, hour, minute, second, nanosecond]
    const [year, month, day, hour = 0, minute = 0] = dateArray;
    return new Date(year, month - 1, day, hour, minute);
  }
  return new Date(dateArray);
};

interface Ticket {
  id: string;
  passengerName: string;
  seatNumber: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'USED' | 'CANCELED' | 'EXPIRED';
  originStopName: string;
  destinationStopName: string;
  passengerIdCard?: string;
  usageDate?: string;
}

interface Trip {
  id: string;
  frequency: {
    route: {
      origin: string;
      destination: string;
    };
  };
  scheduledDepartureTime: string;
  estimatedArrivalTime?: string;
  status: string;
}

export default function DriverPassengersScreen() {
  const [sortBy, setSortBy] = useState<'seat' | 'name'>('seat');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);

  const loadPassengers = async () => {
    try {
      setLoading(true);
      
      // Primero obtener el viaje en curso (IN_PROGRESS)
      const tripsResponse = await getJsonWithAuth<any>(`${API_BASE_URL}/viajes/conductor/en-curso`);
      
      console.log('Trips response:', JSON.stringify(tripsResponse, null, 2));
      
      // Verificar si la respuesta es un array o un objeto
      let currentTrip;
      if (Array.isArray(tripsResponse)) {
        if (tripsResponse.length === 0) {
          setTickets([]);
          setTrip(null);
          setTripId(null);
          return;
        }
        currentTrip = tripsResponse[0];
      } else if (tripsResponse && tripsResponse.id) {
        // Es un objeto directo
        currentTrip = tripsResponse;
      } else {
        // No hay viaje en curso
        setTickets([]);
        setTrip(null);
        setTripId(null);
        return;
      }

      console.log('Current trip:', currentTrip);
      setTrip(currentTrip);
      setTripId(currentTrip.id);

      // Cargar los boletos del viaje
      const ticketsResponse = await getJsonWithAuth<Ticket[]>(`${API_BASE_URL}/boletos/viaje/${currentTrip.id}`);
      console.log('Tickets response:', ticketsResponse);
      setTickets(ticketsResponse || []);
      
    } catch (error) {
      console.error('Error al cargar pasajeros:', error);
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadPassengers();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadPassengers();
  };

  const handleVerifyID = (passengerId: string) => {
    // Aquí irá la lógica para verificar la cédula
  };

  const handleScanTicket = () => {
    if (tripId) {
      router.push(`/scan-ticket?tripId=${tripId}`);
    }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortBy === 'seat') {
      return a.seatNumber.localeCompare(b.seatNumber);
    }
    return a.passengerName.localeCompare(b.passengerName);
  });

  const scannedCount = tickets.filter(t => t.status === 'USED').length;
  const pendingCount = tickets.filter(t => t.status === 'PAID').length;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <DriverHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.earthPrimary} />
          <ThemedText style={styles.loadingText}>Cargando pasajeros...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!trip) {
    return (
      <ThemedView style={styles.container}>
        <DriverHeader />
        <View style={styles.emptyContainer}>
          <MaterialIcons name="directions-bus-filled" size={64} color={EarthColors.grayEarth} />
          <ThemedText style={styles.emptyText}>No hay viaje en progreso</ThemedText>
          <ThemedText style={[styles.emptyText, { fontSize: 14, marginTop: -8 }]}>
            Inicia un viaje desde la pestaña "Inicio"
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (tickets.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <DriverHeader />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[EarthColors.earthPrimary]}
            />
          }>
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
                {trip.routeOrigin || trip.frequencySegment?.routeOrigin} → {trip.routeDestination || trip.frequencySegment?.routeDestination}
              </ThemedText>
              <ThemedText
                lightColor={EarthColors.earthDark}
                darkColor={EarthColors.grayEarth}
                style={styles.tripTime}>
                {arrayToDate(trip.scheduledDepartureTime).toLocaleString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: 'short'
                })}
              </ThemedText>
            </View>
          </View>
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={64} color={EarthColors.grayEarth} />
            <ThemedText style={styles.emptyText}>No hay pasajeros registrados</ThemedText>
            <ThemedText style={[styles.emptyText, { fontSize: 14, marginTop: -8 }]}>
              Aún no se han vendido boletos para este viaje
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <DriverHeader />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[EarthColors.earthPrimary]}
          />
        }>
        
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
              {trip.routeOrigin || trip.frequencySegment?.routeOrigin} → {trip.routeDestination || trip.frequencySegment?.routeDestination}
            </ThemedText>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.tripTime}>
              {arrayToDate(trip.scheduledDepartureTime).toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: 'short'
              })}
            </ThemedText>
          </View>
        </View>

        {/* Estadísticas de Escaneo */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="check-circle" size={24} color="#10B981" />
            <ThemedText style={[styles.statNumber, { color: '#10B981' }]}>
              {scannedCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Escaneados</ThemedText>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="hourglass-empty" size={24} color="#F59E0B" />
            <ThemedText style={[styles.statNumber, { color: '#F59E0B' }]}>
              {pendingCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Pendientes</ThemedText>
          </View>
        </View>

        {/* Lista de Pasajeros Header */}
        <View style={styles.listHeader}>
          <ThemedText
            lightColor={EarthColors.earthDarker}
            darkColor={EarthColors.beigeLight}
            style={styles.listTitle}>
            Lista de Pasajeros ({tickets.length})
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
          {sortedTickets.map((ticket) => (
            <View
              key={ticket.id}
              style={[
                styles.passengerCard,
                ticket.status === 'PAID' && styles.pendingCard,
              ]}>
              <View style={styles.passengerInfo}>
                <ThemedText
                  lightColor={EarthColors.earthDarker}
                  darkColor={EarthColors.beigeLight}
                  style={styles.passengerName}>
                  {ticket.passengerName}
                </ThemedText>
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.passengerSeat}>
                  Asiento {ticket.seatNumber}
                </ThemedText>
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.passengerRoute}>
                  {ticket.originStopName} → {ticket.destinationStopName}
                </ThemedText>
                {ticket.status === 'PAID' && (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => handleVerifyID(ticket.id)}
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
                {ticket.status === 'USED' ? (
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
                    {ticket.usageDate && (
                      <ThemedText
                        lightColor={EarthColors.grayEarth}
                        darkColor={EarthColors.grayEarth}
                        style={styles.usageTime}>
                        {new Date(ticket.usageDate).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </ThemedText>
                    )}
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
    marginBottom: 4,
  },
  passengerRoute: {
    fontSize: 12,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: EarthColors.earthDark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: EarthColors.grayEarth,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: EarthColors.grayEarth,
  },
  usageTime: {
    fontSize: 10,
    marginTop: 2,
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
