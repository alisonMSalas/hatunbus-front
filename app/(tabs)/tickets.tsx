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
  tripId: string;
  scheduledDepartureTime: string;
}

interface GroupedTrip {
  tripId: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  cooperative: string;
  bus: string;
  scheduledDepartureTime: string;
  tickets: Trip[];
}

export default function TicketsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [groupedTrips, setGroupedTrips] = useState<GroupedTrip[]>([]);
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
        setGroupedTrips([]);
        setLoading(false);
        return;
      }

      purchases.forEach((purchase: any) => {
        if (purchase.tickets && purchase.tickets.length > 0) {
          purchase.tickets.forEach((ticket: any) => {
            // Solo mostrar tickets PAGADOS y NO USADOS (activos)
            // - Debe estar PAID
            // - NO debe tener usageDate (no ha sido escaneado)
            if (ticket.status !== 'PAID' || ticket.usageDate != null) {
              return; // Saltar tickets que no están pagados o ya fueron usados
            }

            const tripDate = new Date(ticket.scheduledDepartureTime || ticket.trip?.scheduledDepartureTime || ticket.trip?.date);
            const isUpcoming = tripDate >= now;

            // Only process upcoming trips (viajes que aún no han pasado)
            if (isUpcoming) {
              const trip: Trip = {
                id: purchase.id,
                ticketId: ticket.id,
                tripId: ticket.tripId || ticket.id,
                origin: ticket.originStopName || ticket.routeOrigin || 'Origen',
                destination: ticket.destinationStopName || ticket.routeDestination || 'Destino',
                date: formatDate(tripDate),
                time: formatTime(ticket.scheduledDepartureTime),
                scheduledDepartureTime: ticket.scheduledDepartureTime,
                status: 'upcoming',
                seat: ticket.seatNumber || '--',
                passenger: ticket.passengerName || user.firstName || 'Pasajero',
                cooperative: ticket.cooperativeName || 'Cooperativa',
                bus: ticket.busPlate || 'Bus',
              };
              upcoming.push(trip);
            }
          });
        }
      });

      // Agrupar tickets por viaje (tripId + scheduledDepartureTime)
      const grouped = groupTicketsByTrip(upcoming);
      setGroupedTrips(grouped);
    } catch (error: any) {
      // No mostrar alert si simplemente no hay compras
      if (error?.response?.status !== 404) {
        alert('Error al cargar tus viajes: ' + (error?.message || 'Error desconocido'));
      } else {
        // 404 significa que no hay compras, es normal
        setGroupedTrips([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const groupTicketsByTrip = (trips: Trip[]): GroupedTrip[] => {
    const grouped = new Map<string, GroupedTrip>();

    trips.forEach((trip) => {
      // Crear una clave única usando: origen + destino + fecha/hora + bus + cooperativa
      // Si CUALQUIERA de estos cambia, es un grupo diferente
      const key = `${trip.origin}|${trip.destination}|${trip.scheduledDepartureTime}|${trip.bus}|${trip.cooperative}`;

      if (grouped.has(key)) {
        // Ya existe este viaje exacto, agregar el ticket
        grouped.get(key)!.tickets.push(trip);
      } else {
        // Nuevo viaje, crear grupo
        grouped.set(key, {
          tripId: trip.tripId,
          origin: trip.origin,
          destination: trip.destination,
          date: trip.date,
          time: trip.time,
          cooperative: trip.cooperative,
          bus: trip.bus,
          scheduledDepartureTime: trip.scheduledDepartureTime,
          tickets: [trip],
        });
      }
    });

    // Convertir Map a array y ordenar por fecha
    return Array.from(grouped.values()).sort((a, b) => {
      return new Date(a.scheduledDepartureTime).getTime() - new Date(b.scheduledDepartureTime).getTime();
    });
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

  const handleViewTicket = (ticket: Trip) => {
    router.push({
      pathname: '/ticket-detail',
      params: {
        origin: ticket.origin,
        destination: ticket.destination,
        seat: ticket.seat,
        date: ticket.date,
        time: ticket.time,
        passenger: ticket.passenger,
        cooperative: ticket.cooperative,
        bus: ticket.bus,
        ticketId: ticket.ticketId,
      },
    });
  };

  const renderGroupedTrip = (groupedTrip: GroupedTrip) => {
    const ticketCount = groupedTrip.tickets.length;

    return (
      <View key={groupedTrip.tripId + groupedTrip.scheduledDepartureTime} style={styles.tripGroupCard}>
        {/* Header del viaje */}
        <View style={styles.tripHeader}>
          <View style={styles.tripHeaderLeft}>
            <View style={[styles.busIconContainer, { backgroundColor: EarthColors.beigeLight }]}>
              <MaterialIcons name="directions-bus" size={28} color={EarthColors.earthPrimary} />
            </View>
            <View style={styles.tripHeaderInfo}>
              <ThemedText
                lightColor={EarthColors.earthDarker}
                darkColor={EarthColors.beigeLight}
                style={styles.tripRoute}>
                {groupedTrip.origin} → {groupedTrip.destination}
              </ThemedText>
              <View style={styles.tripMetadata}>
                <MaterialIcons name="schedule" size={14} color={EarthColors.earthDark} />
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.tripMetaText}>
                  {groupedTrip.date} • {groupedTrip.time}
                </ThemedText>
              </View>
              <View style={styles.tripMetadata}>
                <MaterialIcons name="business" size={14} color={EarthColors.earthDark} />
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.tripMetaText}>
                  {groupedTrip.cooperative}
                </ThemedText>
              </View>
              <View style={styles.tripMetadata}>
                <MaterialIcons name="airport-shuttle" size={14} color={EarthColors.earthDark} />
                <ThemedText
                  lightColor={EarthColors.earthDark}
                  darkColor={EarthColors.grayEarth}
                  style={styles.tripMetaText}>
                  {groupedTrip.bus}
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.ticketCountBadge}>
            <ThemedText style={styles.ticketCountText}>{ticketCount}</ThemedText>
            <ThemedText style={styles.ticketCountLabel}>
              {ticketCount === 1 ? 'Ticket' : 'Tickets'}
            </ThemedText>
          </View>
        </View>

        {/* Lista de tickets */}
        <View style={styles.ticketsList}>
          {groupedTrip.tickets.map((ticket, index) => (
            <View key={ticket.ticketId} style={styles.ticketItem}>
              <View style={styles.ticketItemLeft}>
                <View style={styles.seatBadge}>
                  <MaterialIcons name="airline-seat-recline-normal" size={16} color={EarthColors.earthPrimary} />
                  <ThemedText style={styles.seatNumber}>{ticket.seat}</ThemedText>
                </View>
                <ThemedText
                  lightColor={EarthColors.earthDarker}
                  darkColor={EarthColors.beigeLight}
                  style={styles.passengerName}>
                  {ticket.passenger}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.viewQRButton}
                onPress={() => handleViewTicket(ticket)}
                activeOpacity={0.7}>
                <MaterialIcons name="qr-code-2" size={20} color={EarthColors.whiteBone} />
                <ThemedText style={styles.viewQRText}>Ver QR</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
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

          {/* Grouped Trips Section */}
          <View style={styles.section}>
            {groupedTrips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={48} color={EarthColors.earthDark} />
                <ThemedText style={styles.emptyText}>No tienes viajes próximos</ThemedText>
              </View>
            ) : (
              groupedTrips.map((groupedTrip) => renderGroupedTrip(groupedTrip))
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
  // Grouped Trip Card
  tripGroupCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  // Trip Header
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeLight,
  },
  tripHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  busIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHeaderInfo: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  tripMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  tripMetaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  ticketCountBadge: {
    backgroundColor: EarthColors.earthPrimary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  ticketCountText: {
    fontSize: 20,
    fontWeight: '700',
    color: EarthColors.whiteBone,
  },
  ticketCountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: EarthColors.whiteBone,
    marginTop: 2,
  },
  // Tickets List
  ticketsList: {
    gap: 8,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: EarthColors.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: EarthColors.earthPrimary,
  },
  ticketItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: EarthColors.earthPrimary,
  },
  seatNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: EarthColors.earthPrimary,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  viewQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  viewQRText: {
    fontSize: 13,
    fontWeight: '600',
    color: EarthColors.whiteBone,
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
