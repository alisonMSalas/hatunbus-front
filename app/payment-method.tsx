import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { postJsonWithAuth } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

type PaymentMethod = 'transfer' | 'paypal' | null;

export default function PaymentMethodScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const ticketsData = params.ticketsData ? JSON.parse(params.ticketsData as string) : [];
  const totalPrice = params.totalPrice as string;
  const tripId = params.tripId as string;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);

  const handleMethodSelect = (method: PaymentMethod) => {
    if (selectedMethod === method) {
      setSelectedMethod(null);
    } else {
      setSelectedMethod(method);
      setUploadedImage(null); // Limpiar imagen al cambiar método
    }
  };

  const handleUploadImage = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para subir el comprobante');
        return;
      }

      // Abrir selector de imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo cargar la imagen');
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  const handleContinue = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Por favor selecciona un método de pago');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'No se encontró el usuario. Por favor inicia sesión nuevamente.');
      return;
    }

    if (selectedMethod === 'transfer' && !uploadedImage) {
      Alert.alert('Error', 'Por favor sube el comprobante de pago');
      return;
    }

    setIsLoading(true);

    try {
      if (selectedMethod === 'transfer') {
        // Para TRANSFERENCIA: Crear la compra inmediatamente
        const purchaseData = await postJsonWithAuth(`${API_BASE_URL}/compras`, {
          buyerUserId: user.id,
          purchaseType: 'ONLINE',
          paymentMethod: 'TRANSFER',
          tickets: ticketsData,
        });

        const purchaseId = purchaseData.id;
        await handleTransferPayment(purchaseId);

        // Mostrar mensaje de éxito para transferencia
        Alert.alert(
          'Pago procesado',
          'Tu comprobante ha sido enviado. El ticket estará disponible una vez que sea aprobado por un oficinista.'
        );

        // Redirigir automáticamente a la pantalla de tickets
        setTimeout(() => {
          router.replace('/(tabs)/tickets');
        }, 1500);
      } else if (selectedMethod === 'paypal') {
        // Para PAYPAL: NO crear compra aún, solo iniciar PayPal
        // La compra se creará cuando se capture el pago
        await initiatePayPalPayment();
      }
    } catch (error: any) {
      console.error('Error al procesar pago:', error);
      Alert.alert('Error', error.message || 'No se pudo procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferPayment = async (purchaseId: string) => {
    if (!uploadedImage) return;

    // Convertir imagen a base64
    const base64 = await FileSystem.readAsStringAsync(uploadedImage, {
      encoding: 'base64' as any,
    });

    // Enviar al backend con autenticación
    await postJsonWithAuth(`${API_BASE_URL}/payments/upload-receipt`, {
      purchaseId,
      receiptImageBase64: base64,
    });
  };

  const checkPaymentStatus = async (paypalOrderId: string): Promise<boolean> => {
    try {
      // Intentar capturar el pago automáticamente
      // Ahora enviamos buyerUserId y tickets en lugar de purchaseId
      const captureResponse = await postJsonWithAuth(`${API_BASE_URL}/payments/paypal/capture`, {
        paypalOrderId: paypalOrderId,
        buyerUserId: user?.id,
        tickets: ticketsData,
      });

      console.log('✅ Payment captured successfully!');
      return true;
    } catch (error: any) {
      // Si falla, el pago aún no está completo (esto es normal mientras el usuario paga)
      // 412 = ORDER_NOT_APPROVED (esperado mientras el usuario completa el pago)
      // Solo loguear si es un error diferente
      const errorStatus = error.status || error.response?.status;
      const errorMessage = error.message || '';

      if (errorStatus !== 412 && !errorMessage.includes('ORDER_NOT_APPROVED')) {
        console.log('⚠️ Unexpected error while checking payment:', errorMessage);
      }
      // No mostrar nada si es 412 o ORDER_NOT_APPROVED (usuario aún no ha completado el pago)
      return false;
    }
  };

  const initiatePayPalPayment = async () => {
    try {
      // Solicitar al backend que cree una orden de PayPal
      // Ya NO enviamos purchaseId, solo buyerUserId, amount y tickets
      const response = await postJsonWithAuth(`${API_BASE_URL}/payments/paypal/create-order`, {
        buyerUserId: user?.id,
        amount: totalPrice,
        tickets: ticketsData,
      });

      if (response.approvalUrl) {
        // Abrir PayPal en el navegador (no esperamos el resultado)
        WebBrowser.openBrowserAsync(response.approvalUrl);

        console.log('PayPal browser opened, starting payment monitoring...');

        // Mostrar indicador de espera
        setWaitingForPayment(true);
        Alert.alert(
          'Esperando pago',
          'Completa el pago en PayPal. El sistema detectará automáticamente cuando finalices.',
          [{ text: 'Entendido' }]
        );

        // Iniciar monitoreo del estado del pago cada 3 segundos
        const maxAttempts = 60; // 3 minutos máximo (60 * 3 segundos)
        let attempts = 0;
        let paymentCompleted = false;

        const checkInterval = setInterval(async () => {
          attempts++;
          // Solo loguear cada 10 intentos para no saturar la consola
          if (attempts % 10 === 0) {
            console.log(`🔍 Esperando pago... ${attempts * 3} segundos`);
          }

          // Verificar si el pago se completó
          const completed = await checkPaymentStatus(response.orderId);

          if (completed) {
            paymentCompleted = true;
            clearInterval(checkInterval);
            setIsLoading(false);
            setWaitingForPayment(false);

            // Mostrar mensaje de éxito
            Alert.alert('¡Pago exitoso!', 'Tu pago ha sido procesado. Redirigiendo a tus tickets...');

            // Redirigir a tickets
            setTimeout(() => {
              router.replace('/(tabs)/tickets');
            }, 1500);
          } else if (attempts >= maxAttempts) {
            // Timeout: preguntar manualmente
            clearInterval(checkInterval);
            setIsLoading(false);
            setWaitingForPayment(false);

            Alert.alert(
              'Verificar pago',
              '¿Completaste el pago en PayPal? No pudimos detectarlo automáticamente.',
              [
                {
                  text: 'No',
                  onPress: () => {
                    Alert.alert('Pago cancelado', 'Puedes intentar nuevamente cuando estés listo.');
                  },
                  style: 'cancel',
                },
                {
                  text: 'Sí, lo completé',
                  onPress: async () => {
                    // Intentar capturar una vez más
                    try {
                      await postJsonWithAuth(`${API_BASE_URL}/payments/paypal/capture`, {
                        paypalOrderId: response.orderId,
                        buyerUserId: user?.id,
                        tickets: ticketsData,
                      });

                      Alert.alert('Pago procesado', 'Tu pago ha sido confirmado.');
                      setTimeout(() => {
                        router.replace('/(tabs)/tickets');
                      }, 1500);
                    } catch (error: any) {
                      console.error('Error al capturar pago:', error);
                      Alert.alert('Error', 'No se pudo completar el pago. Contacta con soporte.');
                    }
                  },
                },
              ]
            );
          }
        }, 3000); // Verificar cada 3 segundos
      } else {
        throw new Error('No se recibió URL de aprobación de PayPal');
      }
    } catch (error: any) {
      console.error('Error al iniciar pago de PayPal:', error);
      Alert.alert('Error', 'No se pudo iniciar el pago con PayPal');
      setIsLoading(false);
    }
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
                selectedMethod === 'transfer' && styles.paymentCardSelected
              ]}
              onPress={() => handleMethodSelect('transfer')}
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
                    Transferencia Bancaria
                  </ThemedText>
                  <ThemedText 
                    lightColor={EarthColors.earthDark} 
                    darkColor={EarthColors.grayEarth} 
                    style={styles.paymentSubtitle}>
                    Pago pendiente hasta aprobación
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons 
                name={selectedMethod === 'transfer' ? "expand-more" : "chevron-right"} 
                size={24} 
                color={EarthColors.earthDark} 
              />
            </TouchableOpacity>

            {/* Upload Receipt */}
            {selectedMethod === 'transfer' && (
              <View style={styles.bankDetailsContainer}>
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
                    Sube una foto de tu comprobante. El ticket estará pendiente hasta que sea aprobado por un oficinista.
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
                        Subir Comprobante
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* PayPal Option */}
          <TouchableOpacity
            style={[
              styles.paymentCard,
              selectedMethod === 'paypal' && styles.paymentCardSelected
            ]}
            onPress={() => handleMethodSelect('paypal')}
            activeOpacity={0.7}>
            <View style={styles.paymentCardLeft}>
              <View style={styles.paymentIcon}>
                <MaterialIcons name="payment" size={24} color={EarthColors.earthDarker} />
              </View>
              <View style={styles.paymentInfo}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.paymentTitle}>
                  PayPal (Sandbox)
                </ThemedText>
                <ThemedText 
                  lightColor={EarthColors.earthDark} 
                  darkColor={EarthColors.grayEarth} 
                  style={styles.paymentSubtitle}>
                  Pago automático - Modo prueba
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

      {/* Waiting for Payment Indicator */}
      {waitingForPayment && (
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="large" color={EarthColors.earthPrimary} />
          <ThemedText style={styles.waitingText}>
            Esperando confirmación del pago...
          </ThemedText>
          <ThemedText style={styles.waitingSubtext}>
            El sistema detectará automáticamente cuando completes el pago en PayPal
          </ThemedText>
        </View>
      )}

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedMethod || isLoading) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedMethod || isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color={EarthColors.beigeBone} />
          ) : (
            <ThemedText 
              lightColor={EarthColors.beigeBone} 
              darkColor={EarthColors.beigeBone} 
              style={styles.continueButtonText}>
              {selectedMethod === 'transfer' ? 'Subir Comprobante' : 'Pagar con PayPal'}
            </ThemedText>
          )}
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
  waitingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  waitingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: EarthColors.whiteBone,
    textAlign: 'center',
  },
  waitingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: EarthColors.beigeLight,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

