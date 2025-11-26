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
  type: 'APPROVED' | 'REJECTED';
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
      console.log('❌ No hay userId, no se conecta WebSocket');
      return;
    }

    console.log('🔌 Iniciando conexión WebSocket para usuario:', userId);

    // Solicitar permisos de notificaciones
    requestNotificationPermissions();

    // Crear cliente STOMP con SockJS
    const wsUrl = API_BASE_URL.replace('/api', '/ws');
    console.log('WebSocket URL:', wsUrl);

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      
      onConnect: () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);

        // Suscribirse al tópico personal del usuario
        const subscription = client.subscribe(
          `/topic/user/${userId}`,
          (message) => {
            console.log('📩 Mensaje recibido:', message.body);
            
            try {
              const notification: PaymentNotification = JSON.parse(message.body);
              
              // Agregar a la lista de notificaciones
              setNotifications((prev) => [notification, ...prev]);
              
              // Mostrar notificación push
              showPushNotification(notification);
              
            } catch (error) {
              console.error('Error al procesar notificación:', error);
            }
          }
        );

        subscriptionRef.current = subscription;
        console.log('✅ Suscrito a /topic/user/' + userId);
      },

      onStompError: (frame) => {
        console.error('❌ Error STOMP:', frame.headers['message']);
        console.error('Detalles:', frame.body);
        setIsConnected(false);
      },

      onWebSocketError: (event) => {
        console.error('❌ Error WebSocket:', event);
        setIsConnected(false);
      },

      onDisconnect: () => {
        console.log('🔌 WebSocket desconectado');
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
      console.log('🧹 Limpiando WebSocket...');
      
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
      console.warn('⚠️ Permisos de notificación denegados');
      return false;
    }

    console.log('✅ Permisos de notificación concedidos');
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

      console.log('✅ Push notification mostrada');
    } catch (error) {
      console.error('❌ Error al mostrar notificación:', error);
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
