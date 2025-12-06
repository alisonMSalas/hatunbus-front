import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverHeader } from '@/components/ui/driver-header';
import { API_BASE_URL } from '@/constants/api';
import { EarthColors } from '@/constants/theme';
import { getJsonWithAuth, postJsonWithAuth, putJsonWithAuth, deleteWithAuth } from '@/services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type ExpenseCategory = 'FUEL' | 'TOLL' | 'MEALS' | 'MAINTENANCE' | 'PARKING' | 'OTHER';

interface TripExpense {
  id: string;
  tripId: string;
  driverId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptImageBase64?: string;
  createdAt: string;
  tripRoute?: string;
  driverName?: string;
  busPlate?: string;
}

interface Trip {
  id: string;
  status: 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED';
  frequency?: {
    route: {
      origin: string;
      destination: string;
    };
  };
  frequencySegment?: {
    route: {
      origin: string;
      destination: string;
    };
  };
}

const CATEGORIES = [
  { key: 'FUEL', label: 'Gasolina', icon: 'local-gas-station', color: '#E97451' },
  { key: 'TOLL', label: 'Peajes', icon: 'toll', color: '#16A34A' },
  { key: 'MEALS', label: 'Viáticos', icon: 'restaurant', color: EarthColors.bluePrimary },
  { key: 'MAINTENANCE', label: 'Mantenimiento', icon: 'build', color: '#7C3AED' },
  { key: 'PARKING', label: 'Estacionamiento', icon: 'local-parking', color: '#EC4899' },
  { key: 'OTHER', label: 'Otros', icon: 'more-horiz', color: EarthColors.blackSoft },
] as const;

export default function ExpensesScreen() {
  const [tripInProgress, setTripInProgress] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('FUEL');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      // Limpiar datos anteriores primero
      setExpenses([]);
      
      // Cargar viaje en curso
      const tripResp = await getJsonWithAuth<Trip>(`${API_BASE_URL}/viajes/conductor/en-curso`);
      console.log('Trip loaded in expenses:', tripResp);
      console.log('Trip status:', tripResp?.status);
      setTripInProgress(tripResp);

      if (tripResp?.id) {
        // Cargar gastos del viaje actual
        const expensesResp = await getJsonWithAuth<TripExpense[]>(
          `${API_BASE_URL}/gastos-viaje/viaje/${tripResp.id}`
        );
        setExpenses(expensesResp || []);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'No se pudieron cargar los gastos');
      setExpenses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a las fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageBase64(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Se necesita permiso para usar la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageBase64(result.assets[0].base64);
    }
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setSelectedCategory('FUEL');
    setAmount('');
    setDescription('');
    setImageBase64(undefined);
    setShowAddModal(true);
  };

  const openEditModal = (expense: TripExpense) => {
    setEditingExpense(expense);
    setSelectedCategory(expense.category);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    setImageBase64(expense.receiptImageBase64);
    setShowAddModal(true);
  };

  const handleSaveExpense = async () => {
    if (!tripInProgress) {
      Alert.alert('Error', 'No hay viaje en curso');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Ingrese una descripción');
      return;
    }

    setSaving(true);
    try {
      const expenseData = {
        tripId: tripInProgress.id,
        category: selectedCategory,
        amount: parseFloat(amount),
        description: description.trim(),
        receiptImageBase64: imageBase64,
      };

      if (editingExpense) {
        // Actualizar gasto existente
        await putJsonWithAuth(`${API_BASE_URL}/gastos-viaje/${editingExpense.id}`, expenseData);
        Alert.alert('Éxito', 'Gasto actualizado correctamente');
      } else {
        // Crear nuevo gasto
        await postJsonWithAuth(`${API_BASE_URL}/gastos-viaje`, expenseData);
        Alert.alert('Éxito', 'Gasto registrado correctamente');
      }
      
      // Reset form
      setEditingExpense(null);
      setAmount('');
      setDescription('');
      setImageBase64(undefined);
      setSelectedCategory('FUEL');
      setShowAddModal(false);
      
      // Reload expenses
      await loadData();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    Alert.alert(
      'Eliminar Gasto',
      '¿Está seguro que desea eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWithAuth(`${API_BASE_URL}/gastos-viaje/${expenseId}`);
              Alert.alert('Éxito', 'Gasto eliminado correctamente');
              await loadData();
            } catch (error: any) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar el gasto');
            }
          },
        },
      ]
    );
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const routeName = tripInProgress?.frequency?.route
    ? `${tripInProgress.frequency.route.origin} → ${tripInProgress.frequency.route.destination}`
    : tripInProgress?.frequencySegment?.route
    ? `${tripInProgress.frequencySegment.route.origin} → ${tripInProgress.frequencySegment.route.destination}`
    : 'Viaje en curso';

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <DriverHeader title="Gastos del Viaje" showBackButton={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EarthColors.earthPrimary} />
        </View>
      </ThemedView>
    );
  }

  if (!tripInProgress || tripInProgress.status !== 'IN_PROGRESS') {
    return (
      <ThemedView style={styles.container}>
        <DriverHeader title="Gastos del Viaje" showBackButton={false} />
        <View style={styles.emptyContainer}>
          <MaterialIcons name="money-off" size={64} color={EarthColors.grayEarth} />
          <ThemedText style={styles.emptyText}>
            No hay viaje en curso
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Inicia un viaje para registrar gastos
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <DriverHeader title="Gastos del Viaje" showBackButton={false} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Trip Info Card */}
        <View style={styles.tripCard}>
          <ThemedText style={styles.tripRoute}>{routeName}</ThemedText>
          <View style={styles.totalContainer}>
            <ThemedText style={styles.totalLabel}>Total Gastos:</ThemedText>
            <ThemedText style={styles.totalAmount}>${totalExpenses.toFixed(2)}</ThemedText>
          </View>
        </View>

        {/* Add Expense Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <MaterialIcons name="add-circle" size={24} color={EarthColors.whiteBone} />
          <ThemedText style={styles.addButtonText}>Agregar Gasto</ThemedText>
        </TouchableOpacity>

        {/* Expenses List */}
        <View style={styles.expensesContainer}>
          <ThemedText style={styles.sectionTitle}>
            Gastos Registrados ({expenses.length})
          </ThemedText>
          
          {expenses.length === 0 ? (
            <View style={styles.emptyExpenses}>
              <MaterialIcons name="receipt-long" size={48} color={EarthColors.grayEarth} />
              <ThemedText style={styles.emptyExpensesText}>
                No hay gastos registrados
              </ThemedText>
            </View>
          ) : (
            expenses.map((expense) => {
              const categoryInfo = CATEGORIES.find(c => c.key === expense.category);
              return (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryInfo?.color }]}>
                      <MaterialIcons name={categoryInfo?.icon as any} size={20} color={EarthColors.whiteBone} />
                      <ThemedText style={styles.categoryText}>{categoryInfo?.label}</ThemedText>
                    </View>
                    <ThemedText style={styles.expenseAmount}>${expense.amount.toFixed(2)}</ThemedText>
                  </View>
                  <ThemedText style={styles.expenseDescription}>{expense.description}</ThemedText>
                  {expense.receiptImageBase64 && (
                    <View style={styles.receiptBadge}>
                      <MaterialIcons name="photo" size={16} color={EarthColors.earthPrimary} />
                      <ThemedText style={styles.receiptText}>Recibo adjunto</ThemedText>
                    </View>
                  )}
                  <View style={styles.expenseFooter}>
                    <ThemedText style={styles.expenseDate}>
                      {new Date(expense.createdAt).toLocaleString('es-EC', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </ThemedText>
                    <View style={styles.expenseActions}>
                      <TouchableOpacity onPress={() => openEditModal(expense)} style={styles.actionButton}>
                        <MaterialIcons name="edit" size={20} color={EarthColors.earthDark} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteExpense(expense.id)} style={styles.actionButton}>
                        <MaterialIcons name="delete" size={20} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}</ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color={EarthColors.blackSoft} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Category Selection */}
              <ThemedText style={styles.inputLabel}>Categoría</ThemedText>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryButton,
                      selectedCategory === cat.key && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCategory(cat.key as ExpenseCategory)}
                  >
                    <MaterialIcons
                      name={cat.icon as any}
                      size={24}
                      color={selectedCategory === cat.key ? EarthColors.whiteBone : cat.color}
                    />
                    <ThemedText
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === cat.key && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount */}
              <ThemedText style={styles.inputLabel}>Monto ($)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />

              {/* Description */}
              <ThemedText style={styles.inputLabel}>Descripción</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ej: Gasolina en Ambato"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              {/* Receipt Image */}
              <ThemedText style={styles.inputLabel}>Recibo (Opcional)</ThemedText>
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <MaterialIcons name="camera-alt" size={24} color={EarthColors.earthPrimary} />
                  <ThemedText style={styles.imageButtonText}>Tomar Foto</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <MaterialIcons name="photo-library" size={24} color={EarthColors.earthPrimary} />
                  <ThemedText style={styles.imageButtonText}>Galería</ThemedText>
                </TouchableOpacity>
              </View>
              {imageBase64 && (
                <View style={styles.imagePreview}>
                  <MaterialIcons name="check-circle" size={20} color={EarthColors.earthPrimary} />
                  <ThemedText style={styles.imagePreviewText}>Imagen cargada</ThemedText>
                  <TouchableOpacity onPress={() => setImageBase64(undefined)}>
                    <MaterialIcons name="delete" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveExpense}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={EarthColors.whiteBone} />
              ) : (
                <ThemedText style={styles.saveButtonText}>{editingExpense ? 'Actualizar' : 'Guardar'}</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EarthColors.whiteBone,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: EarthColors.blackSoft,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: EarthColors.grayEarth,
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  tripCard: {
    backgroundColor: EarthColors.whiteBone,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EarthColors.earthPrimary,
    elevation: 2,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: EarthColors.blackSoft,
    marginBottom: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: EarthColors.earthLight + '20',
    padding: 12,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: EarthColors.blackSoft,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: EarthColors.earthPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EarthColors.earthPrimary,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    color: EarthColors.whiteBone,
    fontSize: 16,
    fontWeight: '600',
  },
  expensesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: EarthColors.blackSoft,
    marginBottom: 16,
  },
  emptyExpenses: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyExpensesText: {
    fontSize: 14,
    color: EarthColors.grayEarth,
    marginTop: 12,
  },
  expenseCard: {
    backgroundColor: EarthColors.whiteBone,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: EarthColors.grayMedium,
    elevation: 1,
    shadowColor: EarthColors.blackSoft,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    color: EarthColors.whiteBone,
    fontSize: 12,
    fontWeight: '600',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: EarthColors.blackSoft,
  },
  expenseDescription: {
    fontSize: 14,
    color: EarthColors.blackSoft,
    marginTop: 8,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  receiptText: {
    fontSize: 12,
    color: EarthColors.earthPrimary,
    fontStyle: 'italic',
  },
  expenseDate: {
    fontSize: 12,
    color: EarthColors.grayEarth,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: EarthColors.whiteBone,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: EarthColors.grayMedium,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: EarthColors.blackSoft,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: EarthColors.grayMedium + '50',
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: EarthColors.grayLight,
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: EarthColors.blackSoft,
    marginBottom: 8,
    marginTop: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: EarthColors.grayMedium,
    backgroundColor: EarthColors.whiteBone,
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: EarthColors.blackSoft,
  },
  categoryButtonTextActive: {
    color: EarthColors.whiteBone,
  },
  input: {
    backgroundColor: EarthColors.whiteBone,
    borderWidth: 1,
    borderColor: EarthColors.grayMedium,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: EarthColors.blackSoft,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EarthColors.earthLight + '30',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: EarthColors.earthPrimary,
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EarthColors.earthLight + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  imagePreviewText: {
    flex: 1,
    fontSize: 12,
    color: EarthColors.earthPrimary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: EarthColors.earthPrimary,
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: EarthColors.whiteBone,
    fontSize: 16,
    fontWeight: '700',
  },
});
