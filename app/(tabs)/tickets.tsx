import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
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

interface Trip {
  id: string;
  origin: string;
  destination: string;
  time: string;
  status: 'upcoming' | 'past';
}

export default function TicketsScreen() {
  // Datos de ejemplo - en el futuro vendrán de la API
  const upcomingTrips: Trip[] = [
    {
      id: '1',
      origin: 'Lima',
      destination: 'Cusco',
      time: '10:00 AM',
      status: 'upcoming',
    },
    {
      id: '2',
      origin: 'Arequipa',
      destination: 'Puno',
      time: '11:30 AM',
      status: 'upcoming',
    },
  ];

  const pastTrips: Trip[] = [
    {
      id: '3',
      origin: 'Cusco',
      destination: 'Machu Picchu',
      time: '08:00 AM',
      status: 'past',
    },
    {
      id: '4',
      origin: 'Puno',
      destination: 'Lake Titicaca',
      time: '09:00 AM',
      status: 'past',
    },
  ];

  const handleQRCode = (trip: Trip) => {
    // Navegar a la pantalla de detalle del ticket con QR
    router.push({
      pathname: '/ticket-detail',
      params: {
        origin: trip.origin,
        destination: trip.destination,
        seat: 'A12', // En el futuro vendrá de los datos del ticket
        date: '2024-03-15', // En el futuro vendrá de los datos del ticket
        time: trip.time,
        passenger: 'Isabella Rodriguez', // En el futuro vendrá de los datos del ticket
        cooperative: 'Trans Andes', // En el futuro vendrá de los datos del ticket
        bus: 'Bus #456', // En el futuro vendrá de los datos del ticket
        ticketId: trip.id,
      },
    });
  };

  const renderTripCard = (trip: Trip) => {
    const isUpcoming = trip.status === 'upcoming';
    const iconColor = isUpcoming ? EarthColors.earthPrimary : EarthColors.grayMedium;

    return (
      <View key={trip.id} style={styles.tripCard}>
        <View style={styles.tripCardLeft}>
          <View style={[styles.busIconContainer, { backgroundColor: EarthColors.whiteBone }]}>
            <MaterialIcons name="directions-bus" size={24} color={iconColor} />
          </View>
          <View style={styles.tripInfo}>
            <ThemedText 
              lightColor={EarthColors.earthDarker} 
              darkColor={EarthColors.beigeLight} 
              style={styles.tripRoute}>
              {trip.origin} a {trip.destination}
            </ThemedText>
            <ThemedText 
              lightColor={EarthColors.earthDark} 
              darkColor={EarthColors.grayEarth} 
              style={styles.tripTime}>
              {trip.time}
            </ThemedText>
          </View>
        </View>
        {isUpcoming && (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => handleQRCode(trip)}
            activeOpacity={0.7}>
            <MaterialIcons name="qr-code" size={20} color={EarthColors.beigeBone} />
            <ThemedText 
              lightColor={EarthColors.beigeBone} 
              darkColor={EarthColors.beigeBone} 
              style={styles.qrButtonText}>
              QR
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Mis Viajes" showBackButton={false} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Upcoming Section */}
        <View style={styles.section}>
          <ThemedText 
            lightColor={EarthColors.earthDarker} 
            darkColor={EarthColors.beigeLight} 
            style={styles.sectionTitle}>
            Próximos
          </ThemedText>
          
          {upcomingTrips.map((trip) => renderTripCard(trip))}
        </View>

        {/* Past Section */}
        <View style={styles.section}>
          <ThemedText 
            lightColor={EarthColors.earthDarker} 
            darkColor={EarthColors.beigeLight} 
            style={styles.sectionTitle}>
            Pasados
          </ThemedText>
          
          {pastTrips.map((trip) => renderTripCard(trip))}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 16,
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
  tripCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tripInfo: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tripTime: {
    fontSize: 14,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: EarthColors.beigeBone,
  },
});
