import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
    ScrollView,
    StyleSheet,
    View,
    Image,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// Helper para convertir array de fecha/hora a Date
const arrayToDate = (dateArray: any): Date => {
  if (!dateArray) return new Date();
  if (Array.isArray(dateArray)) {
    const [year, month, day, hour = 0, minute = 0] = dateArray;
    return new Date(year, month - 1, day, hour, minute);
  }
  return new Date(dateArray);
};

export default function TicketDetailScreen() {
  const params = useLocalSearchParams();

  // Check if this is a history ticket
  const isHistory = params.isHistory === 'true';
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const usageDate = Array.isArray(params.usageDate) ? params.usageDate[0] : params.usageDate;
  const validatingDriver = Array.isArray(params.validatingDriver) ? params.validatingDriver[0] : params.validatingDriver;

  // Datos del ticket - en el futuro vendrán de la API
  const ticketData = {
    route: `${Array.isArray(params.origin) ? params.origin[0] : params.origin || 'Quito'} - ${Array.isArray(params.destination) ? params.destination[0] : params.destination || 'Guayaquil'}`,
    seat: Array.isArray(params.seat) ? params.seat[0] : params.seat || 'A12',
    date: Array.isArray(params.date) ? params.date[0] : params.date || '2024-03-15',
    time: Array.isArray(params.time) ? params.time[0] : params.time || '10:00 AM',
    passenger: Array.isArray(params.passenger) ? params.passenger[0] : params.passenger || 'Isabella Rodriguez',
    cooperative: Array.isArray(params.cooperative) ? params.cooperative[0] : params.cooperative || 'Trans Andes',
    cooperativeLogo: Array.isArray(params.cooperativeLogo) ? params.cooperativeLogo[0] : params.cooperativeLogo,
    bus: Array.isArray(params.bus) ? params.bus[0] : params.bus || 'Bus #456',
    ticketId: Array.isArray(params.ticketId) ? params.ticketId[0] : params.ticketId || 'TKT-123456',
  };

  const formatUsageDate = (dateStr?: any) => {
    if (!dateStr) return '';
    const date = arrayToDate(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // El QR code debe venir del backend (qrCode real del ticket)
  // Por ahora usamos el ticketId como fallback si no viene el qrCode
  const qrCodeFromParams = Array.isArray(params.qrCode) ? params.qrCode[0] : params.qrCode;
  const qrContent = qrCodeFromParams || ticketData.ticketId;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title={isHistory ? "Detalle del Viaje" : "Boleto"} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Cooperative brand */}
          <View style={styles.brandHeader}>
            {ticketData.cooperativeLogo ? (
              <Image
                source={{ uri: ticketData.cooperativeLogo as string }}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.brandLogoFallback}>
                <MaterialIcons name="directions-bus" size={28} color={EarthColors.whiteBone} />
              </View>
            )}
            <View style={styles.brandInfo}>
              <ThemedText style={styles.brandName}>{ticketData.cooperative}</ThemedText>
              <ThemedText style={styles.brandSubtitle}>Boleto digital</ThemedText>
            </View>
          </View>

          {/* Status Banner (only for history) */}
          {isHistory && (
            <View style={[
              styles.statusBanner,
              status === 'COMPLETED' ? styles.statusCompleted : styles.statusMissed
            ]}>
              <MaterialIcons
                name={status === 'COMPLETED' ? 'check-circle' : 'cancel'}
                size={24}
                color={EarthColors.whiteBone}
              />
              <ThemedText style={styles.statusBannerText}>
                {status === 'COMPLETED' ? 'VIAJE COMPLETADO' : 'VIAJE PERDIDO'}
              </ThemedText>
            </View>
          )}

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={[
              styles.qrContainer,
              isHistory && status === 'MISSED' && styles.qrContainerDisabled
            ]}>
              <QRCode
                value={qrContent}
                size={168}
                color={EarthColors.blackSoft}
                backgroundColor={EarthColors.whiteBone}
              />
              {isHistory && status === 'MISSED' && (
                <View style={styles.qrOverlay}>
                  <MaterialIcons name="block" size={80} color="rgba(255, 152, 0, 0.8)" />
                </View>
              )}
            </View>
            {isHistory && !usageDate && (
              <ThemedText style={styles.qrWarning}>
                Este ticket no fue validado
              </ThemedText>
            )}
            {/* Dashed line separator */}
            <View style={styles.dashedLine} />
          </View>

          {/* Validation Info (if completed) */}
          {isHistory && status === 'COMPLETED' && usageDate && (
            <View style={styles.validationBanner}>
              <View style={styles.validationHeader}>
                <MaterialIcons name="verified" size={24} color="#4CAF50" />
                <ThemedText style={styles.validationTitle}>Ticket Validado</ThemedText>
              </View>
              <View style={styles.validationDetails}>
                <View style={styles.validationRow}>
                  <MaterialIcons name="schedule" size={18} color="#2E7D32" />
                  <ThemedText style={styles.validationLabel}>Fecha de escaneo:</ThemedText>
                </View>
                <ThemedText style={styles.validationValue}>
                  {formatUsageDate(usageDate)}
                </ThemedText>
                {validatingDriver && (
                  <>
                    <View style={styles.validationRow}>
                      <MaterialIcons name="badge" size={18} color="#2E7D32" />
                      <ThemedText style={styles.validationLabel}>Conductor:</ThemedText>
                    </View>
                    <ThemedText style={styles.validationValue}>
                      {validatingDriver}
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
          )}

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
    borderRadius: 20,
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
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 8,
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: EarthColors.whiteBone,
    borderWidth: 1,
    borderColor: EarthColors.grayLight,
  },
  brandLogoFallback: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: EarthColors.blackSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInfo: {
    flex: 1,
    marginLeft: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: EarthColors.blackSoft,
  },
  brandSubtitle: {
    marginTop: 4,
    color: EarthColors.earthDark,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusMissed: {
    backgroundColor: '#FF9800',
  },
  statusBannerText: {
    color: EarthColors.whiteBone,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
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
    position: 'relative',
  },
  qrContainerDisabled: {
    opacity: 0.5,
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  qrWarning: {
    marginTop: 12,
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
    textAlign: 'center',
  },
  dashedLine: {
    borderTopWidth: 2,
    borderTopColor: EarthColors.grayMedium || '#E5E5E5',
    borderStyle: 'dashed',
    width: '100%',
    marginTop: 16,
  },
  validationBanner: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  validationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  validationDetails: {
    gap: 8,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  validationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  validationValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1B5E20',
    marginLeft: 26,
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

