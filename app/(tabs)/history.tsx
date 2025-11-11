import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { EarthColors } from '@/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface PurchaseHistory {
  id: string;
  route: string;
  origin: string;
  destination: string;
  date: string;
  cooperative: string;
  price: string;
  busImage: any; // Imagen local o URL de la API
}

export default function HistoryScreen() {
  // Datos de ejemplo - en el futuro vendrán de la API
  const purchaseHistory: PurchaseHistory[] = [
    {
      id: '1',
      route: 'Lima - Cusco',
      origin: 'Lima',
      destination: 'Cusco',
      date: '12/03/2024',
      cooperative: 'Cooperativa Cruz del Sur',
      price: '$25.00',
      busImage: require('@/assets/images/bus-placeholder.jpg'),
    },
    {
      id: '2',
      route: 'Cusco - Arequipa',
      origin: 'Cusco',
      destination: 'Arequipa',
      date: '10/28/2023',
      cooperative: 'Cooperativa Tepsa',
      price: '$20.00',
      busImage: require('@/assets/images/bus-placeholder.jpg'),
    },
    {
      id: '3',
      route: 'Arequipa - Puno',
      origin: 'Arequipa',
      destination: 'Puno',
      date: '09/15/2023',
      cooperative: 'Cooperativa Oltursa',
      price: '$15.00',
      busImage: require('@/assets/images/bus-placeholder.jpg'),
    },
    {
      id: '4',
      route: 'Puno - Lima',
      origin: 'Puno',
      destination: 'Lima',
      date: '08/02/2023',
      cooperative: 'Cooperativa Movil Tours',
      price: '$30.00',
      busImage: require('@/assets/images/bus-placeholder.jpg'),
    },
  ];

  const handleViewTicket = (purchase: PurchaseHistory) => {
    // Navegar a la pantalla de detalle del ticket
    router.push({
      pathname: '/ticket-detail',
      params: {
        origin: purchase.origin,
        destination: purchase.destination,
        seat: 'A12', // En el futuro vendrá de los datos del ticket
        date: purchase.date,
        time: '10:00 AM', // En el futuro vendrá de los datos del ticket
        passenger: 'Isabella Rodriguez', // En el futuro vendrá de los datos del ticket
        cooperative: purchase.cooperative,
        bus: 'Bus #456', // En el futuro vendrá de los datos del ticket
        ticketId: purchase.id,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Historial de Compras" showBackButton={false} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Purchase History List */}
        {purchaseHistory.map((purchase) => (
          <View key={purchase.id} style={styles.purchaseCard}>
            {/* Bus Image */}
            <View style={styles.busImageContainer}>
              <Image 
                source={purchase.busImage} 
                style={styles.busImage}
                resizeMode="cover"
              />
            </View>
            
            {/* Purchase Info */}
            <View style={styles.purchaseInfo}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.routeText}>
                {purchase.route}
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.dateText}>
                {purchase.date}
              </ThemedText>
              <ThemedText 
                lightColor={EarthColors.earthDark} 
                darkColor={EarthColors.grayEarth} 
                style={styles.cooperativeText}>
                {purchase.cooperative}
              </ThemedText>
            </View>
            
            {/* Price and View Ticket */}
            <View style={styles.priceSection}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.priceText}>
                {purchase.price}
              </ThemedText>
              <TouchableOpacity
                onPress={() => handleViewTicket(purchase)}
                activeOpacity={0.7}>
                <ThemedText 
                  lightColor={EarthColors.bluePrimary} 
                  darkColor={EarthColors.blueLight} 
                  style={styles.viewTicketText}>
                  Ver Boleto
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  purchaseCard: {
    flexDirection: 'row',
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  busImageContainer: {
    width: 80,
    height: 80,
    marginRight: 12,
  },
  busImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  purchaseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  cooperativeText: {
    fontSize: 14,
  },
  priceSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  viewTicketText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
