import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedTextInput } from '@/components/ui/text-input';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface PassengerInfo {
  fullName: string;
  identificationType: string;
  identificationNumber: string;
  age: string;
}

export default function PassengerDetailsScreen() {
  const params = useLocalSearchParams();
  
  // Obtener el número de pasajeros desde los parámetros
  const passengersCount = parseInt(
    Array.isArray(params.passengers) ? params.passengers[0] : params.passengers || '1'
  );

  // Inicializar estados para cada pasajero
  const [passengers, setPassengers] = useState<PassengerInfo[]>(
    Array.from({ length: passengersCount }, () => ({
      fullName: '',
      identificationType: 'Cédula de Identidad',
      identificationNumber: '',
      age: '',
    }))
  );

  // Estado para controlar qué tickets están expandidos
  const [expandedTickets, setExpandedTickets] = useState<boolean[]>(
    Array.from({ length: passengersCount }, (_, index) => index === 0) // Solo el primero expandido por defecto
  );

  const identificationTypes = [
    'Cédula de Identidad',
    'Pasaporte',
    'Cédula de Extranjería',
  ];

  const handlePassengerChange = (index: number, field: keyof PassengerInfo, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    };
    setPassengers(updatedPassengers);
  };

  const toggleTicket = (index: number) => {
    const updatedExpanded = [...expandedTickets];
    updatedExpanded[index] = !updatedExpanded[index];
    setExpandedTickets(updatedExpanded);
  };

  const handleSelectSeats = () => {
    // Navegar a la pantalla de selección de asientos
    router.push({
      pathname: '/select-seats',
      params: {
        passengers: passengersCount.toString(),
        price: Array.isArray(params.price) ? params.price[0] : params.price || '25.00',
        tripId: Array.isArray(params.tripId) ? params.tripId[0] : params.tripId,
        operator: Array.isArray(params.operator) ? params.operator[0] : params.operator,
        seatType: Array.isArray(params.seatType) ? params.seatType[0] : params.seatType,
        departureTime: Array.isArray(params.departureTime) ? params.departureTime[0] : params.departureTime,
        arrivalTime: Array.isArray(params.arrivalTime) ? params.arrivalTime[0] : params.arrivalTime,
      },
    });
  };

  const getTicketStatus = (index: number) => {
    const passenger = passengers[index];
    if (passenger.fullName && passenger.identificationNumber && passenger.age) {
      return 'Completo';
    } else if (passenger.fullName || passenger.identificationNumber || passenger.age) {
      return 'En progreso';
    }
    return 'Pendiente';
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Información de Pasajeros" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Passenger Cards */}
        {passengers.map((passenger, index) => (
          <View key={index} style={styles.ticketCard}>
            {/* Ticket Header - Always Visible */}
            <TouchableOpacity
              style={[
                styles.ticketHeader,
                expandedTickets[index] && styles.ticketHeaderExpanded
              ]}
              onPress={() => toggleTicket(index)}
              activeOpacity={0.7}>
              <View style={styles.ticketHeaderLeft}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.ticketTitle}>
                  Ticket {index + 1} de {passengersCount}
                </ThemedText>
                <ThemedText 
                  lightColor={EarthColors.earthDark} 
                  darkColor={EarthColors.grayEarth} 
                  style={styles.ticketStatus}>
                  {getTicketStatus(index)}
                </ThemedText>
              </View>
              <MaterialIcons
                name={expandedTickets[index] ? 'expand-less' : 'expand-more'}
                size={24}
                color={EarthColors.earthDarker}
              />
            </TouchableOpacity>

            {/* Ticket Content - Collapsible */}
            {expandedTickets[index] && (
              <View style={styles.ticketContent}>
                {/* Full Name Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText 
                    lightColor={EarthColors.earthDarker} 
                    darkColor={EarthColors.beigeLight} 
                    style={styles.label}>
                    Nombre Completo
                  </ThemedText>
                  <ThemedTextInput
                    placeholder={`e.g., ${index === 0 ? 'Jane Doe' : 'John Smith'}`}
                    value={passenger.fullName}
                    onChangeText={(value) => handlePassengerChange(index, 'fullName', value)}
                    containerStyle={styles.inputContainer}
                    placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                  />
                </View>

                {/* Identification Type Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText 
                    lightColor={EarthColors.earthDarker} 
                    darkColor={EarthColors.beigeLight} 
                    style={styles.label}>
                    Tipo de Identificación
                  </ThemedText>
                  <TouchableOpacity style={styles.selectField}>
                    <ThemedText 
                      lightColor={EarthColors.earthDarker} 
                      darkColor={EarthColors.beigeLight} 
                      style={styles.selectFieldText}>
                      {passenger.identificationType}
                    </ThemedText>
                    <IconSymbol name="chevron.down" size={20} color={EarthColors.earthDarker} />
                  </TouchableOpacity>
                </View>

                {/* Identification Number Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText 
                    lightColor={EarthColors.earthDarker} 
                    darkColor={EarthColors.beigeLight} 
                    style={styles.label}>
                    Número de Identificación
                  </ThemedText>
                  <ThemedTextInput
                    placeholder="Ingresa el número"
                    value={passenger.identificationNumber}
                    onChangeText={(value) => handlePassengerChange(index, 'identificationNumber', value)}
                    keyboardType="numeric"
                    containerStyle={styles.inputContainer}
                    placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                  />
                </View>

                {/* Age Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText 
                    lightColor={EarthColors.earthDarker} 
                    darkColor={EarthColors.beigeLight} 
                    style={styles.label}>
                    Edad
                  </ThemedText>
                  <ThemedTextInput
                    placeholder="Ingresa la edad"
                    value={passenger.age}
                    onChangeText={(value) => handlePassengerChange(index, 'age', value)}
                    keyboardType="numeric"
                    containerStyle={styles.inputContainer}
                    placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                  />
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.selectSeatsButton}
          onPress={handleSelectSeats}
          activeOpacity={0.8}>
          <ThemedText 
            lightColor={EarthColors.beigeBone} 
            darkColor={EarthColors.beigeBone} 
            style={styles.selectSeatsButtonText}>
            Seleccionar Asientos
          </ThemedText>
          <MaterialIcons name="chevron-right" size={24} color={EarthColors.beigeBone} />
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
    paddingBottom: 100, // Espacio para el botón fijo
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  ticketCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  ticketHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  ticketHeaderLeft: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  ticketStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  ticketContent: {
    padding: 20,
    paddingTop: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    marginVertical: 0,
    backgroundColor: EarthColors.grayInput || '#D1D5DB',
    borderColor: EarthColors.grayInput || '#D1D5DB',
    borderWidth: 0,
    minHeight: 54,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: EarthColors.grayInput || '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 54,
  },
  selectFieldText: {
    fontSize: 16,
    flex: 1,
  },
  selectSeatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 10,
    paddingVertical: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  selectSeatsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

