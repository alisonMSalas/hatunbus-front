import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import { router, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
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

interface HistoryTicket {
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
  scheduledDepartureTime: string;
  status: 'COMPLETED' | 'MISSED'; // Completado o Perdido
  usageDate?: string; // Fecha en que fue escaneado
  validatingDriver?: string; // Conductor que validó
}

interface GroupedHistoryTrip {
  tripId: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  cooperative: string;
  bus: string;
  scheduledDepartureTime: string;
  tickets: HistoryTicket[];
  // Estadísticas del grupo
  completedCount: number;
  missedCount: number;
}

export default function HistoryScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [groupedTrips, setGroupedTrips] = useState<GroupedHistoryTrip[]>([]);
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

  // Recargar datos cuando la pestaña recibe foco
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !authLoading) {
        loadPastPurchases();
      }
    }, [user, authLoading])
  );

  const loadPastPurchases = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const purchases = await getJsonWithAuth(`${API_BASE_URL}/compras/usuario/${user.id}`);

      const now = new Date();
      const past: HistoryTicket[] = [];

      if (!purchases || purchases.length === 0) {
        setGroupedTrips([]);
        setLoading(false);
        return;
      }

      purchases.forEach((purchase: any) => {
        if (purchase.tickets && purchase.tickets.length > 0) {
          purchase.tickets.forEach((ticket: any) => {
            const tripDate = new Date(ticket.scheduledDepartureTime || ticket.trip?.scheduledDepartureTime || ticket.trip?.date);

            // NUEVA LÓGICA:
            // Mostrar en historial si:
            // 1. El viaje está COMPLETED (conductor finalizó el viaje)
            // 2. O si el viaje está CANCELED
            // 3. O si es un viaje antiguo que ya pasó
            
            const tripIsCompleted = ticket.tripStatus === 'COMPLETED';
            const tripIsCanceled = ticket.tripStatus === 'CANCELED';
            const isPast = tripDate < now;
            
            const shouldShowInHistory = tripIsCompleted || tripIsCanceled || isPast;

            if (shouldShowInHistory) {
              // Determinar el estado del ticket:
              // - COMPLETED: Si fue escaneado (USED)
              // - MISSED: Si NO fue escaneado (PAID) y el viaje terminó/pasó
              const ticketStatus: 'COMPLETED' | 'MISSED' = ticket.status === 'USED' ? 'COMPLETED' : 'MISSED';

              const trip: HistoryTicket = {
                id: purchase.id,
                ticketId: ticket.id,
                origin: ticket.originStopName || ticket.routeOrigin || 'Origen',
                destination: ticket.destinationStopName || ticket.routeDestination || 'Destino',
                date: formatDate(tripDate),
                time: formatTime(ticket.scheduledDepartureTime),
                cooperative: ticket.cooperativeName || 'Cooperativa',
                price: `$${ticket.finalPrice || '0.00'}`,
                seat: ticket.seatNumber || '--',
                passenger: ticket.passengerName || user.firstName || 'Pasajero',
                bus: ticket.busPlate || 'Bus',
                scheduledDepartureTime: ticket.scheduledDepartureTime,
                status: ticketStatus,
                usageDate: ticket.usageDate,
                validatingDriver: ticket.validatingDriver,
              };
              past.push(trip);
            }
          });
        }
      });

      // Agrupar tickets por viaje (misma lógica que tickets.tsx)
      const grouped = groupTicketsByTrip(past);
      setGroupedTrips(grouped);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        alert('Error al cargar el historial: ' + (error?.message || 'Error desconocido'));
      } else {
        setGroupedTrips([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const groupTicketsByTrip = (tickets: HistoryTicket[]): GroupedHistoryTrip[] => {
    const grouped = new Map<string, GroupedHistoryTrip>();

    tickets.forEach((ticket) => {
      // Crear una clave única usando: origen + destino + fecha/hora + bus + cooperativa
      // Si CUALQUIERA de estos cambia, es un grupo diferente
      const key = `${ticket.origin}|${ticket.destination}|${ticket.scheduledDepartureTime}|${ticket.bus}|${ticket.cooperative}`;

      if (grouped.has(key)) {
        // Ya existe este viaje exacto, agregar el ticket
        const group = grouped.get(key)!;
        group.tickets.push(ticket);
        // Actualizar contadores
        if (ticket.status === 'COMPLETED') {
          group.completedCount++;
        } else {
          group.missedCount++;
        }
      } else {
        // Nuevo viaje, crear grupo
        grouped.set(key, {
          tripId: ticket.ticketId, // Usar el primer ticketId como referencia
          origin: ticket.origin,
          destination: ticket.destination,
          date: ticket.date,
          time: ticket.time,
          cooperative: ticket.cooperative,
          bus: ticket.bus,
          scheduledDepartureTime: ticket.scheduledDepartureTime,
          tickets: [ticket],
          completedCount: ticket.status === 'COMPLETED' ? 1 : 0,
          missedCount: ticket.status === 'MISSED' ? 1 : 0,
        });
      }
    });

    // Convertir Map a array y ordenar por fecha descendente (más recientes primero)
    return Array.from(grouped.values()).sort((a, b) => {
      return new Date(b.scheduledDepartureTime).getTime() - new Date(a.scheduledDepartureTime).getTime();
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

  const handleViewTicket = (ticket: HistoryTicket) => {
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
        isHistory: 'true',
        status: ticket.status,
        usageDate: ticket.usageDate || '',
        validatingDriver: ticket.validatingDriver || '',
      },
    });
  };

  const formatUsageDate = (usageDate?: string) => {
    if (!usageDate) return '';
    const date = new Date(usageDate);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderGroupedTrip = (groupedTrip: GroupedHistoryTrip) => {
    const ticketCount = groupedTrip.tickets.length;
    const hasCompleted = groupedTrip.completedCount > 0;
    const hasMissed = groupedTrip.missedCount > 0;

    // Determinar el estado predominante del grupo
    const groupStatus = groupedTrip.completedCount >= groupedTrip.missedCount ? 'COMPLETED' : 'MISSED';

    return (
      <View key={groupedTrip.tripId + groupedTrip.scheduledDepartureTime} style={styles.tripGroupCard}>
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          groupStatus === 'COMPLETED' ? styles.statusCompleted : styles.statusMissed
        ]}>
          <MaterialIcons
            name={groupStatus === 'COMPLETED' ? 'check-circle' : 'cancel'}
            size={16}
            color={EarthColors.whiteBone}
          />
          <ThemedText style={styles.statusText}>
            {groupStatus === 'COMPLETED' ? 'Viaje Completado' : 'Viaje Perdido'}
          </ThemedText>
          {hasCompleted && hasMissed && (
            <ThemedText style={styles.statusSubtext}>
              ({groupedTrip.completedCount} usados, {groupedTrip.missedCount} perdidos)
            </ThemedText>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          {/* Header del viaje */}
          <View style={styles.tripHeader}>
            <View style={styles.tripHeaderLeft}>
              <View style={[
                styles.busIconContainer,
                groupStatus === 'COMPLETED'
                  ? { backgroundColor: '#E8F5E9' }
                  : { backgroundColor: '#FFF3E0' }
              ]}>
                <MaterialIcons
                  name="directions-bus"
                  size={28}
                  color={groupStatus === 'COMPLETED' ? '#4CAF50' : '#FF9800'}
                />
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
            {groupedTrip.tickets.map((ticket) => (
              <View key={ticket.ticketId} style={styles.ticketItem}>
                {/* Status indicator */}
                <View style={[
                  styles.ticketStatusIndicator,
                  ticket.status === 'COMPLETED' ? styles.ticketStatusCompleted : styles.ticketStatusMissed
                ]} />

                <View style={styles.ticketItemLeft}>
                  <View style={styles.seatBadge}>
                    <MaterialIcons name="airline-seat-recline-normal" size={16} color={EarthColors.earthPrimary} />
                    <ThemedText style={styles.seatNumber}>{ticket.seat}</ThemedText>
                  </View>
                  <View style={styles.ticketPassengerInfo}>
                    <ThemedText
                      lightColor={EarthColors.earthDarker}
                      darkColor={EarthColors.beigeLight}
                      style={styles.passengerName}>
                      {ticket.passenger}
                    </ThemedText>
                    {ticket.status === 'COMPLETED' && ticket.usageDate && (
                      <View style={styles.usageBadge}>
                        <MaterialIcons name="check-circle" size={12} color="#4CAF50" />
                        <ThemedText style={styles.usageText}>
                          Usado: {formatUsageDate(ticket.usageDate)}
                        </ThemedText>
                      </View>
                    )}
                    {ticket.status === 'MISSED' && (
                      <View style={styles.usageBadge}>
                        <MaterialIcons name="cancel" size={12} color="#FF9800" />
                        <ThemedText style={styles.missedText}>No validado</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => handleViewTicket(ticket)}
                  activeOpacity={0.7}>
                  <ThemedText style={styles.viewDetailsText}>Ver</ThemedText>
                  <MaterialIcons name="arrow-forward" size={16} color={EarthColors.earthPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
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
          
          {groupedTrips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={64} color={EarthColors.earthDark} />
              <ThemedText style={styles.emptyText}>No tienes viajes en el historial</ThemedText>
            </View>
          ) : (
            groupedTrips.map((groupedTrip) => renderGroupedTrip(groupedTrip))
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
  // Grouped Trip Card
  tripGroupCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusMissed: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: EarthColors.whiteBone,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusSubtext: {
    color: EarthColors.whiteBone,
    fontSize: 11,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
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
    backgroundColor: EarthColors.blackSoft,
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
    gap: 10,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: EarthColors.beigeLight,
    borderRadius: 12,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  ticketStatusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  ticketStatusCompleted: {
    backgroundColor: '#4CAF50',
  },
  ticketStatusMissed: {
    backgroundColor: '#FF9800',
  },
  ticketItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginLeft: 8,
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
  ticketPassengerInfo: {
    flex: 1,
    gap: 4,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  usageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usageText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '500',
  },
  missedText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: EarthColors.earthPrimary,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: EarthColors.earthPrimary,
  },
});
