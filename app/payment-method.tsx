import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

type PaymentMethod = 'bank' | 'credit' | null;

export default function PaymentMethodScreen() {
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Generar un ID de reserva de ejemplo (en el futuro vendrá de la API)
  const bookingId = 'HB-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  const handleMethodSelect = (method: PaymentMethod) => {
    if (selectedMethod === method) {
      // Si se hace clic en el método ya seleccionado, colapsarlo
      setSelectedMethod(null);
    } else {
      setSelectedMethod(method);
    }
  };

  const handleUploadImage = () => {
    // Aquí irá la lógica para subir la imagen usando expo-image-picker
    // Por ahora, simulamos una imagen cargada
    console.log('Subir imagen de comprobante');
    // En una implementación real, usarías:
    // import * as ImagePicker from 'expo-image-picker';
    // const result = await ImagePicker.launchImageLibraryAsync({...});
    // if (!result.canceled) { setUploadedImage(result.assets[0].uri); }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  const handleContinue = () => {
    console.log('handleContinue llamado');
    console.log('selectedMethod:', selectedMethod);
    console.log('uploadedImage:', uploadedImage);
    
    if (!selectedMethod) {
      console.log('No hay método seleccionado');
      alert('Por favor selecciona un método de pago');
      return;
    }
    
    // Para tarjeta de crédito, no requerimos comprobante
    // Para depósito bancario, validamos que se haya subido el comprobante
    if (selectedMethod === 'bank' && !uploadedImage) {
      console.log('Debe subir el comprobante de pago para depósito bancario');
      alert('Por favor sube el comprobante de pago');
      return;
    }
    
    console.log('Navegando a tickets...');
    
    // Navegar a la pantalla de tickets usando replace para reemplazar el stack
    // Esto evitará que el usuario pueda volver a la pantalla de pago
    router.replace('/(tabs)/tickets');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Método de Pago" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Choose a Payment Method Section */}
        <View style={styles.section}>
          <ThemedText 
            lightColor={EarthColors.earthDarker} 
            darkColor={EarthColors.beigeLight} 
            style={styles.sectionTitle}>
            Elige un método de pago
          </ThemedText>
          
          {/* Bank Deposit/Transfer Option */}
          <View>
            <TouchableOpacity
              style={[
                styles.paymentCard,
                selectedMethod === 'bank' && styles.paymentCardSelected
              ]}
              onPress={() => handleMethodSelect('bank')}
              activeOpacity={0.7}>
              <View style={styles.paymentCardLeft}>
                <View style={styles.paymentIcon}>
                  <MaterialIcons name="account-balance" size={24} color={EarthColors.earthDarker} />
                </View>
                <View style={styles.paymentInfo}>
                  <ThemedText 
                    lightColor={EarthColors.earthDarker} 
                    darkColor={EarthColors.beigeLight} 
                    style={styles.paymentTitle}>
                    Depósito/Transferencia Bancaria
                  </ThemedText>
                  <ThemedText 
                    lightColor={EarthColors.earthDark} 
                    darkColor={EarthColors.grayEarth} 
                    style={styles.paymentSubtitle}>
                    Realiza una transacción bancaria segura
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons 
                name={selectedMethod === 'bank' ? "expand-more" : "chevron-right"} 
                size={24} 
                color={EarthColors.earthDark} 
              />
            </TouchableOpacity>

            {/* Bank Deposit Instructions and Upload */}
            {selectedMethod === 'bank' && (
              <View style={styles.bankDetailsContainer}>
                {/* Instructions for Payment Section */}
                <View style={styles.instructionsSection}>
                  <ThemedText 
                    lightColor={EarthColors.earthDarker} 
                    darkColor={EarthColors.beigeLight} 
                    style={styles.sectionSubtitle}>
                    Instrucciones de Pago
                  </ThemedText>
                  <ThemedText 
                    lightColor={EarthColors.earthDark} 
                    darkColor={EarthColors.grayEarth} 
                    style={styles.instructionText}>
                    Por favor deposita o transfiere el monto total a la siguiente cuenta bancaria:
                  </ThemedText>
                  
                  <View style={styles.bankInfoList}>
                    <View style={styles.bankInfoItem}>
                      <ThemedText 
                        lightColor={EarthColors.earthDark} 
                        darkColor={EarthColors.grayEarth} 
                        style={styles.bankInfoLabel}>
                        Nombre del Banco:
                      </ThemedText>
                      <ThemedText 
                        lightColor={EarthColors.earthDarker} 
                        darkColor={EarthColors.beigeLight} 
                        style={styles.bankInfoValue}>
                        City Bank
                      </ThemedText>
                    </View>
                    <View style={styles.bankInfoItem}>
                      <ThemedText 
                        lightColor={EarthColors.earthDark} 
                        darkColor={EarthColors.grayEarth} 
                        style={styles.bankInfoLabel}>
                        Nombre de la Cuenta:
                      </ThemedText>
                      <ThemedText 
                        lightColor={EarthColors.earthDarker} 
                        darkColor={EarthColors.beigeLight} 
                        style={styles.bankInfoValue}>
                        HatunBus SAC
                      </ThemedText>
                    </View>
                    <View style={styles.bankInfoItem}>
                      <ThemedText 
                        lightColor={EarthColors.earthDark} 
                        darkColor={EarthColors.grayEarth} 
                        style={styles.bankInfoLabel}>
                        Número de Cuenta:
                      </ThemedText>
                      <ThemedText 
                        lightColor={EarthColors.earthDarker} 
                        darkColor={EarthColors.beigeLight} 
                        style={styles.bankInfoValue}>
                        123-456789-012
                      </ThemedText>
                    </View>
                    <View style={styles.bankInfoItem}>
                      <ThemedText 
                        lightColor={EarthColors.earthDark} 
                        darkColor={EarthColors.grayEarth} 
                        style={styles.bankInfoLabel}>
                        Referencia:
                      </ThemedText>
                      <ThemedText 
                        lightColor={EarthColors.earthDarker} 
                        darkColor={EarthColors.beigeLight} 
                        style={styles.bankInfoValue}>
                        {bookingId}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Upload Proof of Payment Section */}
                <View style={styles.uploadSection}>
                  <ThemedText 
                    lightColor={EarthColors.earthDarker} 
                    darkColor={EarthColors.beigeLight} 
                    style={styles.sectionSubtitle}>
                    Subir Comprobante de Pago
                  </ThemedText>
                  <ThemedText 
                    lightColor={EarthColors.earthDark} 
                    darkColor={EarthColors.grayEarth} 
                    style={styles.instructionText}>
                    Sube una foto de tu comprobante de depósito o una captura de pantalla de tu transferencia.
                  </ThemedText>
                  
                  <View style={styles.uploadArea}>
                    {uploadedImage && (
                      <View style={styles.uploadedImageContainer}>
                        <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={handleRemoveImage}
                          activeOpacity={0.7}>
                          <MaterialIcons name="close" size={20} color={EarthColors.whiteBone} />
                        </TouchableOpacity>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={handleUploadImage}
                      activeOpacity={0.7}>
                      <MaterialIcons name="upload" size={32} color={EarthColors.earthDark} />
                      <ThemedText 
                        lightColor={EarthColors.earthDark} 
                        darkColor={EarthColors.grayEarth} 
                        style={styles.uploadPlaceholderText}>
                        Subir Archivo
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Credit Card Option */}
          <TouchableOpacity
            style={[
              styles.paymentCard,
              selectedMethod === 'credit' && styles.paymentCardSelected
            ]}
            onPress={() => handleMethodSelect('credit')}
            activeOpacity={0.7}>
            <View style={styles.paymentCardLeft}>
              <View style={styles.paymentIcon}>
                <MaterialIcons name="credit-card" size={24} color={EarthColors.earthDarker} />
              </View>
              <View style={styles.paymentInfo}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.paymentTitle}>
                  Tarjeta de Crédito
                </ThemedText>
                <ThemedText 
                  lightColor={EarthColors.earthDark} 
                  darkColor={EarthColors.grayEarth} 
                  style={styles.paymentSubtitle}>
                  Paga con tu tarjeta de crédito
                </ThemedText>
              </View>
            </View>
            <MaterialIcons 
              name="chevron-right" 
              size={24} 
              color={EarthColors.earthDark} 
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedMethod && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={false}
          activeOpacity={0.8}>
          <ThemedText 
            lightColor={EarthColors.beigeBone} 
            darkColor={EarthColors.beigeBone} 
            style={styles.continueButtonText}>
            Enviar Pago
          </ThemedText>
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentCardSelected: {
    borderWidth: 2,
    borderColor: EarthColors.earthPrimary,
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: EarthColors.grayMedium || '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  bankDetailsContainer: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 20,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 0,
    marginRight: 0,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionsSection: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  bankInfoList: {
    marginTop: 12,
  },
  bankInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  bankInfoLabel: {
    fontSize: 14,
    flex: 1,
  },
  bankInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  uploadSection: {
    marginTop: 8,
  },
  uploadArea: {
    flexDirection: 'row',
    marginTop: 12,
  },
  uploadedImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: EarthColors.beigeLight,
    marginRight: 12,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: EarthColors.blackSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: EarthColors.grayMedium || '#E5E5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: EarthColors.beigeLight,
  },
  uploadPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
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
  continueButton: {
    backgroundColor: EarthColors.blackSoft,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: EarthColors.grayMedium || '#E5E5E5',
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.beigeBone,
  },
});

