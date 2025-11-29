import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/api';
import { getJsonWithAuth } from '@/services/api';
import { TripDto } from '@/types/trip';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';

// Helper para convertir array de fecha/hora a Date
const arrayToDate = (dateArray: any): Date => {
  if (!dateArray) return new Date();
  if (Array.isArray(dateArray)) {
    // Formato: [year, month, day, hour, minute] o [year, month, day, hour, minute, second, nanosecond]
    const [year, month, day, hour = 0, minute = 0] = dateArray;
    return new Date(year, month - 1, day, hour, minute);
  }
  return new Date(dateArray);
};

interface TripDetails {
  id: string;
  cooperative: string;
  busUnitNumber: string;
  busPlate: string;
  busChassisBrand: string;
  busBodyBrand: string;
  busSeatsCount: number;
  busPhotoUrl: string | null;
  driverName: string;
  departureTime: string;
  arrivalTime: string;
  routeName: string;
  routeOrigin: string;
  routeDestination: string;
  availableSeats: number;
  occupiedSeats: number;
}

export default function TripDetailsScreen() {
  const params = useLocalSearchParams();
  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;

  useEffect(() => {
    loadTripDetails();
  }, []);

  const loadTripDetails = async () => {
    try {
      setLoading(true);
      const data: TripDto = await getJsonWithAuth(`${API_BASE_URL}/viajes/${tripId}`);

      const formattedTrip: TripDetails = {
        id: data.id,
        cooperative: data.frequency?.cooperativeName || 'Cooperativa',
        busUnitNumber: data.busUnitNumber ? `Bus #${data.busUnitNumber}` : data.busPlate || 'N/A',
        busPlate: data.busPlate || 'N/A',
        busChassisBrand: data.busChassisBrand || 'N/A',
        busBodyBrand: data.busBodyBrand || 'N/A',
        busSeatsCount: data.busSeatsCount || 0,
        busPhotoUrl: data.busPhotoUrl,
        driverName: data.driverName || data.mainDriverName || 'N/A',
        departureTime: formatTime(data.scheduledDepartureTime),
        arrivalTime: formatTime(data.scheduledArrivalTime),
        routeName: data.routeName || '',
        routeOrigin: data.routeOrigin || data.frequencySegment?.routeOrigin || '',
        routeDestination: data.routeDestination || data.frequencySegment?.routeDestination || '',
        availableSeats: data.availableSeats || 0,
        occupiedSeats: data.occupiedSeats || 0,
      };

      setTripData(formattedTrip);
    } catch (error) {
      console.error('Error al cargar detalles del viaje:', error);
      alert('Error al cargar los detalles del viaje');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime: any) => {
    if (!datetime) return '--:--';
    const date = arrayToDate(datetime);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSelectSeats = () => {
    if (!tripData) return;

    const passengers = Array.isArray(params.passengers)
      ? params.passengers[0]
      : params.passengers || '1';

    const originCityId =
      (Array.isArray(params.originCityId) ? params.originCityId[0] : params.originCityId) ||
      (Array.isArray(params.originStopId) ? params.originStopId[0] : params.originStopId) ||
      '';
    const destinationCityId =
      (Array.isArray(params.destinationCityId) ? params.destinationCityId[0] : params.destinationCityId) ||
      (Array.isArray(params.destinationStopId) ? params.destinationStopId[0] : params.destinationStopId) ||
      '';

    router.push({
      pathname: '/passenger-details',
      params: {
        passengers: passengers,
        tripId: tripData.id,
        operator: tripData.cooperative,
        price: Array.isArray(params.price) ? params.price[0] : params.price,
        departureTime: tripData.departureTime,
        arrivalTime: tripData.arrivalTime,
        busSeatsCount: tripData.busSeatsCount.toString(),
        originCityId,
        destinationCityId,
      },
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Detalles del Viaje" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.blackSoft} />
          <ThemedText style={styles.loadingText}>Cargando detalles...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!tripData) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Detalles del Viaje" />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>No se pudo cargar la información del viaje</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header title="Detalles del Viaje" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Cooperative Section */}
        <View style={styles.section}>
          <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.sectionTitle}>
            Cooperativa
          </ThemedText>
          <View style={styles.card}>
            <View style={styles.cooperativeContent}>
              <View style={styles.cooperativeIcon}>
                <MaterialIcons name="directions-bus" size={32} color={EarthColors.beigeBone} />
              </View>
              <View style={styles.cooperativeInfo}>
                <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.cooperativeName}>
                  {tripData.cooperative}
                </ThemedText>
                <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.busNumber}>
                  {tripData.busUnitNumber}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Bus Image */}
        {tripData.busPhotoUrl && (
          <View style={styles.busImageContainer}>
            <Image
              source={{ uri: tripData.busPhotoUrl }}
              style={styles.busImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Bus Information Section */}
        <View style={styles.section}>
          <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.sectionTitle}>
            Información del Bus
          </ThemedText>
          <View style={styles.busInfoGrid}>
            <View style={styles.busInfoCard}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.busInfoLabel}>
                Placa
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.busInfoValue}>
                {tripData.busPlate}
              </ThemedText>
            </View>
            <View style={styles.busInfoCard}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.busInfoLabel}>
                Asientos
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.busInfoValue}>
                {tripData.busSeatsCount}
              </ThemedText>
            </View>
            <View style={styles.busInfoCard}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.busInfoLabel}>
                Marca Chasis
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.busInfoValue}>
                {tripData.busChassisBrand}
              </ThemedText>
            </View>
            <View style={styles.busInfoCard}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.busInfoLabel}>
                Marca Carrocería
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.busInfoValue}>
                {tripData.busBodyBrand}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Trip Details Section */}
        <View style={styles.section}>
          <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.sectionTitle}>
            Detalles del Viaje
          </ThemedText>
          <View style={styles.card}>
            <View style={styles.tripDetailRow}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.tripDetailLabel}>
                Ruta
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.tripDetailValue}>
                {tripData.routeOrigin} → {tripData.routeDestination}
              </ThemedText>
            </View>
            <View style={styles.tripDetailRow}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.tripDetailLabel}>
                Hora de Salida
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.tripDetailValue}>
                {tripData.departureTime}
              </ThemedText>
            </View>
            <View style={styles.tripDetailRow}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.tripDetailLabel}>
                Hora de Llegada
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.tripDetailValue}>
                {tripData.arrivalTime}
              </ThemedText>
            </View>
            <View style={styles.tripDetailRow}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.tripDetailLabel}>
                Conductor
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.tripDetailValue}>
                {tripData.driverName}
              </ThemedText>
            </View>
            <View style={[styles.tripDetailRow, styles.tripDetailRowLast]}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.tripDetailLabel}>
                Asientos Disponibles
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.tripDetailValue}>
                {tripData.availableSeats} / {tripData.busSeatsCount}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Select Seats Button */}
        <TouchableOpacity
          style={styles.selectSeatsButton}
          onPress={handleSelectSeats}
          activeOpacity={0.8}>
          <ThemedText lightColor={EarthColors.beigeBone} darkColor={EarthColors.beigeBone} style={styles.selectSeatsButtonText}>
            Seleccionar Asientos
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
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
  cooperativeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cooperativeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: EarthColors.earthDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cooperativeInfo: {
    flex: 1,
  },
  cooperativeName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  busNumber: {
    fontSize: 14,
  },
  busImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  busImage: {
    width: '100%',
    height: '100%',
    backgroundColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  busInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  busInfoCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  busInfoCardFull: {
    width: '100%',
    marginBottom: 0,
  },
  busInfoLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  busInfoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  tripDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  tripDetailRowLast: {
    borderBottomWidth: 0,
  },
  tripDetailLabel: {
    fontSize: 14,
    flex: 1,
  },
  tripDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  selectSeatsButton: {
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  selectSeatsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

