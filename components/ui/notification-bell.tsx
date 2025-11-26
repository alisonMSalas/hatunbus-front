import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { EarthColors } from '@/constants/theme';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, isConnected } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleNotificationPress = (purchaseId: string) => {
    markAsRead(purchaseId);
    setShowModal(false);
    // Aquí puedes navegar a la pantalla de tickets o historial
  };

  return (
    <>
      {/* Ícono de campana con badge */}
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => setShowModal(true)}
        accessibilityLabel="Notificaciones"
      >
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
        {!isConnected && (
          <View style={styles.disconnectedDot} />
        )}
      </TouchableOpacity>

      {/* Modal de notificaciones */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Notificaciones {unreadCount > 0 && `(${unreadCount})`}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Lista de notificaciones */}
            <ScrollView style={styles.notificationsList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No tienes notificaciones</Text>
                </View>
              ) : (
                notifications.map((notification, index) => (
                  <TouchableOpacity
                    key={`${notification.purchaseId}-${index}`}
                    style={[
                      styles.notificationItem,
                      !(notification as any).read && styles.unreadItem,
                    ]}
                    onPress={() => handleNotificationPress(notification.purchaseId)}
                  >
                    {/* Ícono según tipo */}
                    <View
                      style={[
                        styles.notificationIcon,
                        notification.type === 'APPROVED'
                          ? styles.approvedIcon
                          : styles.rejectedIcon,
                      ]}
                    >
                      <Ionicons
                        name={
                          notification.type === 'APPROVED'
                            ? 'checkmark-circle'
                            : 'close-circle'
                        }
                        size={24}
                        color="#fff"
                      />
                    </View>

                    {/* Contenido */}
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      {notification.reason && (
                        <Text style={styles.notificationReason}>
                          Razón: {notification.reason}
                        </Text>
                      )}
                      <Text style={styles.notificationAmount}>
                        Monto: ${notification.amount.toFixed(2)}
                      </Text>
                    </View>

                    {/* Indicador de no leído */}
                    {!(notification as any).read && (
                      <View style={styles.unreadDot} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Estado de conexión */}
            <View style={styles.footer}>
              <View style={styles.connectionStatus}>
                <View
                  style={[
                    styles.statusDot,
                    isConnected ? styles.connectedDot : styles.disconnectedStatusDot,
                  ]}
                />
                <Text style={styles.statusText}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  disconnectedDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    minHeight: 200,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#f0f9ff',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  approvedIcon: {
    backgroundColor: '#4caf50',
  },
  rejectedIcon: {
    backgroundColor: '#f44336',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationReason: {
    fontSize: 13,
    color: '#f44336',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  notificationAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: EarthColors.earthPrimary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: EarthColors.bluePrimary,
    alignSelf: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectedDot: {
    backgroundColor: '#4caf50',
  },
  disconnectedStatusDot: {
    backgroundColor: '#ff9800',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
});
