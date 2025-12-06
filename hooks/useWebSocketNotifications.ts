import { useEffect, useRef, useState } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import * as Notifications from 'expo-notifications';
import { API_BASE_URL } from '../constants/api';

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface PaymentNotification {
  purchaseId: string;
  type: 'APPROVED' | 'REJECTED' | 'WARNING';
  title: string;
  message: string;
  amount: number;
  reason?: string;
}

export const useWebSocketNotifications = (userId: string | null) => {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Solicitar permisos de notificaciones
    requestNotificationPermissions();

    // Crear cliente STOMP con SockJS
    const wsUrl = API_BASE_URL.replace('/api', '/ws');
    console.log('WebSocket URL:', wsUrl);

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      
      onConnect: () => {
        setIsConnected(true);

        // Suscribirse al tópico personal del usuario
        const subscription = client.subscribe(
          `/topic/user/${userId}`,
          (message) => {
            try {
              const notification: PaymentNotification = JSON.parse(message.body);
              
              // Agregar a la lista de notificaciones
              setNotifications((prev) => [notification, ...prev]);
              
              // Mostrar notificación push
              showPushNotification(notification);
              
            } catch (error) {
            }
          }
        );

        subscriptionRef.current = subscription;
      },

      onStompError: (frame) => {
        setIsConnected(false);
      },

      onWebSocketError: (event) => {
        setIsConnected(false);
      },

      onDisconnect: () => {
        setIsConnected(false);
      },

      // Reconexión automática
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.activate();
    clientRef.current = client;

    // Cleanup al desmontar
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [userId]);

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }
    return true;
  };

  const showPushNotification = async (notification: PaymentNotification) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: { 
            purchaseId: notification.purchaseId,
            type: notification.type 
          },
          sound: true,
          badge: 1,
        },
        trigger: null, // Mostrar inmediatamente
      });
    } catch (error) {
    }
  };

  const markAsRead = (purchaseId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.purchaseId === purchaseId ? { ...n, read: true } : n
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    isConnected,
    notifications,
    unreadCount: notifications.filter((n) => !(n as any).read).length,
    markAsRead,
    clearNotifications,
  };
};
