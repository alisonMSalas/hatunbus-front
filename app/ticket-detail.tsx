import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function TicketDetailScreen() {
  const params = useLocalSearchParams();
  
  // Datos del ticket - en el futuro vendrán de la API
  const ticketData = {
    route: `${Array.isArray(params.origin) ? params.origin[0] : params.origin || 'Quito'} - ${Array.isArray(params.destination) ? params.destination[0] : params.destination || 'Guayaquil'}`,
    seat: Array.isArray(params.seat) ? params.seat[0] : params.seat || 'A12',
    date: Array.isArray(params.date) ? params.date[0] : params.date || '2024-03-15',
    time: Array.isArray(params.time) ? params.time[0] : params.time || '10:00 AM',
    passenger: Array.isArray(params.passenger) ? params.passenger[0] : params.passenger || 'Isabella Rodriguez',
    cooperative: Array.isArray(params.cooperative) ? params.cooperative[0] : params.cooperative || 'Trans Andes',
    bus: Array.isArray(params.bus) ? params.bus[0] : params.bus || 'Bus #456',
    ticketId: Array.isArray(params.ticketId) ? params.ticketId[0] : params.ticketId || 'TKT-123456',
  };

  // Generar el contenido del QR code (puede incluir el ID del ticket y otros datos)
  const qrContent = JSON.stringify({
    ticketId: ticketData.ticketId,
    route: ticketData.route,
    seat: ticketData.seat,
    date: ticketData.date,
    time: ticketData.time,
    passenger: ticketData.passenger,
  });

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Boleto" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <QRCode
                value={qrContent}
                size={168}
                color={EarthColors.blackSoft}
                backgroundColor={EarthColors.whiteBone}
              />
            </View>
            {/* Dashed line separator */}
            <View style={styles.dashedLine} />
          </View>

          {/* Ticket Information */}
          <View style={styles.ticketInfo}>
            {/* Route */}
            <View style={styles.infoRow}>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.infoLabel}>
                Ruta
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.infoValue}>
                {ticketData.route}
              </ThemedText>
            </View>

            {/* Seat */}
            <View style={styles.infoRow}>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.infoLabel}>
                Asiento
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.infoValue}>
                {ticketData.seat}
              </ThemedText>
            </View>

            {/* Date */}
            <View style={styles.infoRow}>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.infoLabel}>
                Fecha
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.infoValue}>
                {ticketData.date}
              </ThemedText>
            </View>

            {/* Time */}
            <View style={styles.infoRow}>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.infoLabel}>
                Hora
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.infoValue}>
                {ticketData.time}
              </ThemedText>
            </View>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Passenger */}
            <View style={styles.infoRow}>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.infoLabel}>
                Pasajero
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.infoValue}>
                {ticketData.passenger}
              </ThemedText>
            </View>

            {/* Cooperative */}
            <View style={styles.infoRow}>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.infoLabel}>
                Cooperativa
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.infoValue}>
                {ticketData.cooperative}
              </ThemedText>
            </View>

            {/* Bus */}
            <View style={styles.infoRow}>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.infoLabel}>
                Bus
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.infoValue}>
                {ticketData.bus}
              </ThemedText>
            </View>
          </View>
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
    alignItems: 'center',
  },
  ticketCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  qrSection: {
    backgroundColor: EarthColors.whiteBone,
    padding: 24,
    alignItems: 'center',
  },
  qrContainer: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  dashedLine: {
    borderTopWidth: 2,
    borderTopColor: EarthColors.grayMedium || '#E5E5E5',
    borderStyle: 'dashed',
    width: '100%',
    marginTop: 16,
  },
  ticketInfo: {
    padding: 20,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: EarthColors.grayMedium || '#E5E5E5',
    marginVertical: 16,
  },
});

