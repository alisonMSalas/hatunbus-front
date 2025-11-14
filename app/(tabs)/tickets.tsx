import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getJsonWithAuth } from '@/services/api';
import { API_BASE_URL } from '@/constants/api';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';

interface Trip {
  id: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  status: 'upcoming' | 'past';
  seat: string;
  passenger: string;
  cooperative: string;
  bus: string;
  ticketId: string;
}

export default function TicketsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    if (!user?.id) {
      setLoading(false);
      // Redirect to login if not authenticated
      router.replace('/login');
      return;
    }
    
    loadPurchases();
  }, [user, authLoading]);

  const loadPurchases = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const purchases = await getJsonWithAuth(`${API_BASE_URL}/compras/usuario/${user.id}`);
      
      const now = new Date();
      const upcoming: Trip[] = [];
      
      if (!purchases || purchases.length === 0) {
        setUpcomingTrips([]);
        setLoading(false);
        return;
      }
      
      purchases.forEach((purchase: any) => {
        if (purchase.tickets && purchase.tickets.length > 0) {
          purchase.tickets.forEach((ticket: any) => {
            const tripDate = new Date(ticket.trip?.scheduledDepartureTime || ticket.trip?.date);
            const isUpcoming = tripDate >= now;
            
            // Only process upcoming trips
            if (isUpcoming) {
              const trip: Trip = {
                id: purchase.id,
                ticketId: ticket.id,
                origin: ticket.originStopName || ticket.trip?.routeOrigin || 'Origen',
                destination: ticket.destinationStopName || ticket.trip?.routeDestination || 'Destino',
                date: formatDate(tripDate),
                time: formatTime(ticket.trip?.scheduledDepartureTime),
                status: 'upcoming',
                seat: ticket.seatNumber || '--',
                passenger: ticket.passengerName || user.firstName || 'Pasajero',
                cooperative: ticket.trip?.frequency?.cooperative?.name || 'Cooperativa',
                bus: ticket.trip?.busPlate || 'Bus',
              };
              upcoming.push(trip);
            }
          });
        }
      });
      
      setUpcomingTrips(upcoming);
    } catch (error: any) {
      // No mostrar alert si simplemente no hay compras
      if (error?.response?.status !== 404) {
        alert('Error al cargar tus viajes: ' + (error?.message || 'Error desconocido'));
      } else {
        // 404 significa que no hay compras, es normal
        setUpcomingTrips([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const formatTime = (datetime: string) => {
    if (!datetime) return '--:--';
    const date = new Date(datetime);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handleQRCode = (trip: Trip) => {
    router.push({
      pathname: '/ticket-detail',
      params: {
        origin: trip.origin,
        destination: trip.destination,
        seat: trip.seat,
        date: trip.date,
        time: trip.time,
        passenger: trip.passenger,
        cooperative: trip.cooperative,
        bus: trip.bus,
        ticketId: trip.ticketId,
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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.blackSoft} />
          <ThemedText style={styles.loadingText}>Cargando tus viajes...</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Upcoming Section */}
          <View style={styles.section}>
            {upcomingTrips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={48} color={EarthColors.earthDark} />
                <ThemedText style={styles.emptyText}>No tienes viajes próximos</ThemedText>
              </View>
            ) : (
              upcomingTrips.map((trip) => renderTripCard(trip))
            )}
          </View>
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: EarthColors.earthDark,
    textAlign: 'center',
  },
});
