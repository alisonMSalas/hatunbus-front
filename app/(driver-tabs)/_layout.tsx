import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors, EarthColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getJsonWithAuth } from '@/services/api';
import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

interface Trip {
  id: string;
  status: 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED';
}

export default function DriverTabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [hasTripInProgress, setHasTripInProgress] = useState(false);

  const checkTripStatus = useCallback(async () => {
    // ONLY check trip status if user is a DRIVER
    if (!user || user.role !== 'DRIVER') {
      setHasTripInProgress(false);
      return;
    }

    try {
      const trip = await getJsonWithAuth<Trip>(`${API_BASE_URL}/viajes/conductor/en-curso`);
      console.log('Trip status check:', trip);
      const hasTrip = trip && trip.status === 'IN_PROGRESS';
      console.log('Has trip in progress:', hasTrip);
      setHasTripInProgress(hasTrip);
    } catch (error) {
      console.log('Error checking trip status:', error);
      setHasTripInProgress(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      checkTripStatus();
      const interval = setInterval(checkTripStatus, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }, [checkTripStatus])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconSelected,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: EarthColors.whiteBone,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          elevation: 8,
          shadowColor: EarthColors.blackSoft,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="passengers"
        options={{
          title: 'Pasajeros',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="attach-money" size={24} color={color} />
          ),
          href: hasTripInProgress ? '/(driver-tabs)/expenses' : null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="history" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

