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
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface PassengerInfo {
  fullName: string;
  identificationNumber: string;
  email: string;
  phone: string;
  passengerType: 'ADULT' | 'CHILD' | 'SENIOR' | 'DISABLED';
}

interface PassengerErrors {
  fullName: string;
  identificationNumber: string;
  email: string;
  phone: string;
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
      identificationNumber: '',
      email: '',
      phone: '',
      passengerType: 'ADULT',
    }))
  );

  // Estado para errores de cada pasajero
  const [passengersErrors, setPassengersErrors] = useState<PassengerErrors[]>(
    Array.from({ length: passengersCount }, () => ({
      fullName: '',
      identificationNumber: '',
      email: '',
      phone: '',
    }))
  );

  // Estado para controlar qué tickets están expandidos
  const [expandedTickets, setExpandedTickets] = useState<boolean[]>(
    Array.from({ length: passengersCount }, (_, index) => index === 0) // Solo el primero expandido por defecto
  );

  // Estado para controlar qué modal de tipo de pasajero está abierto
  const [showPassengerTypePicker, setShowPassengerTypePicker] = useState<number | null>(null);

  // Validación de cédula ecuatoriana
  const validateEcuadorianId = (id: string): boolean => {
    if (id.length !== 10) return false;
    if (!/^\d+$/.test(id)) return false;

    const province = parseInt(id.substring(0, 2));
    if (province < 1 || province > 24) return false;

    const digits = id.split('').map(Number);
    const verifier = digits[9];

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = digits[i];
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }

    const calculatedVerifier = (10 - (sum % 10)) % 10;
    return verifier === calculatedVerifier;
  };

  // Validación de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar un campo específico de un pasajero
  const validateField = (passengerIndex: number, field: keyof PassengerErrors, value: string): boolean => {
    let error = '';

    switch (field) {
      case 'fullName':
        if (!value.trim()) error = 'El nombre completo es obligatorio';
        break;
      case 'identificationNumber':
        if (!value.trim()) {
          error = 'La cédula es obligatoria';
        } else if (value.length !== 10) {
          error = 'La cédula debe tener 10 dígitos';
        } else if (!/^\d+$/.test(value)) {
          error = 'La cédula solo debe contener números';
        } else if (!validateEcuadorianId(value)) {
          error = 'Cédula ecuatoriana inválida';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'El email es obligatorio';
        } else if (!validateEmail(value)) {
          error = 'Email inválido';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'El teléfono es obligatorio';
        } else if (value.length !== 10) {
          error = 'El teléfono debe tener 10 dígitos';
        } else if (!/^\d+$/.test(value)) {
          error = 'El teléfono solo debe contener números';
        }
        break;
    }

    const updatedErrors = [...passengersErrors];
    updatedErrors[passengerIndex] = {
      ...updatedErrors[passengerIndex],
      [field]: error,
    };
    setPassengersErrors(updatedErrors);

    return error === '';
  };

  // Validar todos los campos de un pasajero
  const validatePassenger = (passengerIndex: number): boolean => {
    const passenger = passengers[passengerIndex];
    const isValid = 
      validateField(passengerIndex, 'fullName', passenger.fullName) &&
      validateField(passengerIndex, 'identificationNumber', passenger.identificationNumber) &&
      validateField(passengerIndex, 'email', passenger.email) &&
      validateField(passengerIndex, 'phone', passenger.phone);
    
    return isValid;
  };

  const passengerTypes = [
    { value: 'ADULT', label: 'Adulto' },
    { value: 'CHILD', label: 'Niño' },
    { value: 'SENIOR', label: 'Adulto Mayor' },
    { value: 'DISABLED', label: 'Discapacitado' },
  ];

  const handlePassengerChange = (index: number, field: keyof PassengerInfo, value: string | 'ADULT' | 'CHILD' | 'SENIOR' | 'DISABLED') => {
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
    // Validar todos los pasajeros
    let allValid = true;
    for (let i = 0; i < passengers.length; i++) {
      if (!validatePassenger(i)) {
        allValid = false;
      }
    }

    if (!allValid) {
      alert('Por favor corrige los errores en la información de los pasajeros');
      return;
    }

    // Navegar a la pantalla de selección de asientos pasando la info de pasajeros
    router.push({
      pathname: '/select-seats',
      params: {
        passengers: passengersCount.toString(),
        passengersData: JSON.stringify(passengers), // Pasar todos los datos de pasajeros
        price: Array.isArray(params.price) ? params.price[0] : params.price || '25.00',
        tripId: Array.isArray(params.tripId) ? params.tripId[0] : params.tripId,
        operator: Array.isArray(params.operator) ? params.operator[0] : params.operator,
        departureTime: Array.isArray(params.departureTime) ? params.departureTime[0] : params.departureTime,
        arrivalTime: Array.isArray(params.arrivalTime) ? params.arrivalTime[0] : params.arrivalTime,
        busSeatsCount: Array.isArray(params.busSeatsCount) ? params.busSeatsCount[0] : params.busSeatsCount,
        originStopId: Array.isArray(params.originStopId) ? params.originStopId[0] : params.originStopId,
        destinationStopId: Array.isArray(params.destinationStopId) ? params.destinationStopId[0] : params.destinationStopId,
      },
    });
  };

  const getTicketStatus = (index: number) => {
    const passenger = passengers[index];
    const requiredFields = [
      passenger.fullName,
      passenger.identificationNumber,
      passenger.email,
      passenger.phone
    ];

    const filledFields = requiredFields.filter(field => field && field.trim() !== '').length;

    if (filledFields === requiredFields.length) {
      return 'Completo';
    } else if (filledFields > 0) {
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
                    Nombre Completo *
                  </ThemedText>
                  <ThemedTextInput
                    placeholder={`e.g., ${index === 0 ? 'Jane Doe' : 'John Smith'}`}
                    value={passenger.fullName}
                    onChangeText={(value) => {
                      handlePassengerChange(index, 'fullName', value);
                      validateField(index, 'fullName', value);
                    }}
                    onBlur={() => validateField(index, 'fullName', passenger.fullName)}
                    containerStyle={styles.inputContainer}
                    placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                  />
                  {passengersErrors[index].fullName ? (
                    <ThemedText style={styles.errorText}>{passengersErrors[index].fullName}</ThemedText>
                  ) : null}
                </View>

                {/* Identification Number Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText
                    lightColor={EarthColors.earthDarker}
                    darkColor={EarthColors.beigeLight}
                    style={styles.label}>
                    Cédula de Identidad (10 dígitos) *
                  </ThemedText>
                  <ThemedTextInput
                    placeholder="Ingresa 10 dígitos"
                    value={passenger.identificationNumber}
                    onChangeText={(value) => {
                      handlePassengerChange(index, 'identificationNumber', value);
                      validateField(index, 'identificationNumber', value);
                    }}
                    onBlur={() => validateField(index, 'identificationNumber', passenger.identificationNumber)}
                    keyboardType="numeric"
                    maxLength={10}
                    containerStyle={styles.inputContainer}
                    placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                  />
                  {passengersErrors[index].identificationNumber ? (
                    <ThemedText style={styles.errorText}>{passengersErrors[index].identificationNumber}</ThemedText>
                  ) : null}
                </View>

                {/* Email Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText
                    lightColor={EarthColors.earthDarker}
                    darkColor={EarthColors.beigeLight}
                    style={styles.label}>
                    Email *
                  </ThemedText>
                  <ThemedTextInput
                    placeholder="ejemplo@correo.com"
                    value={passenger.email}
                    onChangeText={(value) => {
                      handlePassengerChange(index, 'email', value);
                      validateField(index, 'email', value);
                    }}
                    onBlur={() => validateField(index, 'email', passenger.email)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    containerStyle={styles.inputContainer}
                    placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                  />
                  {passengersErrors[index].email ? (
                    <ThemedText style={styles.errorText}>{passengersErrors[index].email}</ThemedText>
                  ) : null}
                </View>

                {/* Phone Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText
                    lightColor={EarthColors.earthDarker}
                    darkColor={EarthColors.beigeLight}
                    style={styles.label}>
                    Teléfono (10 dígitos) *
                  </ThemedText>
                  <ThemedTextInput
                    placeholder="0987654321"
                    value={passenger.phone}
                    onChangeText={(value) => {
                      handlePassengerChange(index, 'phone', value);
                      validateField(index, 'phone', value);
                    }}
                    onBlur={() => validateField(index, 'phone', passenger.phone)}
                    keyboardType="phone-pad"
                    maxLength={10}
                    containerStyle={styles.inputContainer}
                    placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                  />
                  {passengersErrors[index].phone ? (
                    <ThemedText style={styles.errorText}>{passengersErrors[index].phone}</ThemedText>
                  ) : null}
                </View>

                {/* Passenger Type Field */}
                <View style={styles.fieldContainer}>
                  <ThemedText
                    lightColor={EarthColors.earthDarker}
                    darkColor={EarthColors.beigeLight}
                    style={styles.label}>
                    Tipo de Pasajero
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.selectField}
                    onPress={() => setShowPassengerTypePicker(index)}>
                    <ThemedText
                      lightColor={EarthColors.earthDarker}
                      darkColor={EarthColors.beigeLight}
                      style={styles.selectFieldText}>
                      {passengerTypes.find(type => type.value === passenger.passengerType)?.label || 'Adulto'}
                    </ThemedText>
                    <IconSymbol name="chevron.down" size={20} color={EarthColors.earthDarker} />
                  </TouchableOpacity>
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

      {/* Passenger Type Picker Modal */}
      {showPassengerTypePicker !== null && (
        <Modal 
          visible={showPassengerTypePicker !== null} 
          transparent 
          animationType="slide"
          onRequestClose={() => setShowPassengerTypePicker(null)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Selecciona Tipo de Pasajero</ThemedText>
                <TouchableOpacity onPress={() => setShowPassengerTypePicker(null)}>
                  <IconSymbol name="xmark" size={24} color={EarthColors.blackSoft} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={passengerTypes}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      if (showPassengerTypePicker !== null) {
                        handlePassengerChange(showPassengerTypePicker, 'passengerType', item.value);
                        setShowPassengerTypePicker(null);
                      }
                    }}>
                    <ThemedText style={styles.modalItemText}>{item.label}</ThemedText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: EarthColors.whiteBone,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.grayInput || '#D1D5DB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: EarthColors.earthDarker,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.grayInput || '#D1D5DB',
  },
  modalItemText: {
    fontSize: 16,
    color: EarthColors.earthDarker,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

