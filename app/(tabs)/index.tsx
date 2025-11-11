import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedTextInput } from '@/components/ui/text-input';
import { EarthColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SearchScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('Hoy');
  const [passengers, setPassengers] = useState('1');
  const colorScheme = useColorScheme();

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    // Navegar a la pantalla de resultados de búsqueda
    router.push({
      pathname: '/search-results',
      params: {
        origin: origin || 'Nueva York',
        destination: destination || 'Chicago',
        date: departureDate,
        passengers: passengers,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Buscar Boletos" showBackButton={false} />
      
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
            <View style={styles.inputWithIcons}>
              <MaterialIcons name="location-on" size={20} color={EarthColors.blackSoft} style={styles.leftIcon} />
              <ThemedTextInput
                placeholder="Selecciona Origen"
                value={origin}
                onChangeText={setOrigin}
                style={styles.input}
                containerStyle={styles.inputContainer}
                editable={false}
                placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
              />
              <TouchableOpacity style={styles.rightIcon}>
                <IconSymbol name="chevron.down" size={20} color={EarthColors.blackSoft} />
              </TouchableOpacity>
            </View>
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
            <View style={styles.inputWithIcons}>
              <MaterialIcons name="location-on" size={20} color={EarthColors.blackSoft} style={styles.leftIcon} />
              <ThemedTextInput
                placeholder="Selecciona Destino"
                value={destination}
                onChangeText={setDestination}
                style={styles.input}
                containerStyle={styles.inputContainer}
                editable={false}
                placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
              />
              <TouchableOpacity style={styles.rightIcon}>
                <IconSymbol name="chevron.down" size={20} color={EarthColors.blackSoft} />
              </TouchableOpacity>
            </View>
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
});
