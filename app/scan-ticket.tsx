import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanTicketScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleEnterCodeManually = () => {
    console.log('Ingresar código manualmente');
    // Aquí irá la lógica para ingresar código manualmente
    // router.push('/enter-ticket-code');
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('Código QR escaneado:', data);
    
    // Aquí procesarías el código QR del boleto
    // Por ejemplo, validar el ticket, mostrar información, etc.
    Alert.alert(
      'Boleto Escaneado',
      `Código: ${data}\n\n¿Deseas validar este boleto?`,
      [
        {
          text: 'Cancelar',
          onPress: () => setScanned(false),
          style: 'cancel',
        },
        {
          text: 'Validar',
          onPress: () => {
            // Aquí iría la lógica para validar el boleto
            console.log('Validando boleto:', data);
            // router.push('/ticket-validation', { ticketCode: data });
            setScanned(false);
          },
        },
      ]
    );
  };

  if (!permission) {
    // Cámara aún no está lista
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>Cargando cámara...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    // Permisos no otorgados
    return (
      <ThemedView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ThemedText
            lightColor={EarthColors.beigeBone}
            darkColor={EarthColors.beigeBone}
            style={styles.permissionText}>
            Necesitamos acceso a tu cámara para escanear boletos
          </ThemedText>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}>
            <ThemedText
              lightColor={EarthColors.blackSoft}
              darkColor={EarthColors.blackSoft}
              style={styles.permissionButtonText}>
              Otorgar Permiso
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={EarthColors.beigeBone}
            />
          </TouchableOpacity>
          <ThemedText
            lightColor={EarthColors.beigeBone}
            darkColor={EarthColors.beigeBone}
            style={styles.headerTitle}>
            Escanear Boleto
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {/* Camera Feed Area */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraFeed}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}>
            {/* Scanning Frame Overlay */}
            <View style={styles.scanningFrame}>
              {/* Top Left Corner */}
              <View style={[styles.corner, styles.topLeft]} />
              {/* Top Right Corner */}
              <View style={[styles.corner, styles.topRight]} />
              {/* Bottom Left Corner */}
              <View style={[styles.corner, styles.bottomLeft]} />
              {/* Bottom Right Corner */}
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </CameraView>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <ThemedText
          lightColor={EarthColors.grayEarth}
          darkColor={EarthColors.grayEarth}
          style={styles.instructionsText}>
          Coloca el código QR dentro del marco para escanear automáticamente.
        </ThemedText>
      </View>

      {/* Enter Code Manually Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.enterCodeButton}
          onPress={handleEnterCodeManually}
          activeOpacity={0.8}>
          <MaterialIcons
            name="confirmation-number"
            size={24}
            color={EarthColors.beigeBone}
          />
          <ThemedText
            lightColor={EarthColors.beigeBone}
            darkColor={EarthColors.beigeBone}
            style={styles.enterCodeButtonText}>
            Ingresar Código de Boleto Manualmente
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EarthColors.blackSoft,
  },
  safeArea: {
    backgroundColor: EarthColors.blackSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: EarthColors.blackSoft,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraFeed: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EarthColors.blackMedium || '#2C2C2C',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  scanningFrame: {
    width: '70%',
    aspectRatio: 1,
    position: 'absolute',
    top: '15%',
    left: '15%',
    zIndex: 2,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: EarthColors.whiteBone,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enterCodeButton: {
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: EarthColors.blackMedium || '#2C2C2C',
  },
  enterCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: EarthColors.beigeBone,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: EarthColors.beigeBone,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

