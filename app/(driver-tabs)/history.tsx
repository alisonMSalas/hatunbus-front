import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverHeader } from '@/components/ui/driver-header';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface TripHistory {
  id: string;
  route: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  passengers: number;
  totalSeats: number;
  status: 'completed' | 'cancelled';
  revenue?: number;
}

export default function DriverHistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Datos de ejemplo - en el futuro vendrán de la API
  const trips: TripHistory[] = [
    {
      id: '1',
      route: 'Lima - Arequipa',
      date: '15/03/2024',
      departureTime: '12:00 PM',
      arrivalTime: '4:00 PM',
      passengers: 38,
      totalSeats: 40,
      status: 'completed',
      revenue: 950,
    },
    {
      id: '2',
      route: 'Arequipa - Cusco',
      date: '14/03/2024',
      departureTime: '8:00 AM',
      arrivalTime: '2:00 PM',
      passengers: 40,
      totalSeats: 40,
      status: 'completed',
      revenue: 1000,
    },
    {
      id: '3',
      route: 'Cusco - Lima',
      date: '13/03/2024',
      departureTime: '10:00 AM',
      arrivalTime: '6:00 PM',
      passengers: 35,
      totalSeats: 40,
      status: 'completed',
      revenue: 875,
    },
    {
      id: '4',
      route: 'Lima - Trujillo',
      date: '12/03/2024',
      departureTime: '6:00 AM',
      arrivalTime: '12:00 PM',
      passengers: 0,
      totalSeats: 40,
      status: 'cancelled',
    },
    {
      id: '5',
      route: 'Trujillo - Lima',
      date: '11/03/2024',
      departureTime: '2:00 PM',
      arrivalTime: '8:00 PM',
      passengers: 32,
      totalSeats: 40,
      status: 'completed',
      revenue: 800,
    },
  ];

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  const getStatusColor = (status: string) => {
    return status === 'completed' ? '#10B981' : '#EF4444';
  };

  const getStatusText = (status: string) => {
    return status === 'completed' ? 'Completado' : 'Cancelado';
  };

  const totalRevenue = trips
    .filter(t => t.status === 'completed' && t.revenue)
    .reduce((sum, trip) => sum + (trip.revenue || 0), 0);

  const totalTrips = trips.filter(t => t.status === 'completed').length;
  const totalPassengers = trips
    .filter(t => t.status === 'completed')
    .reduce((sum, trip) => sum + trip.passengers, 0);

  return (
    <ThemedView style={styles.container}>
      <DriverHeader />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
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
              ${totalRevenue}
            </ThemedText>
            <ThemedText
              lightColor={EarthColors.earthDark}
              darkColor={EarthColors.grayEarth}
              style={styles.statLabel}>
              Ingresos
            </ThemedText>
          </View>
        </View>

        {/* Filtros */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}>
            <ThemedText
              lightColor={filter === 'all' ? EarthColors.beigeBone : EarthColors.earthDark}
              darkColor={filter === 'all' ? EarthColors.beigeBone : EarthColors.grayEarth}
              style={styles.filterText}>
              Todos
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
            onPress={() => setFilter('completed')}
            activeOpacity={0.7}>
            <ThemedText
              lightColor={filter === 'completed' ? EarthColors.beigeBone : EarthColors.earthDark}
              darkColor={filter === 'completed' ? EarthColors.beigeBone : EarthColors.grayEarth}
              style={styles.filterText}>
              Completados
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setFilter('cancelled')}
            activeOpacity={0.7}>
            <ThemedText
              lightColor={filter === 'cancelled' ? EarthColors.beigeBone : EarthColors.earthDark}
              darkColor={filter === 'cancelled' ? EarthColors.beigeBone : EarthColors.grayEarth}
              style={styles.filterText}>
              Cancelados
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Lista de Viajes */}
        <View style={styles.tripsList}>
          {filteredTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
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
                    {trip.route}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
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
                    {trip.date}
                  </ThemedText>
                </View>
                <View style={styles.tripDetailRow}>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={EarthColors.earthDark}
                  />
                  <ThemedText
                    lightColor={EarthColors.earthDark}
                    darkColor={EarthColors.grayEarth}
                    style={styles.tripDetailText}>
                    {trip.departureTime} - {trip.arrivalTime}
                  </ThemedText>
                </View>
                <View style={styles.tripDetailRow}>
                  <MaterialIcons
                    name="people"
                    size={16}
                    color={EarthColors.earthDark}
                  />
                  <ThemedText
                    lightColor={EarthColors.earthDark}
                    darkColor={EarthColors.grayEarth}
                    style={styles.tripDetailText}>
                    {trip.passengers} / {trip.totalSeats} pasajeros
                  </ThemedText>
                </View>
                {trip.revenue && (
                  <View style={styles.tripDetailRow}>
                    <MaterialIcons
                      name="attach-money"
                      size={16}
                      color={EarthColors.earthPrimary}
                    />
                    <ThemedText
                      lightColor={EarthColors.earthPrimary}
                      darkColor={EarthColors.earthLight}
                      style={[styles.tripDetailText, styles.revenueText]}>
                      ${trip.revenue} ingresos
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          ))}
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
});
