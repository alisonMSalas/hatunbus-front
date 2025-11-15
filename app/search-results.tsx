import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { getJsonWithAuth } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
  originStopId: string | null;
  destinationStopId: string | null;
}

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const [trips, setTrips] = useState<TripResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  const searchParams = {
    origin: Array.isArray(params.origin) ? params.origin[0] : params.origin || '',
    destination: Array.isArray(params.destination) ? params.destination[0] : params.destination || '',
    date: Array.isArray(params.date) ? params.date[0] : params.date || '',
    passengers: Array.isArray(params.passengers) ? params.passengers[0] : params.passengers || '1',
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await getJsonWithAuth(
        `${API_BASE_URL}/viajes/buscar?fecha=${searchParams.date}&origen=${encodeURIComponent(searchParams.origin)}&destino=${encodeURIComponent(searchParams.destination)}`
      );

      // Map backend data to frontend format
      const mappedTrips = data.map((trip: any) => {
        // Calcular hora de llegada si no viene del backend
        let arrivalTime = trip.scheduledArrivalTime;
        if (!arrivalTime && trip.scheduledDepartureTime && trip.frequency?.estimatedDuration) {
          const departure = new Date(trip.scheduledDepartureTime);
          const arrival = new Date(departure.getTime() + trip.frequency.estimatedDuration * 60000);
          arrivalTime = arrival.toISOString();
        }

        // Formatear precio con 2 decimales
        let price = '0.00';
        const basePrice = trip.frequency?.route?.basePrice;
        if (basePrice != null) {
          const priceNum = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;
          if (!isNaN(priceNum)) {
            price = priceNum.toFixed(2);
          }
        }

        // Como no hay stops en la BD, usar directamente los IDs de las ciudades de la ruta
        // Estos IDs se usarán como "stop IDs" temporalmente
        const originCityId = trip.frequency?.route?.originCityId || trip.routeOriginCityId;
        const destinationCityId = trip.frequency?.route?.destinationCityId || trip.routeDestinationCityId;

        console.log('Origin City ID:', originCityId);
        console.log('Destination City ID:', destinationCityId);

        return {
          id: trip.id,
          operator: trip.frequency?.cooperativeName || 'Cooperativa',
          seatType: trip.busSeatsCount ? `${trip.busSeatsCount} asientos` : 'Bus',
          price: price,
          departureTime: formatTime(trip.scheduledDepartureTime),
          departureCity: trip.routeOrigin || searchParams.origin,
          arrivalTime: formatTime(arrivalTime),
          originStopId: originCityId,
          destinationStopId: destinationCityId,
          arrivalCity: trip.routeDestination || searchParams.destination,
          duration: calculateDuration(trip.scheduledDepartureTime, arrivalTime),
        };
      });

      setTrips(mappedTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
      alert('Error al cargar los viajes. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime: string) => {
    if (!datetime) return '--:--';
    const date = new Date(datetime);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (departure: string, arrival: string) => {
    if (!departure || !arrival) return '--';
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diff = arr.getTime() - dep.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

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
        originStopId: trip.originStopId || '',
        destinationStopId: trip.destinationStopId || '',
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

        {/* Loading Indicator */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={EarthColors.blackSoft} />
            <ThemedText style={styles.loadingText}>Buscando viajes...</ThemedText>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={64} color={EarthColors.earthDark} />
            <ThemedText style={styles.emptyText}>No se encontraron viajes</ThemedText>
            <ThemedText style={styles.emptySubtext}>Intenta con otras fechas o ciudades</ThemedText>
          </View>
        ) : null}

        {/* Trip Results */}
        {!loading && trips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            {/* Operator, Seat Type and Price */}
            <View style={styles.tripHeader}>
              <View style={styles.operatorInfo}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.operator}
                  numberOfLines={2}>
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  operatorInfo: {
    flex: 1,
    marginRight: 12,
  },
  operator: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  seatType: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
    minWidth: 100,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: EarthColors.earthDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: EarthColors.earthDarker,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: EarthColors.earthDark,
  },
});

