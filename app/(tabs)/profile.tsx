import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { ThemedTextInput } from '@/components/ui/text-input';
import { EarthColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profileImage || null,
  });

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(userData.name);
  const [editEmail, setEditEmail] = useState(userData.email);

  // Actualizar datos cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || null,
      });
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [user]);

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
    setEditName(userData.name);
    setEditEmail(userData.email);
  };

  const handleSaveProfile = () => {
    setUserData({
      ...userData,
      name: editName,
      email: editEmail,
    });
    setIsEditModalVisible(false);
  };

  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    setEditName(userData.name);
    setEditEmail(userData.email);
  };

  const handleMenuOption = (option: string) => {
    console.log('Navegar a:', option);
    // Aquí irá la navegación a cada pantalla
    // router.push(`/${option}`);
  };

  const handleLogout = async () => {
    console.log('Cerrar sesión');
    await logout();
    router.replace('/login');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header title="Perfil" showBackButton={false} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* User Information Card */}
        <View style={styles.userCard}>
          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              {userData.profileImage ? (
                <Image 
                  source={{ uri: userData.profileImage }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <MaterialIcons name="person" size={60} color={EarthColors.earthDark} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}
              activeOpacity={0.7}>
              <MaterialIcons name="edit" size={16} color={EarthColors.beigeBone} />
            </TouchableOpacity>
          </View>

          {/* User Name */}
          <ThemedText 
            lightColor={EarthColors.earthDarker} 
            darkColor={EarthColors.beigeLight} 
            style={styles.userName}>
            {userData.name}
          </ThemedText>

          {/* User Email */}
          <ThemedText 
            lightColor={EarthColors.earthDark} 
            darkColor={EarthColors.grayEarth} 
            style={styles.userEmail}>
            {userData.email}
          </ThemedText>

          {/* User Role */}
          {user && (
            <View style={styles.roleBadge}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.roleText}>
                {user.role === 'driver' ? 'Conductor' : 'Pasajero'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Menu Options */}
        <View style={styles.menuCard}>
          {/* Personal Information */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuOption('personal-information')}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <MaterialIcons name="person" size={24} color={EarthColors.earthDarker} />
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.menuItemText}>
                Información Personal
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={EarthColors.earthDark} />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.menuItemLast}
            onPress={() => handleMenuOption('change-password')}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <MaterialIcons name="lock" size={24} color={EarthColors.earthDarker} />
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.menuItemText}>
                Cambiar Contraseña
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={EarthColors.earthDark} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <MaterialIcons name="logout" size={20} color="#DC2626" />
          <ThemedText 
            lightColor="#DC2626" 
            darkColor="#DC2626" 
            style={styles.logoutButtonText}>
            Cerrar Sesión
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.modalTitle}>
                Editar Perfil
              </ThemedText>
              <TouchableOpacity
                onPress={handleCancelEdit}
                activeOpacity={0.7}>
                <MaterialIcons name="close" size={24} color={EarthColors.earthDarker} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.inputLabel}>
                  Nombre Completo
                </ThemedText>
                <ThemedTextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Ingresa tu nombre"
                  containerStyle={styles.input}
                  placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.inputLabel}>
                  Correo Electrónico
                </ThemedText>
                <ThemedTextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Ingresa tu correo"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  containerStyle={styles.input}
                  placeholderTextColor={EarthColors.blackSoftOpacity || 'rgba(26, 26, 26, 0.6)'}
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                activeOpacity={0.7}>
                <ThemedText 
                  lightColor={EarthColors.earthDarker} 
                  darkColor={EarthColors.beigeLight} 
                  style={styles.cancelButtonText}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                activeOpacity={0.8}>
                <ThemedText 
                  lightColor={EarthColors.beigeBone} 
                  darkColor={EarthColors.beigeBone} 
                  style={styles.saveButtonText}>
                  Guardar
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  userCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
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
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: EarthColors.beigeLight,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: EarthColors.beigeLight,
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: EarthColors.blackSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: EarthColors.whiteBone,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: EarthColors.earthPrimary + '20',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  menuCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  menuItemLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2', // Rosa claro
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#DC2626', // Rojo
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: EarthColors.whiteBone,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: EarthColors.grayMedium || '#E5E5E5',
    backgroundColor: EarthColors.whiteBone,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: EarthColors.blackSoft,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.beigeBone,
  },
});
