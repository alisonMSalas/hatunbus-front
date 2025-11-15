import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedTextInput } from '@/components/ui/text-input';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SearchScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [departureDate, setDepartureDate] = useState('Hoy');
  const [passengers, setPassengers] = useState('');
  const [origins, setOrigins] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const colorScheme = useColorScheme();

  const formatDate = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);
    
    if (selected.getTime() === today.getTime()) {
      return 'Hoy';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (selected.getTime() === tomorrow.getTime()) {
      return 'Mañana';
    }
    
    // Formatear fecha en español
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    return `${days[selected.getDay()]}, ${selected.getDate()} de ${months[selected.getMonth()]}`;
  };

  useEffect(() => {
    loadCities();
    // Formatear la fecha inicial
    setDepartureDate(formatDate(selectedDate));
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      // Fetch cities from the new API endpoint (no auth required)
      const response = await fetch(`${API_BASE_URL}/ciudades`);
      const citiesData = await response.json();
      
      // Extract city names from the response
      const cityNames = citiesData.map((city: any) => city.name);
      
      // Use the same list for both origins and destinations
      setOrigins(cityNames);
      setDestinations(cityNames);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      setDepartureDate(formatDate(date));
    }
  };

  const handleSearch = () => {
    if (!origin || !destination) {
      alert('Por favor selecciona origen y destino');
      return;
    }

    // Validar que haya al menos 1 pasajero
    const passengersCount = passengers.trim() === '' ? '1' : passengers;
    if (parseInt(passengersCount) < 1) {
      alert('Por favor ingresa al menos 1 pasajero');
      return;
    }

    // Format date to YYYY-MM-DD
    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    router.push({
      pathname: '/search-results',
      params: {
        origin: origin,
        destination: destination,
        date: formattedDate,
        passengers: passengersCount,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Buscar Boletos" showBackButton={false} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.blackSoft} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Card Container */}
          <View style={styles.card}>
            {/* Origin Field */}
            <View style={styles.fieldContainer}>
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.label}>
                Origen
              </ThemedText>
              <TouchableOpacity style={styles.selectField} onPress={() => setShowOriginPicker(true)}>
                <MaterialIcons name="location-on" size={20} color={EarthColors.blackSoft} />
                <ThemedText lightColor={origin ? EarthColors.earthDarker : EarthColors.blackSoftOpacity} darkColor={EarthColors.beigeLight} style={styles.selectFieldText}>
                  {origin || 'Selecciona Origen'}
                </ThemedText>
                <IconSymbol name="chevron.down" size={20} color={EarthColors.blackSoft} />
              </TouchableOpacity>
            </View>

          {/* Swap Button */}
          <View style={styles.swapButtonContainer}>
            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <IconSymbol name="arrow.up.arrow.down" size={20} color={EarthColors.blackSoft} />
            </TouchableOpacity>
          </View>

          {/* Destination Field */}
          <View style={styles.fieldContainer}>
            <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.label}>
              Destino
            </ThemedText>
            <TouchableOpacity style={styles.selectField} onPress={() => setShowDestinationPicker(true)}>
              <MaterialIcons name="location-on" size={20} color={EarthColors.blackSoft} />
              <ThemedText lightColor={destination ? EarthColors.earthDarker : EarthColors.blackSoftOpacity} darkColor={EarthColors.beigeLight} style={styles.selectFieldText}>
                {destination || 'Selecciona Destino'}
              </ThemedText>
              <IconSymbol name="chevron.down" size={20} color={EarthColors.blackSoft} />
            </TouchableOpacity>
          </View>

          {/* Departure Date Field */}
          <View style={styles.fieldContainer}>
            <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.label}>
              Fecha de Salida
            </ThemedText>
            <TouchableOpacity style={styles.selectField} onPress={() => setShowDatePicker(true)}>
              <MaterialIcons name="calendar-today" size={20} color={EarthColors.blackSoft} />
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.selectFieldText}>
                {departureDate}
              </ThemedText>
              <IconSymbol name="chevron.down" size={20} color={EarthColors.blackSoft} />
            </TouchableOpacity>
          </View>

          {/* Passengers Field */}
          <View style={styles.fieldContainer}>
            <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.label}>
              Pasajeros
            </ThemedText>
            <View style={styles.inputWithIcons}>
              <View style={styles.leftIcon}>
                <MaterialIcons name="person" size={20} color={EarthColors.blackSoft} />
              </View>
              <ThemedTextInput
                placeholder="Ingresa pasajeros"
                value={passengers}
                onChangeText={(text) => {
                  // Solo permitir números
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setPassengers(numericValue);
                }}
                keyboardType="number-pad"
                style={styles.input}
                containerStyle={styles.inputContainer}
              />
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <MaterialIcons name="search" size={20} color={EarthColors.beigeBone} />
            <ThemedText lightColor={EarthColors.beigeBone} darkColor={EarthColors.beigeBone} style={styles.searchButtonText}>
              Buscar Autobuses
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      )}

      {/* Origin Picker Modal */}
      <Modal visible={showOriginPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Selecciona Origen</ThemedText>
              <TouchableOpacity onPress={() => setShowOriginPicker(false)}>
                <IconSymbol name="xmark" size={24} color={EarthColors.blackSoft} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={origins}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setOrigin(item);
                    setShowOriginPicker(false);
                  }}>
                  <ThemedText style={styles.modalItemText}>{item}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Destination Picker Modal */}
      <Modal visible={showDestinationPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Selecciona Destino</ThemedText>
              <TouchableOpacity onPress={() => setShowDestinationPicker(false)}>
                <IconSymbol name="xmark" size={24} color={EarthColors.blackSoft} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={destinations}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setDestination(item);
                    setShowDestinationPicker(false);
                  }}>
                  <ThemedText style={styles.modalItemText}>{item}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        Platform.OS === 'web' ? (
          <Modal visible={showDatePicker} transparent animationType="fade">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Selecciona Fecha</ThemedText>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <IconSymbol name="xmark" size={24} color={EarthColors.blackSoft} />
                  </TouchableOpacity>
                </View>
                <View style={styles.webDateInputContainer}>
                  {Platform.OS === 'web' && (
                    // @ts-ignore - React Native Web supports HTML input elements
                    React.createElement('input', {
                      type: 'date',
                      value: selectedDate.toISOString().split('T')[0],
                      min: new Date().toISOString().split('T')[0],
                      onChange: (e: any) => {
                        if (e.target.value) {
                          const date = new Date(e.target.value);
                          setSelectedDate(date);
                          setDepartureDate(formatDate(date));
                          setShowDatePicker(false);
                        }
                      },
                      style: {
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        borderRadius: '10px',
                        border: `1px solid ${EarthColors.grayInput || '#D1D5DB'}`,
                        backgroundColor: EarthColors.whiteBone,
                        fontFamily: 'inherit',
                      },
                    })
                  )}
                </View>
              </View>
            </View>
          </Modal>
        ) : Platform.OS === 'ios' ? (
          <Modal visible={showDatePicker} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Selecciona Fecha</ThemedText>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <IconSymbol name="xmark" size={24} color={EarthColors.blackSoft} />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  locale="es-ES"
                />
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(false)}>
                  <ThemedText style={styles.datePickerButtonText}>Confirmar</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )
      )}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWithIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputContainer: {
    flex: 1,
    marginVertical: 0,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: EarthColors.grayInput || '#D1D5DB',
    borderColor: EarthColors.grayInput || '#D1D5DB',
    borderWidth: 0,
    minHeight: 54,
  },
  input: {
    flex: 1,
    color: EarthColors.earthDarker,
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: EarthColors.beigeLight || '#F5F1EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: EarthColors.earthLighter,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.grayInput || '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 0,
    minHeight: 54,
  },
  selectFieldText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 10,
    paddingVertical: 16,
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
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    borderBottomColor: EarthColors.grayInput,
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
    borderBottomColor: EarthColors.grayInput,
  },
  modalItemText: {
    fontSize: 16,
    color: EarthColors.earthDarker,
  },
  datePickerButton: {
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.beigeBone,
  },
  webDateInputContainer: {
    padding: 20,
  },
});
