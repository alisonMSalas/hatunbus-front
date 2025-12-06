import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverHeader } from '@/components/ui/driver-header';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { getJsonWithAuth } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface Trip {
  id: string;
  frequency: {
    route: {
      origin: string;
      destination: string;
    };
    departureTime: string;
  };
  busPlate: string;
  busSeatsCount: number;
  scheduledDate: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'RESCHEDULED';
  ticketsCount?: number;
  occupiedSeats?: number;
}

export default function DriverHistoryScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const timestamp = new Date().getTime();
      const data = await getJsonWithAuth<Trip[]>(`${API_BASE_URL}/viajes/conductor/historial?t=${timestamp}`);
      setTrips(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el historial de viajes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, []);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#10B981'; // Verde
      case 'CANCELED':
        return '#EF4444'; // Rojo
      case 'IN_PROGRESS':
        return '#F59E0B'; // Ámbar
      case 'SCHEDULED':
        return '#3B82F6'; // Azul
      default:
        return '#6B7280'; // Gris
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELED':
        return 'Cancelado';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'SCHEDULED':
        return 'Programado';
      case 'RESCHEDULED':
        return 'Reprogramado';
      default:
        return status;
    }
  };

  const handleOpenReport = (tripId: string) => {
    router.push(`/driver-trip-report?tripId=${tripId}`);
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateFormat = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      const timeFormat = date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { date: dateFormat, time: timeFormat };
    }

    return { date: dateFormat, time: '' };
  };

  const totalTrips = trips.filter((t) => t.status === 'COMPLETED').length;
  const totalPassengers = trips
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, trip) => sum + (trip.ticketsCount || trip.occupiedSeats || 0), 0);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <DriverHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.earthDark} />
          <ThemedText style={styles.loadingText}>Cargando historial...</ThemedText>
        </View>
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
            onRefresh={onRefresh}
            tintColor={EarthColors.earthDark}
          />
        }>
        
        {/* Estadísticas Resumen */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons
              name="directions-bus"
              size={24}
              color={EarthColors.earthPrimary}
            />
            <ThemedText
              lightColor={EarthColors.earthDarker}
              darkColor={EarthColors.beigeLight}
              style={styles.statValue}>
              {totalTrips}
            </ThemedText>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.statLabel}>
              Viajes
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons
              name="people"
              size={24}
              color={EarthColors.earthPrimary}
            />
            <ThemedText
              lightColor={EarthColors.earthDarker}
              darkColor={EarthColors.beigeLight}
              style={styles.statValue}>
              {totalPassengers}
            </ThemedText>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.statLabel}>
              Pasajeros
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons
              name="attach-money"
              size={24}
              color={EarthColors.earthPrimary}
            />
            <ThemedText
              lightColor={EarthColors.earthDarker}
              darkColor={EarthColors.beigeLight}
              style={styles.statValue}>
              --
            </ThemedText>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.statLabel}>
              Calificación
            </ThemedText>
          </View>
        </View>


        {/* Lista de Viajes */}
        <View style={styles.tripsList}>
          {trips.length > 0 ? (
            trips.map((trip, index) => {
              try {
                const date = trip.scheduledDate;
                const time = trip.frequencySegment?.departureTime || trip.frequency?.departureTime || '00:00:00';
                const arrivalTime = trip.scheduledArrivalTime
                  ? new Date(trip.scheduledArrivalTime).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : 'N/A';

                return (
                  <TouchableOpacity key={trip.id} style={styles.tripCard} activeOpacity={0.85} onPress={() => handleOpenReport(trip.id)}>
                  <View style={styles.tripHeader}>
                    <View style={styles.tripRouteContainer}>
                      <MaterialIcons
                        name="route"
                        size={20}
                        color={EarthColors.earthPrimary}
                      />
                      <ThemedText
                        lightColor={EarthColors.earthDarker}
                        darkColor={EarthColors.beigeLight}
                        style={styles.tripRoute}>
                        {trip.routeOrigin || trip.frequencySegment?.routeOrigin} - {trip.routeDestination || trip.frequencySegment?.routeDestination}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(trip.status) + '20' },
                      ]}>
                      <ThemedText
                        lightColor={getStatusColor(trip.status)}
                        darkColor={getStatusColor(trip.status)}
                        style={styles.statusBadgeText}>
                        {getStatusText(trip.status)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.tripDetails}>
                    <View style={styles.tripDetailRow}>
                      <MaterialIcons
                        name="calendar-today"
                        size={16}
                        color={EarthColors.earthDark}
                      />
                      <ThemedText
                        lightColor={EarthColors.earthDark}
                        darkColor={EarthColors.grayEarth}
                        style={styles.tripDetailText}>
                        {date}
                      </ThemedText>
                    </View>
                    <View style={styles.tripDetailRow}>
                      <MaterialIcons name="schedule" size={16} color={EarthColors.earthDark} />
                      <ThemedText
                        lightColor={EarthColors.earthDark}
                        darkColor={EarthColors.grayEarth}
                        style={styles.tripDetailText}>
                        {time} - {arrivalTime}
                      </ThemedText>
                    </View>
                    <View style={styles.tripDetailRow}>
                      <MaterialIcons name="directions-bus" size={16} color={EarthColors.earthDark} />
                      <ThemedText
                        lightColor={EarthColors.earthDark}
                        darkColor={EarthColors.grayEarth}
                        style={styles.tripDetailText}>
                        Bus {trip.busPlate}
                      </ThemedText>
                    </View>
                    <View style={styles.tripDetailRow}>
                      <MaterialIcons name="people" size={16} color={EarthColors.earthDark} />
                      <ThemedText
                        lightColor={EarthColors.earthDark}
                        darkColor={EarthColors.grayEarth}
                        style={styles.tripDetailText}>
                        {trip.ticketsCount || trip.occupiedSeats || 0} / {trip.busSeatsCount}{' '}
                        pasajeros
                      </ThemedText>
                    </View>
                  </View>
                  </TouchableOpacity>
                );
              } catch (error) {
                return null;
              }
            })
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color={EarthColors.grayEarth} />
              <ThemedText style={styles.emptyText}>No hay viajes en el historial</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EarthColors.grayLight || '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: EarthColors.earthDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: EarthColors.whiteBone,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  filterButtonActive: {
    backgroundColor: EarthColors.blackSoft,
    borderColor: EarthColors.blackSoft,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tripsList: {
    gap: 12,
  },
  tripCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripRouteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tripRoute: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tripDetails: {
    gap: 8,
  },
  tripDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripDetailText: {
    fontSize: 14,
  },
  revenueText: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: EarthColors.grayEarth,
    textAlign: 'center',
  },
});
