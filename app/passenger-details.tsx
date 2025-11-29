import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedTextInput } from '@/components/ui/text-input';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { savedPassengerService, SavedPassenger } from '@/services/savedPassenger';

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
  const { user, token } = useAuth();
  
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

  // Estados para pasajeros guardados
  const [savedPassengers, setSavedPassengers] = useState<SavedPassenger[]>([]);
  const [loadingSavedPassengers, setLoadingSavedPassengers] = useState(false);
  const [showSavedPassengerPicker, setShowSavedPassengerPicker] = useState<number | null>(null);
  
  // Estado para modal de selección múltiple
  const [showMultiSelectModal, setShowMultiSelectModal] = useState(false);
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([]);

  // Cargar pasajeros guardados al montar el componente
  useEffect(() => {
    loadSavedPassengers();
  }, []);

  const loadSavedPassengers = async () => {
    if (!user?.id || !token) return;
    
    try {
      setLoadingSavedPassengers(true);
      const passengers = await savedPassengerService.listByUser(user.id, token);
      setSavedPassengers(passengers);
    } catch (error) {
      // Error silencioso
    } finally {
      setLoadingSavedPassengers(false);
    }
  };

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

  const applySavedPassenger = (passengerIndex: number, savedPassenger: SavedPassenger) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[passengerIndex] = {
      fullName: savedPassenger.fullName,
      identificationNumber: savedPassenger.identificationNumber,
      email: savedPassenger.email,
      phone: savedPassenger.phone,
      passengerType: savedPassenger.passengerType,
    };
    setPassengers(updatedPassengers);
    setShowSavedPassengerPicker(null);
    
    // Auto-cerrar el ticket si está completo
    const passenger = updatedPassengers[passengerIndex];
    const isComplete = passenger.fullName && passenger.identificationNumber && 
                      passenger.email && passenger.phone;
    if (isComplete) {
      const updatedExpanded = [...expandedTickets];
      updatedExpanded[passengerIndex] = false;
      setExpandedTickets(updatedExpanded);
      
      // Abrir el siguiente ticket si existe y está vacío
      if (passengerIndex + 1 < passengers.length) {
        const nextPassenger = updatedPassengers[passengerIndex + 1];
        if (!nextPassenger.fullName) {
          updatedExpanded[passengerIndex + 1] = true;
          setExpandedTickets(updatedExpanded);
        }
      }
    }
  };

  // Verificar si un pasajero ya fue usado en otro ticket
  const isPassengerAlreadyUsed = (savedPassenger: SavedPassenger, currentIndex: number): boolean => {
    return passengers.some((passenger, index) => 
      index !== currentIndex && 
      passenger.identificationNumber === savedPassenger.identificationNumber &&
      passenger.identificationNumber !== ''
    );
  };

  // Manejar selección/deselección de checkbox
  const togglePassengerSelection = (passengerId: string) => {
    setSelectedPassengerIds(prev => {
      if (prev.includes(passengerId)) {
        return prev.filter(id => id !== passengerId);
      } else {
        // Limitar a la cantidad de pasajeros necesarios
        if (prev.length < passengersCount) {
          return [...prev, passengerId];
        }
        return prev;
      }
    });
  };

  // Aplicar pasajeros seleccionados a los tickets
  const applySelectedPassengers = () => {
    const selectedPassengers = savedPassengers.filter(sp => 
      selectedPassengerIds.includes(sp.id || '')
    );

    // LIMPIAR TODOS LOS TICKETS PRIMERO
    const updatedPassengers = Array.from({ length: passengersCount }, () => ({
      fullName: '',
      identificationNumber: '',
      email: '',
      phone: '',
      passengerType: 'ADULT' as 'ADULT' | 'CHILD' | 'SENIOR' | 'DISABLED',
    }));
    
    const updatedExpanded = Array.from({ length: passengersCount }, (_, i) => i === 0);

    // LLENAR SOLO LOS TICKETS CON PASAJEROS SELECCIONADOS
    selectedPassengers.forEach((savedPassenger, index) => {
      if (index < passengersCount) {
        updatedPassengers[index] = {
          fullName: savedPassenger.fullName,
          identificationNumber: savedPassenger.identificationNumber,
          email: savedPassenger.email,
          phone: savedPassenger.phone,
          passengerType: savedPassenger.passengerType,
        };
        // Cerrar tickets completados
        updatedExpanded[index] = false;
      }
    });

    // Si hay tickets sin llenar, abrir el primero vacío
    const firstEmptyIndex = updatedPassengers.findIndex(p => !p.fullName);
    if (firstEmptyIndex !== -1) {
      updatedExpanded[firstEmptyIndex] = true;
    }

    setPassengers(updatedPassengers);
    setExpandedTickets(updatedExpanded);
    setShowMultiSelectModal(false);
    setSelectedPassengerIds([]);
  };

  const savePassengersForFutureUse = async () => {
    if (!user?.id || !token) return;

    try {
      // Crear un Set con las cédulas ya guardadas para verificación rápida
      const existingIds = new Set(savedPassengers.map(sp => sp.identificationNumber));
      
      // También rastrear las que vamos guardando en esta sesión
      const justSavedIds = new Set<string>();
      
      for (const passenger of passengers) {
        // Solo guardar si no existe en la BD ni lo acabamos de guardar
        const alreadyExists = existingIds.has(passenger.identificationNumber);
        const justSaved = justSavedIds.has(passenger.identificationNumber);
        
        if (!alreadyExists && !justSaved) {
          await savedPassengerService.create(user.id, {
            fullName: passenger.fullName,
            identificationNumber: passenger.identificationNumber,
            email: passenger.email,
            phone: passenger.phone,
            passengerType: passenger.passengerType,
            isSelf: false,
          }, token);
          
          // Marcar como guardado para no duplicar en esta misma compra
          justSavedIds.add(passenger.identificationNumber);
        }
      }
      
      // Recargar lista - IMPORTANTE: esperar a que termine
      await loadSavedPassengers();
    } catch (error) {
      // Error silencioso pero el proceso continúa
    }
  };

  const handleSelectSeats = async () => {
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

    // Auto-guardar pasajeros para futuras compras
    await savePassengersForFutureUse();

    // Navegar a la pantalla de selección de asientos pasando la info de pasajeros
    const originCityId =
      (Array.isArray(params.originCityId) ? params.originCityId[0] : params.originCityId) ||
      (Array.isArray(params.originStopId) ? params.originStopId[0] : params.originStopId) ||
      '';
    const destinationCityId =
      (Array.isArray(params.destinationCityId) ? params.destinationCityId[0] : params.destinationCityId) ||
      (Array.isArray(params.destinationStopId) ? params.destinationStopId[0] : params.destinationStopId) ||
      '';

    router.push({
      pathname: '/select-seats',
      params: {
        passengers: passengersCount.toString(),
        passengersData: JSON.stringify(passengers), // Pasar todos los datos de pasajeros
        price: Array.isArray(params.price) ? params.price[0] : params.price || '25.00',
        tripId: Array.isArray(params.tripId) ? params.tripId[0] : params.tripId,
        busId: Array.isArray(params.busId) ? params.busId[0] : params.busId,
        operator: Array.isArray(params.operator) ? params.operator[0] : params.operator,
        departureTime: Array.isArray(params.departureTime) ? params.departureTime[0] : params.departureTime,
        arrivalTime: Array.isArray(params.arrivalTime) ? params.arrivalTime[0] : params.arrivalTime,
        busSeatsCount: Array.isArray(params.busSeatsCount) ? params.busSeatsCount[0] : params.busSeatsCount,
        originCityId,
        destinationCityId,
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
        
        {/* Botón para usar pasajeros guardados */}
        {savedPassengers.length > 0 && (
          <TouchableOpacity 
            style={styles.useExistingPassengersButton}
            onPress={() => {
              // Pre-seleccionar pasajeros que ya están en los tickets
              const currentIds: string[] = [];
              passengers.forEach(passenger => {
                if (passenger.identificationNumber) {
                  const savedPassenger = savedPassengers.find(
                    sp => sp.identificationNumber === passenger.identificationNumber
                  );
                  if (savedPassenger?.id) {
                    currentIds.push(savedPassenger.id);
                  }
                }
              });
              setSelectedPassengerIds(currentIds);
              setShowMultiSelectModal(true);
            }}>
            <MaterialIcons name="people" size={24} color={EarthColors.whiteBone} />
            <ThemedText style={styles.useExistingPassengersText}>
              Escoger Pasajeros ({savedPassengers.length})
            </ThemedText>
            <MaterialIcons name="chevron-right" size={24} color={EarthColors.whiteBone} />
          </TouchableOpacity>
        )}
        
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
                <ThemedText style={[
                  styles.ticketStatus,
                  getTicketStatus(index) === 'Completo' && styles.statusCompleto,
                  getTicketStatus(index) === 'En progreso' && styles.statusEnProgreso,
                  getTicketStatus(index) === 'Pendiente' && styles.statusPendiente
                ]}>
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

      {/* Saved Passengers Picker Modal */}
      {showSavedPassengerPicker !== null && (
        <Modal 
          visible={showSavedPassengerPicker !== null} 
          transparent 
          animationType="slide"
          onRequestClose={() => setShowSavedPassengerPicker(null)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Selecciona Pasajero</ThemedText>
                <TouchableOpacity onPress={() => setShowSavedPassengerPicker(null)}>
                  <IconSymbol name="xmark" size={24} color={EarthColors.blackSoft} />
                </TouchableOpacity>
              </View>
              {loadingSavedPassengers ? (
                <ActivityIndicator size="large" color={EarthColors.earthDark} style={{ padding: 20 }} />
              ) : (
                <FlatList
                  data={savedPassengers}
                  keyExtractor={(item) => item.id || ''}
                  renderItem={({ item }) => {
                    const isUsed = showSavedPassengerPicker !== null && 
                                   isPassengerAlreadyUsed(item, showSavedPassengerPicker);
                    
                    return (
                      <TouchableOpacity
                        style={[
                          styles.savedPassengerItem,
                          isUsed && styles.savedPassengerItemDisabled
                        ]}
                        onPress={() => {
                          if (showSavedPassengerPicker !== null && !isUsed) {
                            applySavedPassenger(showSavedPassengerPicker, item);
                          }
                        }}
                        disabled={isUsed}>
                        <View style={styles.savedPassengerItemContent}>
                          <View style={styles.savedPassengerInfo}>
                            {item.isSelf && (
                              <View style={styles.selfBadge}>
                                <ThemedText style={styles.selfBadgeText}>YO</ThemedText>
                              </View>
                            )}
                            <ThemedText style={[
                              styles.savedPassengerName,
                              isUsed && styles.savedPassengerTextDisabled
                            ]}>
                              {item.fullName}
                            </ThemedText>
                            <ThemedText style={[
                              styles.savedPassengerDetail,
                              isUsed && styles.savedPassengerTextDisabled
                            ]}>
                              CI: {item.identificationNumber}
                            </ThemedText>
                            <ThemedText style={[
                              styles.savedPassengerDetail,
                              isUsed && styles.savedPassengerTextDisabled
                            ]}>
                              {item.email}
                            </ThemedText>
                            {isUsed && (
                              <ThemedText style={styles.usedLabel}>
                                Ya seleccionado en otro ticket
                              </ThemedText>
                            )}
                          </View>
                          <IconSymbol 
                            name="chevron.right" 
                            size={20} 
                            color={isUsed ? EarthColors.grayInput : EarthColors.earthDark} 
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Selección Múltiple */}
      <Modal 
        visible={showMultiSelectModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowMultiSelectModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>Selecciona Pasajeros</ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {selectedPassengerIds.length} de {passengersCount} seleccionados
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => {
                setShowMultiSelectModal(false);
                setSelectedPassengerIds([]);
              }}>
                <IconSymbol name="xmark" size={24} color={EarthColors.blackSoft} />
              </TouchableOpacity>
            </View>
            
            {loadingSavedPassengers ? (
              <ActivityIndicator size="large" color={EarthColors.earthDark} style={{ padding: 20 }} />
            ) : (
              <>
                <FlatList
                  data={savedPassengers}
                  keyExtractor={(item) => item.id || ''}
                  renderItem={({ item }) => {
                    const isSelected = selectedPassengerIds.includes(item.id || '');
                    const isLimitReached = selectedPassengerIds.length >= passengersCount && !isSelected;
                    
                    return (
                      <TouchableOpacity
                        style={[
                          styles.checkboxPassengerItem,
                          isLimitReached && styles.savedPassengerItemDisabled
                        ]}
                        onPress={() => !isLimitReached && togglePassengerSelection(item.id || '')}
                        disabled={isLimitReached}>
                        <View style={styles.checkboxContainer}>
                          <View style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected
                          ]}>
                            {isSelected && (
                              <MaterialIcons name="check" size={18} color={EarthColors.whiteBone} />
                            )}
                          </View>
                        </View>
                        
                        <View style={styles.savedPassengerInfo}>
                          {item.isSelf && (
                            <View style={styles.selfBadge}>
                              <ThemedText style={styles.selfBadgeText}>YO</ThemedText>
                            </View>
                          )}
                          <ThemedText style={[
                            styles.savedPassengerName,
                            isLimitReached && styles.savedPassengerTextDisabled
                          ]}>
                            {item.fullName}
                          </ThemedText>
                          <ThemedText style={[
                            styles.savedPassengerDetail,
                            isLimitReached && styles.savedPassengerTextDisabled
                          ]}>
                            CI: {item.identificationNumber}
                          </ThemedText>
                          <ThemedText style={[
                            styles.savedPassengerDetail,
                            isLimitReached && styles.savedPassengerTextDisabled
                          ]}>
                            {item.email}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
                
                {selectedPassengerIds.length > 0 && (
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.applyButton}
                      onPress={applySelectedPassengers}>
                      <ThemedText style={styles.applyButtonText}>
                        Aplicar Pasajeros ({selectedPassengerIds.length})
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  savedPassengerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: EarthColors.grayInput || '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: EarthColors.earthLight || '#C7C1A7',
    borderStyle: 'dashed',
  },
  savedPassengerButtonText: {
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  savedPassengerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.grayInput || '#D1D5DB',
  },
  savedPassengerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedPassengerInfo: {
    flex: 1,
  },
  savedPassengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.earthDarker,
    marginBottom: 4,
  },
  savedPassengerDetail: {
    fontSize: 13,
    color: EarthColors.earthDark,
    marginBottom: 2,
  },
  selfBadge: {
    backgroundColor: EarthColors.earthDarker,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  selfBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: EarthColors.beigeBone,
    letterSpacing: 0.5,
  },
  savedPassengerItemDisabled: {
    opacity: 0.5,
    backgroundColor: EarthColors.grayLight || '#F5F5F5',
  },
  savedPassengerTextDisabled: {
    color: EarthColors.grayInput || '#D1D5DB',
  },
  usedLabel: {
    fontSize: 11,
    color: '#DC2626',
    fontStyle: 'italic',
    marginTop: 4,
  },
  useExistingPassengersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EarthColors.earthDarker,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  useExistingPassengersText: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.whiteBone,
    marginLeft: 8,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 13,
    color: EarthColors.earthDark,
    marginTop: 4,
  },
  checkboxPassengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.grayInput || '#D1D5DB',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: EarthColors.earthDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: EarthColors.earthDarker,
    borderColor: EarthColors.earthDarker,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: EarthColors.grayInput || '#D1D5DB',
  },
  applyButton: {
    backgroundColor: EarthColors.earthDarker,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.whiteBone,
  },
  statusCompleto: {
    color: '#10B981',
    fontWeight: '600',
  },
  statusEnProgreso: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  statusPendiente: {
    color: '#6B7280',
    fontWeight: '500',
  },
});

