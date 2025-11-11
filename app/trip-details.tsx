import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TripDetailsScreen() {
  const params = useLocalSearchParams();

  // Datos del viaje - en el futuro vendrán de la API
  const tripData = {
    cooperative: Array.isArray(params.operator) ? params.operator[0] : params.operator || 'HatunBus',
    busNumber: 'Bus #123',
    licensePlate: 'ABC-456',
    chassis: 'XYZ789',
    bodyType: Array.isArray(params.seatType) ? params.seatType[0] : params.seatType || 'Double Decker',
    departureTime: Array.isArray(params.departureTime) ? params.departureTime[0] : params.departureTime || '10:00 AM',
    arrivalTime: Array.isArray(params.arrivalTime) ? params.arrivalTime[0] : params.arrivalTime || '6:00 PM',
    amenities: 'WiFi, Asientos Reclinables, Baño',
    busImage: require('@/assets/images/bus-placeholder.jpg'), // Placeholder - reemplazar con imagen real del bus
  };

  const handleSelectSeats = () => {
    // Obtener el número de pasajeros desde los parámetros de búsqueda originales
    const passengers = Array.isArray(params.passengers) 
      ? params.passengers[0] 
      : params.passengers || '1';
    
    // Navegar a la pantalla de información de pasajeros
    router.push({
      pathname: '/passenger-details',
      params: {
        passengers: passengers,
        tripId: Array.isArray(params.tripId) ? params.tripId[0] : params.tripId,
        operator: Array.isArray(params.operator) ? params.operator[0] : params.operator,
        seatType: Array.isArray(params.seatType) ? params.seatType[0] : params.seatType,
        price: Array.isArray(params.price) ? params.price[0] : params.price,
        departureTime: Array.isArray(params.departureTime) ? params.departureTime[0] : params.departureTime,
        arrivalTime: Array.isArray(params.arrivalTime) ? params.arrivalTime[0] : params.arrivalTime,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
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
                  {tripData.busNumber}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Bus Image */}
        <View style={styles.busImageContainer}>
          <Image
            source={tripData.busImage}
            style={styles.busImage}
            resizeMode="cover"
          />
        </View>

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
                {tripData.licensePlate}
              </ThemedText>
            </View>
            <View style={styles.busInfoCard}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.busInfoLabel}>
                Chasis
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.busInfoValue}>
                {tripData.chassis}
              </ThemedText>
            </View>
            <View style={[styles.busInfoCard, styles.busInfoCardFull]}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.busInfoLabel}>
                Tipo de Carrocería
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.busInfoValue}>
                {tripData.bodyType}
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
            <View style={[styles.tripDetailRow, styles.tripDetailRowLast]}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.grayEarth} style={styles.tripDetailLabel}>
                Amenidades
              </ThemedText>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.tripDetailValue}>
                {tripData.amenities}
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

