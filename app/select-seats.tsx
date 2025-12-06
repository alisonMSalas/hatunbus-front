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

type SpecialCellType = 'aisle' | 'bathroom' | 'door' | 'stairs' | 'storage' | 'wheelchair';

type GridCell =
  | { kind: 'seat'; seat: SeatAvailabilityDto; templateSeatType?: string }
  | { kind: 'special'; specialType: SpecialCellType }
  | { kind: 'empty' };

interface BusTemplateInfo {
  seatConfiguration?: Record<string, string>;
}

interface BusDtoResponse {
  id: string;
  busTemplate?: BusTemplateInfo | null;
}

const seatTypeValues = new Set(['NORMAL', 'VIP', 'SEMI_BED', 'BED']);

const specialLabels: Record<SpecialCellType, string> = {
  aisle: 'Pasillo',
  bathroom: 'Baño',
  door: 'Puerta',
  stairs: 'Escalera',
  storage: 'Maletero',
  wheelchair: 'Acceso',
};

const normalizeSpecialType = (type: string | undefined): SpecialCellType | null => {
  if (!type) return null;
  const value = type.toLowerCase();
  switch (value) {
    case 'aisle':
      return 'aisle';
    case 'bathroom':
      return 'bathroom';
    case 'door':
      return 'door';
    case 'stairs':
      return 'stairs';
    case 'maletero':
      return 'storage';
    case 'wheelchair':
      return 'wheelchair';
    default:
      return null;
  }
};

const getSpecialLabel = (type: SpecialCellType) => specialLabels[type] || '';

export default function SelectSeatsScreen() {
  const params = useLocalSearchParams();

  // Parsear datos de pasajeros
  const passengersData: PassengerInfo[] = params.passengersData
    ? JSON.parse(Array.isArray(params.passengersData) ? params.passengersData[0] : params.passengersData)
    : [];

  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
  const busId = Array.isArray(params.busId) ? params.busId[0] : params.busId;
  // Estados
  const [loading, setLoading] = useState(true);
  const [seatGrid, setSeatGrid] = useState<GridCell[][]>([]);
  const [passengerSeats, setPassengerSeats] = useState<PassengerSeat[]>([]);
  const [activePassengerIndex, setActivePassengerIndex] = useState<number>(0);

  // Función para obtener iniciales de un nombre
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderSeatCell = (cell: GridCell & { kind: 'seat' }, rowIndex: number, colIndex: number) => {
    const seat = cell.seat;
    const selectedPassenger = passengerSeats.find(p => p.seatNumber === seat.seatCode);
    const seatVisual: SeatVisual = {
      number: seat.seatCode,
      status:
        seat.status !== 'available'
          ? 'others'
          : selectedPassenger
          ? 'selected'
          : 'available',
      passengerInitials: selectedPassenger ? getInitials(selectedPassenger.passengerName) : undefined,
    };

    return (
      <TouchableOpacity
        key={`seat-${seat.seatCode}-${rowIndex}-${colIndex}`}
        style={[styles.seat, { backgroundColor: getSeatColor(seatVisual) }]}
        onPress={() => handleSeatSelect(seat)}
        disabled={seat.status !== 'available'}
        activeOpacity={0.7}>
        <ThemedText
          lightColor={getSeatTextColor(seatVisual)}
          darkColor={getSeatTextColor(seatVisual)}
          style={styles.seatNumber}>
          {seat.seatCode}
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
  };

  const renderSpecialCell = (type: SpecialCellType, rowIndex: number, colIndex: number) => {
    if (type === 'aisle') {
      return <View key={`aisle-${rowIndex}-${colIndex}`} style={styles.aisle} />;
    }
    return (
      <View key={`special-${rowIndex}-${colIndex}`} style={styles.specialCell}>
        <ThemedText
          lightColor={EarthColors.grayEarth}
          darkColor={EarthColors.grayEarth}
          style={styles.specialCellText}>
          {getSpecialLabel(type)}
        </ThemedText>
      </View>
    );
  };

  const renderGridCell = (cell: GridCell, rowIndex: number, colIndex: number) => {
    if (cell.kind === 'seat') {
      return renderSeatCell(cell, rowIndex, colIndex);
    }
    if (cell.kind === 'special') {
      return renderSpecialCell(cell.specialType, rowIndex, colIndex);
    }
    return <View key={`empty-${rowIndex}-${colIndex}`} style={styles.emptyCell} />;
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

  const createSeatFromTemplate = (
    index: number,
    row: number,
    column: number,
    seatType: string
  ): SeatAvailabilityDto => {
    const code = `S${(index + 1).toString().padStart(2, '0')}`;
    return {
      seatCode: code,
      seatNumber: code,
      row,
      column,
      floor: 1,
      seatType,
      status: 'available',
    };
  };

  const buildLegacyGrid = (availability: SeatAvailabilityDto[]): GridCell[][] => {
    const matrix = buildSeatMatrix(availability);
    if (!matrix.length) return [];
    return matrix.map(row =>
      row.map(cell => (cell ? { kind: 'seat', seat: cell } : { kind: 'empty' }))
    );
  };

  const buildTemplateGrid = (
    availability: SeatAvailabilityDto[],
    config: Record<string, string>
  ): GridCell[][] => {
    if (!config || Object.keys(config).length === 0) {
      return [];
    }

    const seatMap = new Map<string, SeatAvailabilityDto>();
    availability.forEach(seat => {
      if (seat.row && seat.column) {
        seatMap.set(`${seat.row}-${seat.column}`, seat);
      }
    });

    const indices = Object.keys(config)
      .map(key => Number(key))
      .filter(idx => !Number.isNaN(idx));

    if (!indices.length) {
      return [];
    }

    const totalRows = indices.reduce((max, idx) => Math.max(max, Math.floor(idx / 5) + 1), 0);

    const grid: GridCell[][] = [];
    for (let row = 1; row <= totalRows; row++) {
      const rowCells: GridCell[] = [];
      for (let column = 1; column <= 5; column++) {
        const index = (row - 1) * 5 + (column - 1);
        const cellType = config[index];

        if (!cellType) {
          rowCells.push({ kind: 'empty' });
          continue;
        }

        if (seatTypeValues.has(cellType)) {
          const seat =
            seatMap.get(`${row}-${column}`) || createSeatFromTemplate(index, row, column, cellType);
          rowCells.push({ kind: 'seat', seat, templateSeatType: cellType });
          continue;
        }

        const specialType = normalizeSpecialType(cellType);
        if (specialType) {
          rowCells.push({ kind: 'special', specialType });
        } else {
          rowCells.push({ kind: 'empty' });
        }
      }
      grid.push(rowCells);
    }

    return grid;
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

      const availabilityPromise = getJsonWithAuth<SeatAvailabilityDto[]>(
        `${API_BASE_URL}/viajes/${tripId}/asientos-disponibles`
      );

      const busPromise: Promise<BusDtoResponse | null> = busId
        ? getJsonWithAuth<BusDtoResponse>(`${API_BASE_URL}/buses/${busId}`)
        : Promise.resolve(null);

      const [availability, busResponse] = await Promise.all([availabilityPromise, busPromise]);

      const templateConfig = busResponse?.busTemplate?.seatConfiguration;
      let grid: GridCell[][] = [];

      if (templateConfig && Object.keys(templateConfig).length > 0) {
        grid = buildTemplateGrid(availability, templateConfig);
      }

      if (!grid.length) {
        grid = buildLegacyGrid(availability);
      }

      setSeatGrid(grid);

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

  const getSelectedCount = () => passengerSeats.filter(p => p.seatNumber !== null).length;

  const getSubtotal = () => (getSelectedCount() * pricePerSeat);

  const getDiscountAmount = () => {
    let discount = 0;
    passengerSeats.forEach((ps) => {
      if (!ps.seatNumber) return;
      const passengerInfo = passengersData[ps.passengerIndex];
      if (!passengerInfo) return;
      if (passengerInfo.passengerType === 'CHILD' || passengerInfo.passengerType === 'DISABLED') {
        discount += pricePerSeat * 0.5;
      } else if (passengerInfo.passengerType === 'SENIOR') {
        discount += pricePerSeat * 0.3;
      }
    });
    return discount;
  };

  const getTotalPrice = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    return Math.max(subtotal - discount, 0).toFixed(2);
  };

  const handleConfirmSeats = () => {
    // Verificar que todos los pasajeros tengan asiento asignado
    const allSeatsAssigned = passengerSeats.every(p => p.seatNumber !== null);

    if (!allSeatsAssigned) {
      alert('Por favor asigna un asiento a cada pasajero');
      return;
    }

    // Verificar que tengamos los IDs de ciudades
    const originCityId =
      (Array.isArray(params.originCityId) ? params.originCityId[0] : params.originCityId) ||
      (Array.isArray(params.originStopId) ? params.originStopId[0] : params.originStopId) ||
      '';
    const destinationCityId =
      (Array.isArray(params.destinationCityId) ? params.destinationCityId[0] : params.destinationCityId) ||
      (Array.isArray(params.destinationStopId) ? params.destinationStopId[0] : params.destinationStopId) ||
      '';

    if (!originCityId || !destinationCityId) {
      alert('Error: No se encontraron las ciudades del viaje. Por favor intenta de nuevo desde la búsqueda.');
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
        originCityId,
        destinationCityId,
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

  if (seatGrid.length === 0) {
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
            {seatGrid.map((row, rowIndex) => (
              <View key={`seat-row-${rowIndex}`} style={styles.seatRow}>
                {row.map((cell, colIndex) => renderGridCell(cell, rowIndex, colIndex))}
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
            Subtotal:
          </ThemedText>
          <ThemedText 
            lightColor={EarthColors.earthDarker} 
            darkColor={EarthColors.beigeLight} 
            style={styles.summaryValue}>
            ${getSubtotal().toFixed(2)}
          </ThemedText>
        </View>
        {getDiscountAmount() > 0 && (
          <View style={styles.summaryRow}>
            <ThemedText 
              lightColor={EarthColors.earthDark} 
              darkColor={EarthColors.grayEarth} 
              style={styles.summaryLabel}>
              Descuentos:
            </ThemedText>
            <ThemedText 
              lightColor="#B91C1C" 
              darkColor="#F87171" 
              style={styles.discountValue}>
              -${getDiscountAmount().toFixed(2)}
            </ThemedText>
          </View>
        )}
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
  specialCell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DADCE8',
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFF',
  },
  specialCellText: {
    fontSize: 10,
    textAlign: 'center',
    color: EarthColors.grayEarth,
  },
  emptyCell: {
    width: 44,
    height: 44,
    marginHorizontal: 4,
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
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C',
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

