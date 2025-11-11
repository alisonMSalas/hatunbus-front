import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface TripResult {
  id: string;
  operator: string;
  seatType: string;
  price: string;
  departureTime: string;
  departureCity: string;
  arrivalTime: string;
  arrivalCity: string;
  duration: string;
}

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  
  // Datos de ejemplo - en el futuro vendrán de la API
  const searchParams = {
    origin: Array.isArray(params.origin) ? params.origin[0] : params.origin || 'Nueva York',
    destination: Array.isArray(params.destination) ? params.destination[0] : params.destination || 'Chicago',
    date: Array.isArray(params.date) ? params.date[0] : params.date || 'Hoy',
    passengers: Array.isArray(params.passengers) ? params.passengers[0] : params.passengers || '1',
  };

  const trips: TripResult[] = [
    {
      id: '1',
      operator: 'Coop. El Rápido',
      seatType: 'Bus Cama',
      price: '25.00',
      departureTime: '08:00 AM',
      departureCity: 'Nueva York',
      arrivalTime: '04:00 PM',
      arrivalCity: 'Chicago',
      duration: '8h 0m',
    },
    {
      id: '2',
      operator: 'Coop. Veloz',
      seatType: 'Semicama',
      price: '22.50',
      departureTime: '09:30 AM',
      departureCity: 'Nueva York',
      arrivalTime: '06:00 PM',
      arrivalCity: 'Chicago',
      duration: '8h 30m',
    },
    {
      id: '3',
      operator: 'Coop. Express',
      seatType: 'Bus Cama',
      price: '28.00',
      departureTime: '10:00 AM',
      departureCity: 'Nueva York',
      arrivalTime: '05:45 PM',
      arrivalCity: 'Chicago',
      duration: '7h 45m',
    },
  ];

  const handleSelectTrip = (trip: TripResult) => {
    // Navegar a la pantalla de detalles del viaje
    router.push({
      pathname: '/trip-details',
      params: {
        tripId: trip.id,
        operator: trip.operator,
        seatType: trip.seatType,
        price: trip.price,
        departureTime: trip.departureTime,
        departureCity: trip.departureCity,
        arrivalTime: trip.arrivalTime,
        arrivalCity: trip.arrivalCity,
        duration: trip.duration,
        passengers: searchParams.passengers,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Resultados de Búsqueda" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Search Summary Bar */}
        <View style={styles.searchSummary}>
          <View style={styles.searchRoute}>
            <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.routeText}>
              {searchParams.origin}
            </ThemedText>
            <MaterialIcons name="arrow-forward" size={20} color={EarthColors.earthDarker} />
            <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.routeText}>
              {searchParams.destination}
            </ThemedText>
          </View>
          <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.searchMeta}>
            {searchParams.date}, {searchParams.passengers} {parseInt(searchParams.passengers) === 1 ? 'Pasajero' : 'Pasajeros'}
          </ThemedText>
        </View>

        {/* Results Count and Filter */}
        <View style={styles.resultsHeader}>
          <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.resultsCount}>
            Resultados ({trips.length})
          </ThemedText>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={24} color={EarthColors.earthDarker} />
          </TouchableOpacity>
        </View>

        {/* Trip Results */}
        {trips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            {/* Operator and Seat Type */}
            <View style={styles.tripHeader}>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.operator}>
                {trip.operator}
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.seatType}>
                {trip.seatType}
              </ThemedText>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <ThemedText 
                type="subtitle" 
                lightColor={EarthColors.earthPrimary} 
                darkColor={EarthColors.earthLight} 
                style={styles.price}>
                ${trip.price}
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.priceLabel}>
                por pasajero
              </ThemedText>
            </View>

            {/* Trip Details */}
            <View style={styles.tripDetails}>
              {/* Departure */}
              <View style={styles.timeContainer}>
                <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.time}>
                  {trip.departureTime}
                </ThemedText>
                <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.city}>
                  {trip.departureCity}
                </ThemedText>
              </View>

              {/* Duration with Bus Icon */}
              <View style={styles.durationContainer}>
                <MaterialIcons name="directions-bus" size={24} color={EarthColors.blackSoft} />
                <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.duration}>
                  {trip.duration}
                </ThemedText>
              </View>

              {/* Arrival */}
              <View style={styles.timeContainerRight}>
                <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.time}>
                  {trip.arrivalTime}
                </ThemedText>
                <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.city}>
                  {trip.arrivalCity}
                </ThemedText>
              </View>
            </View>

            {/* Select Trip Button */}
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => handleSelectTrip(trip)}
              activeOpacity={0.8}>
              <ThemedText lightColor={EarthColors.beigeBone} darkColor={EarthColors.beigeBone} style={styles.selectButtonText}>
                Seleccionar Viaje
              </ThemedText>
            </TouchableOpacity>
          </View>
        ))}
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
  searchSummary: {
    backgroundColor: EarthColors.beigeLight || '#F5F1EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  searchRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  searchMeta: {
    fontSize: 14,
    marginTop: 4,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterButton: {
    padding: 4,
  },
  tripCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  operator: {
    fontSize: 18,
    fontWeight: '700',
  },
  seatType: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
  },
  priceLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  timeContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  timeContainerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
  },
  durationContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  duration: {
    fontSize: 12,
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.beigeBone,
  },
});

