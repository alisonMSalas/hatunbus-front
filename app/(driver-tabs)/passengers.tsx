import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function DriverPassengersScreen() {
  return (
    <ThemedView style={styles.container}>
      <Header title="Pasajeros" showBackButton={false} />
      <View style={styles.content}>
        <ThemedText
          lightColor={EarthColors.earthDarker}
          darkColor={EarthColors.beigeLight}
          style={styles.text}>
          Pantalla de Pasajeros
        </ThemedText>
        <ThemedText
          lightColor={EarthColors.earthDark}
          darkColor={EarthColors.grayEarth}
          style={styles.subtext}>
          Aquí se mostrarán los pasajeros
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EarthColors.grayLight || '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 100, // Espacio para la navbar
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
  },
});

