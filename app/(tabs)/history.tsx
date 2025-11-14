import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import { router, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getJsonWithAuth } from '@/services/api';
import { API_BASE_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';

interface PurchaseHistory {
  id: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  cooperative: string;
  price: string;
  seat: string;
  passenger: string;
  bus: string;
  ticketId: string;
}

export default function HistoryScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [pastTrips, setPastTrips] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    if (!user?.id) {
      setLoading(false);
      router.replace('/login');
      return;
    }
    
    loadPastPurchases();
  }, [user, authLoading]);

  const loadPastPurchases = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const purchases = await getJsonWithAuth(`${API_BASE_URL}/compras/usuario/${user.id}`);
      
      const now = new Date();
      const past: PurchaseHistory[] = [];
      
      if (!purchases || purchases.length === 0) {
        setPastTrips([]);
        setLoading(false);
        return;
      }
      
      purchases.forEach((purchase: any) => {
        if (purchase.tickets && purchase.tickets.length > 0) {
          purchase.tickets.forEach((ticket: any) => {
            const tripDate = new Date(ticket.trip?.scheduledDepartureTime || ticket.trip?.date);
            const isPast = tripDate < now;
            
            // Only process past trips
            if (isPast) {
              const trip: PurchaseHistory = {
                id: purchase.id,
                ticketId: ticket.id,
                origin: ticket.originStopName || ticket.trip?.routeOrigin || 'Origen',
                destination: ticket.destinationStopName || ticket.trip?.routeDestination || 'Destino',
                date: formatDate(tripDate),
                time: formatTime(ticket.trip?.scheduledDepartureTime),
                cooperative: ticket.trip?.frequency?.cooperative?.name || 'Cooperativa',
                price: `$${ticket.finalPrice || '0.00'}`,
                seat: ticket.seatNumber || '--',
                passenger: ticket.passengerName || user.firstName || 'Pasajero',
                bus: ticket.trip?.busPlate || 'Bus',
              };
              past.push(trip);
            }
          });
        }
      });
      
      setPastTrips(past);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        alert('Error al cargar el historial: ' + (error?.message || 'Error desconocido'));
      } else {
        setPastTrips([]);
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

  const handleViewTicket = (purchase: PurchaseHistory) => {
    router.push({
      pathname: '/ticket-detail',
      params: {
        origin: purchase.origin,
        destination: purchase.destination,
        seat: purchase.seat,
        date: purchase.date,
        time: purchase.time,
        passenger: purchase.passenger,
        cooperative: purchase.cooperative,
        bus: purchase.bus,
        ticketId: purchase.ticketId,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Historial de Compras" showBackButton={false} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.blackSoft} />
          <ThemedText style={styles.loadingText}>Cargando historial...</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {pastTrips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={64} color={EarthColors.earthDark} />
              <ThemedText style={styles.emptyText}>No tienes viajes en el historial</ThemedText>
            </View>
          ) : (
            pastTrips.map((purchase) => (
          <View key={purchase.id} style={styles.purchaseCard}>
            <View style={styles.purchaseCardLeft}>
              <View style={[styles.busIconContainer, { backgroundColor: EarthColors.whiteBone }]}>
                <MaterialIcons name="directions-bus" size={24} color={EarthColors.grayMedium} />
              </View>
              <View style={styles.purchaseInfo}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.routeText}>
                  {purchase.origin} a {purchase.destination}
                </ThemedText>
                <ThemedText 
                  lightColor={EarthColors.earthDark} 
                  darkColor={EarthColors.grayEarth} 
                  style={styles.dateText}>
                  {purchase.date} - {purchase.time}
                </ThemedText>
                <ThemedText 
                  lightColor={EarthColors.earthDark} 
                  darkColor={EarthColors.grayEarth} 
                  style={styles.cooperativeText}>
                  {purchase.cooperative}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.priceSection}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.priceText}>
                {purchase.price}
              </ThemedText>
              <TouchableOpacity
                onPress={() => handleViewTicket(purchase)}
                activeOpacity={0.7}
                style={styles.viewButton}>
                <ThemedText 
                  lightColor={EarthColors.bluePrimary} 
                  darkColor={EarthColors.blueLight} 
                  style={styles.viewTicketText}>
                  Ver
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))
          )}
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
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: EarthColors.earthDark,
    textAlign: 'center',
  },
  purchaseCard: {
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
  purchaseCardLeft: {
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
  purchaseInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    marginBottom: 2,
  },
  cooperativeText: {
    fontSize: 13,
  },
  priceSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  viewButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewTicketText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
