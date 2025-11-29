/**
 * Types and interfaces matching the backend DTOs for Trips
 * Based on the refactored backend structure with FrequencySegments
 */

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  TRAVELING = 'TRAVELING',
  ARRIVED = 'ARRIVED',
  CANCELED = 'CANCELED',
  DELAYED = 'DELAYED',
}

export enum PassengerType {
  ADULTO = 'ADULTO',
  ESTUDIANTE = 'ESTUDIANTE',
  DISCAPACITADO = 'DISCAPACITADO',
  MENOR = 'MENOR',
}

export interface RouteDto {
  id: string;
  cooperativeId: string;
  name: string;
  origin: string;
  destination: string;
  originCityId?: string;
  destinationCityId?: string;
  totalDistance: number;
  estimatedMinutes: number;
  basePrice: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FrequencySegmentDto {
  id: string;
  frequencyId: string;
  routeId: string;
  departureTime: string; // LocalTime formato HH:mm:ss
  estimatedDuration: number; // En minutos
  segmentOrder: number;
  route?: RouteDto;
  routeName?: string;
  routeOrigin?: string;
  routeDestination?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FrequencyDto {
  id: string;
  cooperativeId: string;
  cooperativeName?: string;
  name: string;
  operatingDays: string[];
  active: boolean;
  regulatoryResolution?: string;
  segments?: FrequencySegmentDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DriverDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseType: string;
  active: boolean;
}

export interface TripDto {
  id: string;
  frequencySegmentId: string;
  busId: string;
  mainDriverId?: string;
  date: string; // LocalDate formato YYYY-MM-DD
  scheduledDepartureTime: string; // LocalDateTime ISO format
  scheduledArrivalTime?: string; // LocalDateTime ISO format
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  status: TripStatus;
  observations?: string;
  
  // Read-only fields from backend
  frequencySegment?: FrequencySegmentDto;
  frequency?: FrequencyDto; // Parent frequency for this segment
  busPlate?: string;
  busUnitNumber?: number;
  busChassisBrand?: string;
  busBodyBrand?: string;
  busPhotoUrl?: string | null;
  mainDriverName?: string;
  driverName?: string;
  driverId?: string;
  routeName?: string;
  routeOrigin?: string;
  routeDestination?: string;
  driver?: DriverDto;
  busSeatsCount?: number;
  occupiedSeats?: number;
  availableSeats?: number;
  ticketsCount?: number; // Alias de occupiedSeats
  scheduledDate?: string; // Alias para compatibilidad
  createdAt?: string;
  updatedAt?: string;
}

export interface SeatAvailabilityDto {
  seatId?: string;
  seatCode: string;
  row?: number;
  column?: number;
  seatType?: string;
  status: 'available' | 'occupied';
}

export interface TicketDto {
  id: string;
  purchaseId: string;
  tripId: string;
  passengerName: string;
  passengerIdCard: string;
  passengerEmail?: string;
  passengerPhone?: string;
  passengerType: PassengerType;
  originStopId: string;
  destinationStopId: string;
  price: number;
  qrCode: string;
  isValidated: boolean;
  validatedAt?: string;
  validatedByDriverId?: string;
  createdAt: string;
  
  // Additional fields for display
  tripDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  routeName?: string;
  routeOrigin?: string;
  routeDestination?: string;
  cooperativeName?: string;
  busPlate?: string;
  seatNumber?: string;
}

export interface CreateTicketRequest {
  tripId: string;
  seatNumber: string; // Logical seat number (V1, P1, etc.)
  passengerName: string;
  passengerIdCard: string;
  passengerEmail: string;
  passengerPhone: string;
  passengerType: PassengerType;
  originCityId: string;
  destinationCityId: string;
}

export interface CreatePurchaseRequest {
  buyerUserId: string;
  purchaseType: 'ONLINE' | 'IN_PERSON';
  clerkId?: string;
  tickets: CreateTicketRequest[];
}
