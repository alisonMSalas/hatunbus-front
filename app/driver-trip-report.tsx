import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { getJsonWithAuth } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';

type PassengerReport = {
  seatNumber?: string;
  passengerName?: string;
  passengerIdCard?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  passengerType?: string;
  status?: string;
  originStop?: string;
  destinationStop?: string;
};

type TripReport = {
  tripId: string;
  routeName?: string;
  routeOrigin?: string;
  routeDestination?: string;
  driverName?: string;
  driverPhone?: string;
  busPlate?: string;
  busUnitNumber?: number;
  cooperativeName?: string;
  cooperativeLogo?: string;
  scheduledDepartureTime?: string;
  scheduledArrivalTime?: string;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  totalRevenue: number;
  occupancyRate: number;
  passengers: PassengerReport[];
};

export default function DriverTripReportScreen() {
  const params = useLocalSearchParams();
  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
  const [report, setReport] = useState<TripReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tripId) {
      loadReport(tripId);
    }
  }, [tripId]);

  const loadReport = async (id: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getJsonWithAuth<TripReport>(`${API_BASE_URL}/reportes/viaje/${id}`);
      if (!data.passengers) {
        data.passengers = [];
      }
      setReport(data);
    } catch (error: any) {
      setReport(null);
      setErrorMessage('No se pudo cargar la información del viaje.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatTime = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ThemedView style={styles.container}>
      <Header title="Reporte de Pasajeros" />
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={EarthColors.blackSoft} />
          <ThemedText style={styles.loadingText}>Cargando reporte...</ThemedText>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContent}>
          <MaterialIcons name="error-outline" size={48} color={EarthColors.earthDark} />
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        </View>
      ) : report ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View>
                <ThemedText style={styles.routeTitle}>{report.routeName}</ThemedText>
                <ThemedText style={styles.routeSubtitle}>
                  {report.routeOrigin} → {report.routeDestination}
                </ThemedText>
                <ThemedText style={styles.dateText}>
                  {formatDate(report.scheduledDepartureTime)} · {formatTime(report.scheduledDepartureTime)}
                </ThemedText>
              </View>
              {report.cooperativeLogo ? (
                <Image source={{ uri: report.cooperativeLogo }} style={styles.logo} resizeMode="contain" />
              ) : null}
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Conductor</ThemedText>
                <ThemedText style={styles.summaryValue}>{report.driverName || 'No asignado'}</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Bus</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {report.busPlate} {report.busUnitNumber ? `(Unidad ${report.busUnitNumber})` : ''}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Ocupación</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {report.occupiedSeats}/{report.totalSeats} ({report.occupancyRate}%)
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Ingresos</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  ${report.totalRevenue?.toFixed(2) ?? '0.00'}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.passengerHeader}>
              <ThemedText style={styles.passengerTitle}>
                Pasajeros ({report.passengers.length})
              </ThemedText>
            </View>
            {report.passengers.map((passenger, index) => (
              <View key={`${passenger.seatNumber}-${index}`} style={styles.passengerCard}>
                <View style={styles.passengerSeat}>
                  <MaterialIcons name="airline-seat-recline-normal" size={20} color={EarthColors.whiteBone} />
                  <ThemedText style={styles.passengerSeatText}>{passenger.seatNumber || '--'}</ThemedText>
                </View>
                <View style={styles.passengerInfo}>
                  <ThemedText style={styles.passengerName}>{passenger.passengerName}</ThemedText>
                  <ThemedText style={styles.passengerDocument}>
                    Cédula: {passenger.passengerIdCard || 'N/A'}
                  </ThemedText>
                  <ThemedText style={styles.passengerDetails}>
                    {passenger.originStop || report.routeOrigin} → {passenger.destinationStop || report.routeDestination}
                  </ThemedText>
                  <ThemedText style={styles.passengerDetails}>
                    Tipo: {passenger.passengerType || 'ADULT'}
                  </ThemedText>
                  {passenger.passengerPhone ? (
                    <ThemedText style={styles.passengerDetails}>
                      Tel: {passenger.passengerPhone}
                    </ThemedText>
                  ) : null}
                </View>
                <View style={styles.statusPill}>
                  <ThemedText style={styles.statusText}>{passenger.status}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EarthColors.grayLight,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: EarthColors.earthDarker,
  },
  routeSubtitle: {
    fontSize: 16,
    color: EarthColors.earthDark,
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: EarthColors.grayEarth,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  summaryGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: EarthColors.beigeLight + '40',
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: {
    textTransform: 'uppercase',
    fontSize: 11,
    color: EarthColors.grayEarth,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: EarthColors.earthDarker,
    marginTop: 4,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  passengerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.beigeLight + '40',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  passengerSeat: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: EarthColors.blackSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  passengerSeatText: {
    color: EarthColors.beigeBone,
    fontWeight: '700',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  passengerDocument: {
    fontSize: 13,
    color: EarthColors.grayEarth,
    marginTop: 2,
  },
  passengerDetails: {
    fontSize: 13,
    color: EarthColors.earthDark,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: EarthColors.earthPrimary + '30',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: EarthColors.earthDark,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: EarthColors.earthDark,
  },
  errorText: {
    color: EarthColors.earthDark,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
