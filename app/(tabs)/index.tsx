import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedTextInput } from '@/components/ui/text-input';
import { EarthColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { getJsonWithAuth } from '@/services/api';
import { API_BASE_URL } from '@/constants/api';

import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';

export default function SearchScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('Hoy');
  const [passengers, setPassengers] = useState('1');
  const [origins, setOrigins] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadCities();
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

  const handleSearch = () => {
    if (!origin || !destination) {
      alert('Por favor selecciona origen y destino');
      return;
    }

    // Format date from "Hoy" to YYYY-MM-DD
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    router.push({
      pathname: '/search-results',
      params: {
        origin: origin,
        destination: destination,
        date: formattedDate,
        passengers: passengers,
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
            <TouchableOpacity style={styles.selectField}>
              <MaterialIcons name="calendar-today" size={20} color={EarthColors.blackSoft} />
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.selectFieldText}>
                {departureDate}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Passengers Field */}
          <View style={styles.fieldContainer}>
            <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.label}>
              Pasajeros
            </ThemedText>
            <TouchableOpacity style={styles.selectField}>
              <MaterialIcons name="person" size={20} color={EarthColors.blackSoft} />
              <ThemedText lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.selectFieldText}>
                {passengers}
              </ThemedText>
            </TouchableOpacity>
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
});
