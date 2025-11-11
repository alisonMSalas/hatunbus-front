import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

type SeatStatus = 'available' | 'unavailable' | 'selected' | 'others';

interface Seat {
  number: number;
  status: SeatStatus;
  passengerInitials?: string;
}

interface PassengerSeat {
  passengerIndex: number;
  passengerName: string;
  seatNumber: number | null;
}

export default function SelectSeatsScreen() {
  const params = useLocalSearchParams();
  
  // Obtener el número de pasajeros desde los parámetros
  const passengersCount = parseInt(
    Array.isArray(params.passengers) ? params.passengers[0] : params.passengers || '1'
  );

  // Función para obtener iniciales de un nombre
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Generar nombres de pasajeros de ejemplo (en el futuro vendrán de passenger-details)
  const passengerNames = Array.from({ length: passengersCount }, (_, index) => 
    index === 0 ? 'John Doe' : index === 1 ? 'Jane Smith' : `Pasajero ${index + 1}`
  );

  // Estado inicial para asientos asignados
  const initialPassengerSeats: PassengerSeat[] = passengerNames.map((name, index) => ({
    passengerIndex: index,
    passengerName: name,
    seatNumber: index === 0 ? 15 : index === 1 && passengersCount >= 2 ? 6 : null, // Primer pasajero tiene asiento 15, segundo tiene asiento 6 si hay 2+ pasajeros
  }));

  // Estado para asientos asignados
  const [passengerSeats, setPassengerSeats] = useState<PassengerSeat[]>(initialPassengerSeats);

  // Estado para el pasajero actualmente seleccionado
  const [activePassengerIndex, setActivePassengerIndex] = useState<number>(0);

  // Precio por asiento
  const pricePerSeat = parseFloat(
    Array.isArray(params.price) ? params.price[0] : params.price || '25.00'
  );

  // Inicializar el mapa de asientos con los asientos ya asignados
  const initialSeats: Seat[] = [
    { number: 1, status: 'available' },
    { number: 2, status: 'available' },
    { number: 3, status: 'available' },
    { number: 4, status: 'available' },
    { number: 5, status: 'available' },
    { number: 6, status: passengersCount >= 2 ? 'selected' : 'others', passengerInitials: passengersCount >= 2 ? getInitials(passengerNames[1]) : 'JS' }, // Segundo pasajero o asiento de otro
    { number: 7, status: 'available' },
    { number: 8, status: 'available' },
    { number: 9, status: 'available' },
    { number: 10, status: 'available' },
    { number: 11, status: 'unavailable' },
    { number: 12, status: 'available' },
    { number: 13, status: 'available' },
    { number: 14, status: 'available' },
    { number: 15, status: 'selected', passengerInitials: getInitials(passengerNames[0]) }, // Primer pasajero (John Doe)
    { number: 16, status: 'available' },
    { number: 17, status: 'available' },
    { number: 18, status: 'available' },
    { number: 19, status: 'available' },
    { number: 20, status: 'available' },
  ];

  // Mapa de asientos - 20 asientos en 5 filas, 4 columnas con pasillo
  const [seats, setSeats] = useState<Seat[]>(initialSeats);

  const handleSeatSelect = (seatNumber: number) => {
    const seat = seats.find(s => s.number === seatNumber);
    
    // No permitir seleccionar asientos no disponibles o de otros
    if (seat?.status === 'unavailable' || seat?.status === 'others') {
      return;
    }

    const activePassenger = passengerSeats[activePassengerIndex];
    
    // Si el asiento ya está seleccionado por este pasajero, deseleccionarlo
    if (seat?.status === 'selected' && activePassenger.seatNumber === seatNumber) {
      // Deseleccionar asiento
      const updatedSeats = seats.map(s => 
        s.number === seatNumber ? { ...s, status: 'available' as SeatStatus, passengerInitials: undefined } : s
      );
      setSeats(updatedSeats);
      
      const updatedPassengerSeats = [...passengerSeats];
      updatedPassengerSeats[activePassengerIndex].seatNumber = null;
      setPassengerSeats(updatedPassengerSeats);
      return;
    }

    // Verificar si el asiento ya está seleccionado por otro pasajero
    const isSelectedByOther = passengerSeats.some(
      (p, index) => p.seatNumber === seatNumber && index !== activePassengerIndex
    );
    
    if (isSelectedByOther) {
      // No permitir seleccionar un asiento que ya está ocupado por otro pasajero
      return;
    }

    // Obtener el asiento anterior del pasajero activo
    const previousSeatNumber = activePassenger.seatNumber;
    const activePassengerInitials = getInitials(activePassenger.passengerName);

    // Actualizar todos los asientos en una sola operación
    const updatedSeats = seats.map(s => {
      // Liberar el asiento anterior si existe
      if (previousSeatNumber && s.number === previousSeatNumber) {
        return { ...s, status: 'available' as SeatStatus, passengerInitials: undefined };
      }
      // Asignar el nuevo asiento
      if (s.number === seatNumber) {
        return { 
          ...s, 
          status: 'selected' as SeatStatus, 
          passengerInitials: activePassengerInitials
        };
      }
      return s;
    });

    setSeats(updatedSeats);

    // Actualizar el asiento del pasajero activo
    const updatedPassengerSeats = [...passengerSeats];
    updatedPassengerSeats[activePassengerIndex].seatNumber = seatNumber;
    setPassengerSeats(updatedPassengerSeats);
  };


  const getSeatColor = (seat: Seat) => {
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

  const getSeatTextColor = (seat: Seat) => {
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
      .map(p => p.seatNumber)
      .sort((a, b) => (a || 0) - (b || 0))
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
      // Mostrar mensaje de que faltan asientos por asignar
      console.log('Faltan asientos por asignar');
      return;
    }

    console.log('Asientos confirmados:', passengerSeats);
    
    // Navegar a la pantalla de método de pago
    router.push({
      pathname: '/payment-method',
      params: {
        passengers: passengersCount.toString(),
        price: pricePerSeat.toString(),
        totalPrice: getTotalPrice(),
        selectedSeats: getSelectedSeats(),
        tripId: Array.isArray(params.tripId) ? params.tripId[0] : params.tripId,
        operator: Array.isArray(params.operator) ? params.operator[0] : params.operator,
        seatType: Array.isArray(params.seatType) ? params.seatType[0] : params.seatType,
        departureTime: Array.isArray(params.departureTime) ? params.departureTime[0] : params.departureTime,
        arrivalTime: Array.isArray(params.arrivalTime) ? params.arrivalTime[0] : params.arrivalTime,
      },
    });
  };

  // Organizar asientos en filas (5 filas, 4 columnas con pasillo)
  const seatRows = [
    [1, 2, null, 3, 4],
    [5, 6, null, 7, 8],
    [9, 10, null, 11, 12],
    [13, 14, null, 15, 16],
    [17, 18, null, 19, 20],
  ];

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
            {seatRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.seatRow}>
                {row.map((seatNum, colIndex) => {
                  if (seatNum === null) {
                    // Pasillo
                    return <View key={`aisle-${rowIndex}-${colIndex}`} style={styles.aisle} />;
                  }
                  
                  const seat = seats.find(s => s.number === seatNum);
                  if (!seat) return null;
                  
                  const isActive = activePassengerIndex !== null && 
                    passengerSeats[activePassengerIndex]?.seatNumber === seat.number;
                  
                  return (
                    <TouchableOpacity
                      key={seat.number}
                      style={[
                        styles.seat,
                        { backgroundColor: getSeatColor(seat) },
                        seat.status === 'selected' && styles.seatSelected,
                        seat.status === 'others' && styles.seatOthers,
                        seat.status === 'unavailable' && styles.seatUnavailable,
                      ]}
                      onPress={() => handleSeatSelect(seat.number)}
                      disabled={seat.status === 'unavailable' || seat.status === 'others'}
                      activeOpacity={0.7}>
                      <ThemedText 
                        lightColor={getSeatTextColor(seat)} 
                        darkColor={getSeatTextColor(seat)} 
                        style={styles.seatNumber}>
                        {seat.number}
                      </ThemedText>
                      {seat.passengerInitials && (
                        <View style={styles.seatInitials}>
                          <ThemedText 
                            lightColor={EarthColors.beigeBone} 
                            darkColor={EarthColors.beigeBone} 
                            style={styles.seatInitialsText}>
                            {seat.passengerInitials}
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
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aisle: {
    width: 40,
  },
  seat: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    position: 'relative',
  },
  seatSelected: {
    backgroundColor: EarthColors.earthPrimary,
  },
  seatOthers: {
    backgroundColor: '#10B981',
  },
  seatUnavailable: {
    backgroundColor: EarthColors.grayMedium || '#E5E5E5',
    opacity: 0.6,
  },
  seatNumber: {
    fontSize: 16,
    fontWeight: '700',
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

