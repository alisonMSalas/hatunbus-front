import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { ThemedTextInput } from '@/components/ui/text-input';
import { EarthColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/constants/api';
import { getJsonWithAuth, putJsonWithAuth } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';

interface UserProfile {
  id: string;
  firstNames: string;
  lastNames: string;
  idCard: string;
  email: string;
  phone: string;
  role: string;
  birthDate: string | null;
  gender: string | null;
  profilePhoto: string | null;
}

export default function ProfileScreen() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    firstNames: '',
    lastNames: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
  });

  // Change Password Modal
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getJsonWithAuth(`${API_BASE_URL}/perfil`);
      setProfile(data);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    if (!profile) return;
    setEditData({
      firstNames: profile.firstNames,
      lastNames: profile.lastNames,
      email: profile.email,
      phone: profile.phone || '',
      birthDate: profile.birthDate || '',
      gender: profile.gender || '',
    });
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      // Validar que todos los campos estén llenos
      if (!editData.firstNames || editData.firstNames.trim() === '') {
        Alert.alert('Error', 'Los nombres son obligatorios');
        return;
      }
      if (!editData.lastNames || editData.lastNames.trim() === '') {
        Alert.alert('Error', 'Los apellidos son obligatorios');
        return;
      }
      if (!editData.email || editData.email.trim() === '') {
        Alert.alert('Error', 'El email es obligatorio');
        return;
      }
      if (!editData.phone || editData.phone.trim() === '') {
        Alert.alert('Error', 'El teléfono es obligatorio');
        return;
      }
      if (!editData.birthDate || editData.birthDate === '') {
        Alert.alert('Error', 'La fecha de nacimiento es obligatoria');
        return;
      }
      if (!editData.gender || editData.gender === '') {
        Alert.alert('Error', 'El género es obligatorio');
        return;
      }

      const updated = await putJsonWithAuth(`${API_BASE_URL}/perfil`, editData);
      setProfile(updated);
      setIsEditModalVisible(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || 'No se pudo actualizar el perfil';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleChangePassword = async () => {
    // Validaciones
    if (!passwordData.currentPassword || passwordData.currentPassword.trim() === '') {
      Alert.alert('Error', 'La contraseña actual es obligatoria');
      return;
    }

    if (!passwordData.newPassword || passwordData.newPassword.trim() === '') {
      Alert.alert('Error', 'La nueva contraseña es obligatoria');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!passwordData.confirmPassword || passwordData.confirmPassword.trim() === '') {
      Alert.alert('Error', 'Debes confirmar la nueva contraseña');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      await putJsonWithAuth(`${API_BASE_URL}/perfil/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setIsPasswordModalVisible(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      Alert.alert('Éxito', 'Contraseña cambiada correctamente');
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || 'No se pudo cambiar la contraseña';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSelectPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permisos para acceder a tus fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${API_BASE_URL}/perfil/foto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la foto');
      }

      const updated = await response.json();
      setProfile(updated);
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setTempDate(selectedDate);

      // Formatear la fecha a YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      setEditData({...editData, birthDate: formattedDate});

      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleOpenDatePicker = () => {
    // Si ya hay una fecha seleccionada, usarla; si no, usar la fecha actual
    if (editData.birthDate && editData.birthDate !== '') {
      const [year, month, day] = editData.birthDate.split('-');
      setTempDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else {
      setTempDate(new Date(2000, 0, 1)); // Fecha por defecto: 1 de enero de 2000
    }
    setShowDatePicker(true);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'COOPERATIVE': return 'Cooperativa';
      case 'CLERK': return 'Oficinista';
      case 'DRIVER': return 'Conductor';
      case 'CLIENT': return 'Cliente';
      default: return role;
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Perfil" showBackButton={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.blackSoft} />
          <ThemedText style={styles.loadingText}>Cargando perfil...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Perfil" showBackButton={false} />
        <View style={styles.loadingContainer}>
          <ThemedText>No se pudo cargar el perfil</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
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
              {profile.profilePhoto ? (
                <Image
                  source={{ uri: profile.profilePhoto }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <MaterialIcons name="person" size={60} color={EarthColors.earthDark} />
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={EarthColors.whiteBone} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleSelectPhoto}
              activeOpacity={0.7}
              disabled={uploadingPhoto}>
              <MaterialIcons name="camera-alt" size={20} color={EarthColors.whiteBone} />
            </TouchableOpacity>
          </View>

          {/* User Name */}
          <ThemedText
            lightColor={EarthColors.earthDarker}
            darkColor={EarthColors.beigeLight}
            style={styles.userName}>
            {profile.firstNames} {profile.lastNames}
          </ThemedText>

          {/* User Email */}
          <ThemedText
            lightColor={EarthColors.earthDark}
            darkColor={EarthColors.grayEarth}
            style={styles.userEmail}>
            {profile.email}
          </ThemedText>

          {/* User Role */}
          <View style={styles.roleBadge}>
            <ThemedText
              lightColor={EarthColors.earthDarker}
              darkColor={EarthColors.beigeLight}
              style={styles.roleText}>
              {getRoleLabel(profile.role)}
            </ThemedText>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}>
            <MaterialIcons name="edit" size={20} color={EarthColors.whiteBone} />
            <ThemedText style={styles.editButtonText}>Editar Perfil</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={styles.menuCard}>
          {/* Personal Information */}
          <View style={styles.infoSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsInfoExpanded(!isInfoExpanded)}
              activeOpacity={0.7}>
              <ThemedText style={styles.sectionTitle}>Información Personal</ThemedText>
              <MaterialIcons
                name={isInfoExpanded ? "expand-less" : "expand-more"}
                size={24}
                color={EarthColors.earthDark}
              />
            </TouchableOpacity>

            {isInfoExpanded && (
              <>
                <View style={styles.infoRow}>
                  <MaterialIcons name="badge" size={20} color={EarthColors.earthDark} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Cédula</ThemedText>
                    <ThemedText style={styles.infoValue}>{profile.idCard}</ThemedText>
                  </View>
                </View>

                {profile.phone && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="phone" size={20} color={EarthColors.earthDark} />
                    <View style={styles.infoContent}>
                      <ThemedText style={styles.infoLabel}>Teléfono</ThemedText>
                      <ThemedText style={styles.infoValue}>{profile.phone}</ThemedText>
                    </View>
                  </View>
                )}

                {profile.birthDate && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="cake" size={20} color={EarthColors.earthDark} />
                    <View style={styles.infoContent}>
                      <ThemedText style={styles.infoLabel}>Fecha de Nacimiento</ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {(() => {
                          const [year, month, day] = profile.birthDate.split('-');
                          const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                          return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
                        })()}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {profile.gender && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="wc" size={20} color={EarthColors.earthDark} />
                    <View style={styles.infoContent}>
                      <ThemedText style={styles.infoLabel}>Género</ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {profile.gender === 'M' ? 'Masculino' : profile.gender === 'F' ? 'Femenino' : 'Otro'}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsPasswordModalVisible(true)}
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
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Editar Perfil</ThemedText>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={EarthColors.earthDarker} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Nombres</ThemedText>
                <ThemedTextInput
                  value={editData.firstNames}
                  onChangeText={(text) => setEditData({...editData, firstNames: text})}
                  placeholder="Nombres"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Apellidos</ThemedText>
                <ThemedTextInput
                  value={editData.lastNames}
                  onChangeText={(text) => setEditData({...editData, lastNames: text})}
                  placeholder="Apellidos"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Email</ThemedText>
                <ThemedTextInput
                  value={editData.email}
                  onChangeText={(text) => setEditData({...editData, email: text})}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Teléfono</ThemedText>
                <ThemedTextInput
                  value={editData.phone}
                  onChangeText={(text) => setEditData({...editData, phone: text})}
                  placeholder="Teléfono"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Fecha de Nacimiento</ThemedText>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={handleOpenDatePicker}
                  activeOpacity={0.7}>
                  <MaterialIcons name="calendar-today" size={20} color={EarthColors.earthDark} />
                  <ThemedText style={styles.datePickerText}>
                    {editData.birthDate ? (() => {
                      const [year, month, day] = editData.birthDate.split('-');
                      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                      return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
                    })() : 'Seleccionar fecha'}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Género</ThemedText>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editData.gender === 'M' && styles.genderButtonSelected
                    ]}
                    onPress={() => setEditData({...editData, gender: 'M'})}
                    activeOpacity={0.7}>
                    <ThemedText style={[
                      styles.genderButtonText,
                      editData.gender === 'M' && styles.genderButtonTextSelected
                    ]}>
                      Masculino
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editData.gender === 'F' && styles.genderButtonSelected
                    ]}
                    onPress={() => setEditData({...editData, gender: 'F'})}
                    activeOpacity={0.7}>
                    <ThemedText style={[
                      styles.genderButtonText,
                      editData.gender === 'F' && styles.genderButtonTextSelected
                    ]}>
                      Femenino
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editData.gender === 'O' && styles.genderButtonSelected
                    ]}
                    onPress={() => setEditData({...editData, gender: 'O'})}
                    activeOpacity={0.7}>
                    <ThemedText style={[
                      styles.genderButtonText,
                      editData.gender === 'O' && styles.genderButtonTextSelected
                    ]}>
                      Otro
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* DateTimePicker */}
            {showDatePicker && Platform.OS === 'ios' && (
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}>
                <View style={styles.datePickerModalOverlay}>
                  <View style={styles.datePickerModalContent}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <ThemedText style={styles.datePickerDone}>Listo</ThemedText>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      locale="es-ES"
                      maximumDate={new Date()}
                    />
                  </View>
                </View>
              </Modal>
            )}

            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditModalVisible(false)}>
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}>
                <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={isPasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsPasswordModalVisible(false);
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Cambiar Contraseña</ThemedText>
              <TouchableOpacity onPress={() => {
                setIsPasswordModalVisible(false);
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
              }}>
                <MaterialIcons name="close" size={24} color={EarthColors.earthDarker} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Contraseña Actual</ThemedText>
                <View style={styles.passwordInputContainer}>
                  <ThemedTextInput
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                    placeholder="Contraseña actual"
                    secureTextEntry={!showCurrentPassword}
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    activeOpacity={0.7}>
                    <MaterialIcons
                      name={showCurrentPassword ? "visibility" : "visibility-off"}
                      size={24}
                      color={EarthColors.earthDark}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Nueva Contraseña</ThemedText>
                <View style={styles.passwordInputContainer}>
                  <ThemedTextInput
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                    secureTextEntry={!showNewPassword}
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    activeOpacity={0.7}>
                    <MaterialIcons
                      name={showNewPassword ? "visibility" : "visibility-off"}
                      size={24}
                      color={EarthColors.earthDark}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Confirmar Contraseña</ThemedText>
                <View style={styles.passwordInputContainer}>
                  <ThemedTextInput
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                    placeholder="Confirmar nueva contraseña"
                    secureTextEntry={!showConfirmPassword}
                    style={styles.passwordInput}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}>
                    <MaterialIcons
                      name={showConfirmPassword ? "visibility" : "visibility-off"}
                      size={24}
                      color={EarthColors.earthDark}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsPasswordModalVisible(false);
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}>
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleChangePassword}>
                <ThemedText style={styles.saveButtonText}>Cambiar</ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: EarthColors.earthDark,
  },
  userCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
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
    position: 'relative',
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
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: EarthColors.earthPrimary + '20',
    marginBottom: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.blackSoft,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: EarthColors.whiteBone,
    fontSize: 16,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: EarthColors.whiteBone,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EarthColors.earthDarker,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: EarthColors.earthDark,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: EarthColors.earthDarker,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
    color: EarthColors.earthDarker,
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
    color: EarthColors.earthDarker,
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
    color: EarthColors.earthDarker,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: EarthColors.blackSoft,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.beigeBone,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: EarthColors.grayMedium || '#E5E5E5',
    backgroundColor: EarthColors.whiteBone,
    alignItems: 'center',
  },
  genderButtonSelected: {
    borderColor: EarthColors.blackSoft,
    backgroundColor: EarthColors.blackSoft,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: EarthColors.earthDarker,
  },
  genderButtonTextSelected: {
    color: EarthColors.whiteBone,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.whiteBone,
    borderWidth: 1.5,
    borderColor: EarthColors.grayMedium || '#E5E5E5',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: EarthColors.earthDarker,
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: EarthColors.whiteBone,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.beigeMedium || '#E8DFD5',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.blackSoft,
  },
  passwordInputContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
});
