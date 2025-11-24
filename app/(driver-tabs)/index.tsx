import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverHeader } from '@/components/ui/driver-header';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { getJsonWithAuth, fetchWithAuth } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Helper para formatear tiempo desde array o string
const formatTime = (time: any): string => {
  if (!time) return 'N/A';
  if (Array.isArray(time)) {
    // Formato: [hour, minute]
    const [hour, minute] = time;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  return String(time);
};

// Tipo de datos del viaje
interface Trip {
  id: string;
  frequency: {
    id: string;
    route: {
      origin: string;
      destination: string;
    };
    departureTime: string;
  };
  busPlate: string;
  busSeatsCount: number;
  scheduledDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'RESCHEDULED';
  ticketsCount?: number;
  occupiedSeats?: number;
}

export default function DriverHomeScreen() {
  const [tripInProgress, setTripInProgress] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = async () => {
    try {
      const timestamp = new Date().getTime();

      // Cargar viaje en curso
      try {
        const inProgressTrip = await getJsonWithAuth<Trip>(`${API_BASE_URL}/viajes/conductor/en-curso?t=${timestamp}`);
        setTripInProgress(inProgressTrip);
      } catch (error: any) {
        // Si no hay viaje en curso (204 No Content), está bien
        if (error?.response?.status !== 204) {
          // Solo log si es un error real, no 204
        }
        setTripInProgress(null);
      }

      // Cargar viajes programados (SCHEDULED)
      const data = await getJsonWithAuth<Trip[]>(`${API_BASE_URL}/viajes/conductor?t=${timestamp}`);
      
      console.log('🚌 Viajes cargados del backend:', data.length);
      if (data.length > 0) {
        console.log('📋 Primer viaje:', JSON.stringify(data[0], null, 2));
      }

      const sortedTrips = data.sort((a, b) => {
        // Convertir scheduledDepartureTime que puede venir como array o string
        const getDateTime = (trip: Trip) => {
          const sdt = trip.scheduledDepartureTime;
          if (Array.isArray(sdt)) {
            // Formato: [year, month, day, hour, minute]
            return new Date(sdt[0], sdt[1] - 1, sdt[2], sdt[3] || 0, sdt[4] || 0);
          }
          return new Date(sdt);
        };
        
        const dateA = getDateTime(a);
        const dateB = getDateTime(b);
        return dateA.getTime() - dateB.getTime();
      });

      console.log('✅ Viajes ordenados:', sortedTrips.length);
      console.log('🔍 Primeros 3 viajes ordenados:', sortedTrips.slice(0, 3).map(t => ({
        id: t.id,
        date: t.date,
        route: `${t.routeOrigin} → ${t.routeDestination}`,
        time: Array.isArray(t.scheduledDepartureTime) 
          ? `${t.scheduledDepartureTime[3]}:${String(t.scheduledDepartureTime[4]).padStart(2, '0')}`
          : t.scheduledDepartureTime
      })));
      
      setTrips(sortedTrips);
      console.log('✅ Viajes guardados en estado:', sortedTrips.length);
    } catch (error) {
      console.error('❌ Error al cargar viajes:', error);
      Alert.alert('Error', 'No se pudieron cargar los viajes asignados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  // Recargar cuando la pantalla vuelve a estar en foco
  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTrips();
  }, []);

  const handleScanTickets = (tripId: string) => {
    router.push(`/scan-ticket?tripId=${tripId}`);
  };

  const handleStartTrip = async (tripId: string) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/viajes/${tripId}/estado?estado=IN_PROGRESS`, {
        method: 'PATCH',
      });

      if (response.ok) {
        Alert.alert('Viaje Iniciado', 'El viaje ha comenzado correctamente');
        loadTrips();
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'No se pudo iniciar el viaje');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar el viaje');
    }
  };

  const handleFinishTrip = async (tripId: string) => {
    Alert.alert(
      'Finalizar Viaje',
      '¿Estás seguro de que deseas finalizar este viaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              const response = await fetchWithAuth(`${API_BASE_URL}/viajes/${tripId}/estado?estado=COMPLETED`, {
                method: 'PATCH',
              });

              if (response.ok) {
                Alert.alert('Viaje Finalizado', 'El viaje ha sido completado');
                loadTrips();
              } else {
                Alert.alert('Error', 'No se pudo finalizar el viaje');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo finalizar el viaje');
            }
          },
        },
      ]
    );
  };

  // El viaje principal es el que está en curso, o el próximo si no hay ninguno en curso
  const mainTrip = useMemo(() => tripInProgress || trips[0], [tripInProgress, trips]);
  const upcomingTrips = useMemo(() => {
    // Si hay viaje en curso, mostrar todos los SCHEDULED
    // Si no hay viaje en curso, mostrar todos menos el primero
    return tripInProgress ? trips : trips.slice(1);
  }, [tripInProgress, trips]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <DriverHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.earthDark} />
          <ThemedText style={styles.loadingText}>Cargando viajes...</ThemedText>
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

        {/* Viaje Principal - EN CURSO o PRÓXIMO */}
        {mainTrip ? (
          <View style={styles.section} key={`main-trip-${mainTrip.id}`}>
            <View style={[styles.nextTripBadge, tripInProgress && styles.inProgressBadge]}>
              <MaterialIcons
                name={tripInProgress ? "directions-bus" : "schedule"}
                size={16}
                color={EarthColors.whiteBone}
              />
              <ThemedText
                lightColor={EarthColors.whiteBone}
                darkColor={EarthColors.whiteBone}
                style={styles.nextTripBadgeText}>
                {tripInProgress ? 'VIAJE EN CURSO' : 'PRÓXIMO VIAJE'}
              </ThemedText>
            </View>

            <View style={styles.nextTripCard} key={`card-${mainTrip.id}-${mainTrip.scheduledDate}`}>
              {/* Encabezado con ruta */}
              <View style={styles.routeHeader}>
                <View style={styles.routeContainer}>
                  <View style={styles.locationPoint} />
                  <ThemedText
                    lightColor={EarthColors.earthDarker}
                    darkColor={EarthColors.beigeLight}
                    style={styles.locationText}>
                    {mainTrip.routeOrigin || mainTrip.frequencySegment?.routeOrigin || 'Origen'}
                  </ThemedText>
                </View>
                <MaterialIcons
                  name="arrow-forward"
                  size={24}
                  color={EarthColors.earthDark}
                />
                <View style={styles.routeContainer}>
                  <View style={[styles.locationPoint, styles.locationPointDestination]} />
                  <ThemedText
                    lightColor={EarthColors.earthDarker}
                    darkColor={EarthColors.beigeLight}
                    style={styles.locationText}>
                    {mainTrip.routeDestination || mainTrip.frequencySegment?.routeDestination || 'Destino'}
                  </ThemedText>
                </View>
              </View>

              {/* Información del viaje */}
              <View style={styles.tripInfoGrid}>
                <View style={styles.infoBox}>
                  <MaterialIcons name="event" size={20} color={EarthColors.earthDark} />
                  <View style={styles.infoTextContainer}>
                    <ThemedText style={styles.infoLabel}>Fecha</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {mainTrip.scheduledDate}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <MaterialIcons name="access-time" size={20} color={EarthColors.earthDark} />
                  <View style={styles.infoTextContainer}>
                    <ThemedText style={styles.infoLabel}>Hora</ThemedText>
                    <ThemedText style={styles.tripTime}>
                      {formatTime(mainTrip.frequencySegment?.departureTime || mainTrip.frequency?.departureTime)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <MaterialIcons name="directions-bus" size={20} color={EarthColors.earthDark} />
                  <View style={styles.infoTextContainer}>
                    <ThemedText style={styles.infoLabel}>Bus</ThemedText>
                    <ThemedText style={styles.infoValue}>{mainTrip.busPlate}</ThemedText>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <MaterialIcons name="people" size={20} color={EarthColors.earthDark} />
                  <View style={styles.infoTextContainer}>
                    <ThemedText style={styles.infoLabel}>Pasajeros</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {mainTrip.ticketsCount || 0} / {mainTrip.busSeatsCount}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Botones según el estado del viaje */}
              {tripInProgress ? (
                <View style={styles.buttonRow}>
                  {/* Botón de escanear */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.scanButtonFlex]}
                    onPress={() => handleScanTickets(mainTrip.id)}
                    activeOpacity={0.8}>
                    <MaterialIcons
                      name="qr-code-scanner"
                      size={24}
                      color={EarthColors.beigeBone}
                    />
                    <ThemedText style={styles.actionButtonText}>
                      Escanear
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Botón de finalizar viaje */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.finishButton]}
                    onPress={() => handleFinishTrip(mainTrip.id)}
                    activeOpacity={0.8}>
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color={EarthColors.whiteBone}
                    />
                    <ThemedText style={styles.actionButtonText}>
                      Finalizar
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  {/* Botón de iniciar viaje */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => handleStartTrip(mainTrip.id)}
                    activeOpacity={0.8}>
                    <MaterialIcons
                      name="play-arrow"
                      size={24}
                      color={EarthColors.whiteBone}
                    />
                    <ThemedText style={styles.actionButtonText}>
                      Iniciar Viaje
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Botón de escanear (deshabilitado hasta que inicie) */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.scanButtonDisabled]}
                    disabled
                    activeOpacity={0.8}>
                    <MaterialIcons
                      name="qr-code-scanner"
                      size={24}
                      color={EarthColors.grayEarth}
                    />
                    <ThemedText style={styles.actionButtonTextDisabled}>
                      Escanear
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-busy" size={64} color={EarthColors.grayEarth} />
            <ThemedText style={styles.emptyText}>
              No tienes viajes programados
            </ThemedText>
          </View>
        )}

        {/* Lista de Próximos Viajes */}
        {upcomingTrips.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Próximos Viajes</ThemedText>

            {upcomingTrips.map((trip) => {
              // Validar que tenga información básica de ruta
              if (!trip.routeOrigin || !trip.routeDestination) return null;
              
              return (
                <View key={trip.id} style={styles.upcomingTripCard}>
                  <View style={styles.upcomingTripHeader}>
                    <View style={styles.upcomingRoute}>
                      <ThemedText style={styles.upcomingOrigin}>
                        {trip.routeOrigin || trip.frequencySegment?.routeOrigin || 'Origen'}
                      </ThemedText>
                      <MaterialIcons
                        name="arrow-forward"
                        size={16}
                        color={EarthColors.earthDark}
                      />
                      <ThemedText style={styles.upcomingDestination}>
                        {trip.routeDestination || trip.frequencySegment?.routeDestination || 'Destino'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.upcomingTripInfo}>
                    <View style={styles.upcomingInfoItem}>
                      <MaterialIcons name="event" size={16} color={EarthColors.earthDark} />
                      <ThemedText style={styles.upcomingInfoText}>
                        {trip.scheduledDate}
                      </ThemedText>
                    </View>
                    <View style={styles.upcomingInfoItem}>
                      <MaterialIcons name="access-time" size={16} color={EarthColors.earthDark} />
                      <ThemedText style={styles.upcomingInfoText}>
                        {formatTime(trip.frequencySegment?.departureTime || trip.frequency?.departureTime)}
                      </ThemedText>
                    </View>
                    <View style={styles.upcomingInfoItem}>
                      <MaterialIcons name="directions-bus" size={16} color={EarthColors.earthDark} />
                      <ThemedText style={styles.upcomingInfoText}>{trip.busPlate}</ThemedText>
                    </View>
                    <View style={styles.upcomingInfoItem}>
                      <MaterialIcons name="people" size={16} color={EarthColors.earthDark} />
                      <ThemedText style={styles.upcomingInfoText}>
                        {trip.ticketsCount || 0}/{trip.busSeatsCount}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  // Filtros
  filterContainer: {
    backgroundColor: EarthColors.whiteBone,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.grayEarth + '30',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: EarthColors.grayLight,
    borderWidth: 1,
    borderColor: EarthColors.grayEarth + '40',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: EarthColors.earthDark,
    borderColor: EarthColors.earthDark,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: EarthColors.earthDark,
  },
  filterTextActive: {
    color: EarthColors.whiteBone,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: EarthColors.earthDarker,
  },
  // Badge "PRÓXIMO VIAJE"
  nextTripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D97706', // Ámbar oscuro
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  nextTripBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inProgressBadge: {
    backgroundColor: '#10B981', // Verde para viaje en curso
  },
  // Tarjeta del viaje próximo - DESTACADA
  nextTripCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: '#FBBF24', // Ámbar
    shadowColor: '#D97706',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.grayEarth + '30',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981', // Verde
  },
  locationPointDestination: {
    backgroundColor: '#EF4444', // Rojo
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  tripInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.beigeLight + '40',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    width: '48%',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: EarthColors.earthDark,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: EarthColors.earthDarker,
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: EarthColors.beigeBone,
  },
  // Tarjetas de próximos viajes (lista)
  upcomingTripCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: EarthColors.grayEarth + '40',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingTripHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.grayEarth + '30',
  },
  upcomingRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingOrigin: {
    fontSize: 15,
    fontWeight: '700',
    color: EarthColors.earthDarker,
  },
  upcomingDestination: {
    fontSize: 15,
    fontWeight: '700',
    color: EarthColors.earthDarker,
  },
  upcomingTripInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  upcomingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: EarthColors.beigeLight + '30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upcomingInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: EarthColors.earthDark,
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
  // Botones de acción
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonFlex: {
    backgroundColor: EarthColors.blackSoft,
  },
  startButton: {
    backgroundColor: '#10B981', // Verde para iniciar
  },
  finishButton: {
    backgroundColor: '#EF4444', // Rojo para finalizar
  },
  scanButtonDisabled: {
    backgroundColor: EarthColors.grayEarth + '40',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: EarthColors.beigeBone,
  },
  actionButtonTextDisabled: {
    fontSize: 16,
    fontWeight: '700',
    color: EarthColors.grayEarth,
  },
});
