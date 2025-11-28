import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { getJsonWithAuth } from '@/services/api';
import { SeatAvailabilityDto } from '@/types/trip';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface PassengerSeat {
  passengerIndex: number;
  passengerName: string;
  seatNumber: string | null; // V1, P1, V2, P2, etc.
}

interface PassengerInfo {
  fullName: string;
  identificationType: string;
  identificationNumber: string;
  email: string;
  phone: string;
  passengerType: 'ADULT' | 'CHILD' | 'SENIOR' | 'DISABLED';
}

type SeatStatus = 'available' | 'unavailable' | 'selected' | 'others';

interface SeatVisual {
  number: string;
  status: SeatStatus;
  passengerInitials?: string;
}

export default function SelectSeatsScreen() {
  const params = useLocalSearchParams();

  // Obtener el número de pasajeros desde los parámetros
  const passengersCount = parseInt(
    Array.isArray(params.passengers) ? params.passengers[0] : params.passengers || '1'
  );

  // Parsear datos de pasajeros
  const passengersData: PassengerInfo[] = params.passengersData
    ? JSON.parse(Array.isArray(params.passengersData) ? params.passengersData[0] : params.passengersData)
    : [];

  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
  const busSeatsCount = parseInt(
    Array.isArray(params.busSeatsCount) ? params.busSeatsCount[0] : params.busSeatsCount || '0'
  );

  // Estados
  const [loading, setLoading] = useState(true);
  const [seatLayout, setSeatLayout] = useState<SeatAvailabilityDto[]>([]);
  const [seatMatrix, setSeatMatrix] = useState<(SeatAvailabilityDto | null)[][]>([]);
  const [passengerSeats, setPassengerSeats] = useState<PassengerSeat[]>([]);
  const [activePassengerIndex, setActivePassengerIndex] = useState<number>(0);

  // Función para obtener iniciales de un nombre
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const buildSeatMatrix = (layout: SeatAvailabilityDto[]) => {
    if (!layout.length) return [];
    const maxRow = layout.reduce((max, seat) => Math.max(max, seat.row || 0), 0);
    const maxCol = layout.reduce((max, seat) => Math.max(max, seat.column || 0), 0);
    const map = new Map<string, SeatAvailabilityDto>();
    layout.forEach(seat => {
      if (seat.row && seat.column) {
        map.set(`${seat.row}-${seat.column}`, seat);
      }
    });
    const matrix: (SeatAvailabilityDto | null)[][] = [];
    for (let row = 1; row <= maxRow; row++) {
      const rowCells: (SeatAvailabilityDto | null)[] = [];
      for (let col = 1; col <= maxCol; col++) {
        rowCells.push(map.get(`${row}-${col}`) || null);
      }
      matrix.push(rowCells);
    }
    return matrix;
  };

  // Precio por asiento
  const pricePerSeat = parseFloat(
    Array.isArray(params.price) ? params.price[0] : params.price || '25.00'
  );

  // Cargar asientos del backend
  useEffect(() => {
    loadSeats();
  }, []);

  const loadSeats = async () => {
    try {
      setLoading(true);

      const data: SeatAvailabilityDto[] = await getJsonWithAuth(`${API_BASE_URL}/viajes/${tripId}/asientos-disponibles`);

      setSeatLayout(data);
      setSeatMatrix(buildSeatMatrix(data));

      // Inicializar pasajeros sin asientos asignados
      const initialPassengerSeats: PassengerSeat[] = passengersData.map((passenger, index) => ({
        passengerIndex: index,
        passengerName: passenger.fullName,
        seatNumber: null
      }));

      setPassengerSeats(initialPassengerSeats);
    } catch (error) {
      console.error('Error al cargar asientos:', error);
      alert('Error al cargar los asientos del viaje');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: SeatAvailabilityDto) => {
    if (seat.status !== 'available') return;
    const activePassenger = passengerSeats[activePassengerIndex];
    if (!activePassenger) return;
    const seatNumber = seat.seatCode;

    if (activePassenger.seatNumber === seatNumber) {
      const updatedPassengerSeats = [...passengerSeats];
      updatedPassengerSeats[activePassengerIndex].seatNumber = null;
      setPassengerSeats(updatedPassengerSeats);
      return;
    }

    const isSelectedByOther = passengerSeats.some(
      (p, index) => p.seatNumber === seatNumber && index !== activePassengerIndex
    );
    if (isSelectedByOther) return;

    const updatedPassengerSeats = passengerSeats.map((p, index) => {
      if (index === activePassengerIndex) {
        return { ...p, seatNumber };
      }
      return p;
    });
    setPassengerSeats(updatedPassengerSeats);
  };


  const getSeatColor = (seat: SeatVisual) => {
    switch (seat.status) {
      case 'available':
        return '#E0F2FE'; // Azul claro para disponibles (como en la imagen)
      case 'unavailable':
        return EarthColors.grayMedium || '#E5E5E5';
      case 'selected':
        return EarthColors.earthPrimary; // Color tierra para selección
      case 'others':
        return '#10B981'; // Verde para asientos de otros
      default:
        return '#E0F2FE';
    }
  };

  const getSeatTextColor = (seat: SeatVisual) => {
    if (seat.status === 'selected' || seat.status === 'others') {
      return EarthColors.beigeBone;
    }
    if (seat.status === 'available') {
      return '#0284C7'; // Azul más oscuro para números en asientos disponibles
    }
    return EarthColors.grayEarth;
  };

  const getSelectedSeats = () => {
    return passengerSeats
      .filter(p => p.seatNumber !== null)
      .map(p => p.seatNumber || '')
      .sort((a, b) => a.localeCompare(b))
      .join(', ');
  };

  const getTotalPrice = () => {
    const selectedCount = passengerSeats.filter(p => p.seatNumber !== null).length;
    return (selectedCount * pricePerSeat).toFixed(2);
  };

  const handleConfirmSeats = () => {
    // Verificar que todos los pasajeros tengan asiento asignado
    const allSeatsAssigned = passengerSeats.every(p => p.seatNumber !== null);

    if (!allSeatsAssigned) {
      alert('Por favor asigna un asiento a cada pasajero');
      return;
    }

    // Verificar que tengamos los IDs de paradas
    const originStopId = params.originStopId as string;
    const destinationStopId = params.destinationStopId as string;

    if (!originStopId || !destinationStopId || originStopId === '' || destinationStopId === '') {
      alert('Error: No se encontraron las paradas del viaje. Por favor intenta de nuevo desde la búsqueda.');
      return;
    }

    // Preparar datos de tickets para enviar
    const ticketsData = passengerSeats.map((ps, index) => {
      const passengerInfo = passengersData[index];
      return {
        tripId: tripId,
        seatNumber: ps.seatNumber,
        passengerName: passengerInfo.fullName,
        passengerIdCard: passengerInfo.identificationNumber,
        passengerEmail: passengerInfo.email || '',
        passengerPhone: passengerInfo.phone || '',
        passengerType: passengerInfo.passengerType,
        originStopId: originStopId,
        destinationStopId: destinationStopId,
      };
    });

    // Navegar a la pantalla de método de pago con los datos de tickets
    router.push({
      pathname: '/payment-method',
      params: {
        ticketsData: JSON.stringify(ticketsData),
        totalPrice: getTotalPrice(),
      },
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Seleccionar Asientos" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.blackSoft} />
          <ThemedText style={styles.loadingText}>Cargando asientos...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (seatMatrix.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Seleccionar Asientos" />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>
            No hay asientos disponibles para este viaje
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Seleccionar Asientos" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Assign Seats to Passengers Section */}
        <View style={styles.section}>
          <ThemedText 
            lightColor={EarthColors.earthDarker} 
            darkColor={EarthColors.beigeLight} 
            style={styles.sectionTitle}>
            Asignar Asientos a Pasajeros
          </ThemedText>
          
          {passengerSeats.map((passenger, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.passengerRow,
                activePassengerIndex === index && styles.passengerRowActive
              ]}
              onPress={() => setActivePassengerIndex(index)}
              activeOpacity={0.7}>
              {activePassengerIndex === index && (
                <View style={styles.activeIndicator} />
              )}
              <View style={styles.passengerInfo}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.passengerName}>
                  {passenger.passengerName}
                </ThemedText>
                <ThemedText 
                  lightColor={EarthColors.earthDark} 
                  darkColor={EarthColors.grayEarth} 
                  style={styles.passengerSeat}>
                  {passenger.seatNumber 
                    ? `Asiento: ${passenger.seatNumber}` 
                    : 'Asiento no seleccionado'}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floor 1 Seat Map */}
        <View style={styles.section}>
          <View style={styles.floorHeader}>
            <ThemedText 
              lightColor={EarthColors.earthDarker} 
              darkColor={EarthColors.beigeLight} 
              style={styles.sectionTitle}>
              Piso 1
            </ThemedText>
            <ThemedText 
              lightColor={EarthColors.earthDark} 
              darkColor={EarthColors.grayEarth} 
              style={styles.driverLabel}>
              Conductor
            </ThemedText>
          </View>
          
          <View style={styles.seatMap}>
            {seatMatrix.map((row, rowIndex) => (
              <View key={`seat-row-${rowIndex}`} style={styles.seatRow}>
                {row.map((seatCell, colIndex) => {
                  if (!seatCell) {
                    return <View key={`aisle-${rowIndex}-${colIndex}`} style={styles.aisle} />;
                  }
                  const selectedPassenger = passengerSeats.find(p => p.seatNumber === seatCell.seatCode);
                  const seatVisual: SeatVisual = {
                    number: seatCell.seatCode,
                    status:
                      seatCell.status !== 'available'
                        ? 'others'
                        : selectedPassenger
                        ? 'selected'
                        : 'available',
                    passengerInitials: selectedPassenger ? getInitials(selectedPassenger.passengerName) : undefined
                  };

                  return (
                    <TouchableOpacity
                      key={seatCell.seatCode}
                      style={[
                        styles.seat,
                        { backgroundColor: getSeatColor(seatVisual) }
                      ]}
                      onPress={() => handleSeatSelect(seatCell)}
                      disabled={seatCell.status !== 'available'}
                      activeOpacity={0.7}>
                      <ThemedText 
                        lightColor={getSeatTextColor(seatVisual)} 
                        darkColor={getSeatTextColor(seatVisual)} 
                        style={styles.seatNumber}>
                        {seatCell.seatCode}
                      </ThemedText>
                      {seatVisual.passengerInitials && (
                        <View style={styles.seatInitials}>
                          <ThemedText 
                            lightColor={EarthColors.beigeBone} 
                            darkColor={EarthColors.beigeBone} 
                            style={styles.seatInitialsText}>
                            {seatVisual.passengerInitials}
                          </ThemedText>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#E0F2FE' }]} />
            <ThemedText 
              lightColor={EarthColors.earthDark} 
              darkColor={EarthColors.grayEarth} 
              style={styles.legendText}>
              Disponible
            </ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: EarthColors.grayMedium }]} />
            <ThemedText 
              lightColor={EarthColors.earthDark} 
              darkColor={EarthColors.grayEarth} 
              style={styles.legendText}>
              No disponible
            </ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: EarthColors.earthPrimary }]} />
            <ThemedText 
              lightColor={EarthColors.earthDark} 
              darkColor={EarthColors.grayEarth} 
              style={styles.legendText}>
              Tu selección
            </ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <ThemedText 
              lightColor={EarthColors.earthDark} 
              darkColor={EarthColors.grayEarth} 
              style={styles.legendText}>
              Asiento de otro
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Summary */}
      <View style={styles.bottomSummary}>
        <View style={styles.summaryRow}>
          <ThemedText 
            lightColor={EarthColors.earthDark} 
            darkColor={EarthColors.grayEarth} 
            style={styles.summaryLabel}>
            Asientos Seleccionados:
          </ThemedText>
          <ThemedText 
            lightColor={EarthColors.earthDarker} 
            darkColor={EarthColors.beigeLight} 
            style={styles.summaryValue}>
            {getSelectedSeats() || 'Ninguno'}
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText 
            lightColor={EarthColors.earthDark} 
            darkColor={EarthColors.grayEarth} 
            style={styles.summaryLabel}>
            Precio Total:
          </ThemedText>
          <ThemedText 
            lightColor={EarthColors.earthPrimary} 
            darkColor={EarthColors.earthLight} 
            style={styles.totalPrice}>
            ${getTotalPrice()}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmSeats}
          activeOpacity={0.8}>
          <ThemedText 
            lightColor={EarthColors.beigeBone} 
            darkColor={EarthColors.beigeBone} 
            style={styles.confirmButtonText}>
            Confirmar Asientos
          </ThemedText>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 180,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passengerRowActive: {
    borderLeftWidth: 4,
    borderLeftColor: EarthColors.earthPrimary,
    paddingLeft: 12,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: EarthColors.earthPrimary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  passengerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  passengerSeat: {
    fontSize: 14,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  seatMap: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E6F2',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  seatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    rowGap: 8,
  },
  aisle: {
    width: 30,
    height: 38,
    borderBottomWidth: 1,
    borderColor: '#C7CFDF',
    borderStyle: 'dashed',
  },
  seat: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CDD6EE',
    backgroundColor: '#EEF3FF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  seatSelected: {
    backgroundColor: '#5C7CFA',
    borderColor: '#5C7CFA',
  },
  seatOthers: {
    backgroundColor: '#C8CED9',
    borderColor: '#C8CED9',
  },
  seatUnavailable: {
    backgroundColor: '#E1E4EC',
    borderColor: '#E1E4EC',
    opacity: 0.7,
  },
  seatNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4D5B86',
  },
  seatInitials: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatInitialsText: {
    fontSize: 10,
    fontWeight: '700',
    color: EarthColors.beigeBone,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  bottomSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: EarthColors.whiteBone,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: EarthColors.beigeMedium || '#E8DFD5',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.beigeBone,
  },
});

