import React, { useState } from 'react';
import { StyleSheet, View, Alert, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '@/contexts/AuthContext';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/ui/text-input';
import { Button } from '@/components/ui/button';
import { EarthColors } from '@/constants/theme';
import { register as registerService } from '@/services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [firstNames, setFirstNames] = useState('');
  const [lastNames, setLastNames] = useState('');
  const [idCard, setIdCard] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // Role is fixed to CLIENT for registrations from the mobile app
  const role: 'CLIENT' = 'CLIENT';
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<'M' | 'F' | 'O'>('M');
  const [loading, setLoading] = useState(false);

  const { login: loginContext } = useAuth();

  async function onSubmit() {
    if (!firstNames || !lastNames || !idCard || !password || !email) {
      Alert.alert('Error', 'Completa los campos obligatorios (incluye email)');
      return;
    }

    setLoading(true);
    try {
      const created = await registerService({
        firstNames,
        lastNames,
        idCard,
        email: email || undefined,
        phone: phone || undefined,
        password,
        role: 'CLIENT',
        birthDate,
        gender,
      });

      // Auto-login after successful registration
      try {
        await loginContext(email, password);
        // Navigate into app
        router.replace('/(tabs)');
      } catch (loginErr) {
        // If auto-login fails, fallback to login screen
        Alert.alert('Registrado', `Usuario creado: ${created.email || created.idCard}. Inicia sesión para continuar.`);
        router.replace('/login');
      }
    } catch (e: any) {
      console.error('Register error', e);
      Alert.alert('Error', e?.message || 'No fue posible registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Registro</ThemedText>

        <ThemedTextInput placeholder="Nombres" value={firstNames} onChangeText={setFirstNames} />
        <ThemedTextInput placeholder="Apellidos" value={lastNames} onChangeText={setLastNames} />
        <ThemedTextInput placeholder="Cédula (10 dígitos)" value={idCard} onChangeText={setIdCard} keyboardType="number-pad" />
        <ThemedTextInput placeholder="Email (obligatorio)" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <ThemedTextInput placeholder="Teléfono (10 dígitos)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <ThemedTextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

        <ThemedText type="subtitle" style={{ marginTop: 8 }}>Fecha de nacimiento</ThemedText>
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePressable}>
          <ThemedText style={styles.dateText}>{birthDate}</ThemedText>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(birthDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const y = selectedDate.getFullYear();
                const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const d = String(selectedDate.getDate()).padStart(2, '0');
                setBirthDate(`${y}-${m}-${d}`);
              }
            }}
          />
        )}

        <ThemedText type="subtitle" style={{ marginTop: 8 }}>Género</ThemedText>
        <View style={styles.rolesRow}>
          <Button title="Masculino" onPress={() => setGender('M')} style={gender === 'M' ? styles.roleActive : styles.roleBtn} />
          <Button title="Femenino" onPress={() => setGender('F')} style={gender === 'F' ? styles.roleActive : styles.roleBtn} />
        </View>

        <Button title={loading ? 'Registrando...' : 'Registrar'} onPress={onSubmit} style={styles.registerBtn} disabled={loading} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  content: { gap: 12 },
  rolesRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  roleBtn: { paddingHorizontal: 8 },
  roleActive: { paddingHorizontal: 8, backgroundColor: EarthColors.earthPrimary },
  registerBtn: { marginTop: 16 },
  datePressable: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    marginTop: 8,
    backgroundColor: 'white',
  },
  dateText: {
    color: '#333',
  },
});


