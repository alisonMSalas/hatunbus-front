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

  // Error states
  const [errors, setErrors] = useState({
    firstNames: '',
    lastNames: '',
    idCard: '',
    email: '',
    phone: '',
    password: '',
  });

  const { login: loginContext } = useAuth();

  // Validación de cédula ecuatoriana
  const validateEcuadorianId = (id: string): boolean => {
    if (id.length !== 10) return false;
    if (!/^\d+$/.test(id)) return false;

    const province = parseInt(id.substring(0, 2));
    if (province < 1 || province > 24) return false;

    const digits = id.split('').map(Number);
    const verifier = digits[9];

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = digits[i];
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }

    const calculatedVerifier = (10 - (sum % 10)) % 10;
    return verifier === calculatedVerifier;
  };

  // Validación de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para validar un campo específico
  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'firstNames':
        if (!value.trim()) error = 'Los nombres son obligatorios';
        break;
      case 'lastNames':
        if (!value.trim()) error = 'Los apellidos son obligatorios';
        break;
      case 'idCard':
        if (!value.trim()) {
          error = 'La cédula es obligatoria';
        } else if (value.length !== 10) {
          error = 'La cédula debe tener 10 dígitos';
        } else if (!/^\d+$/.test(value)) {
          error = 'La cédula solo debe contener números';
        } else if (!validateEcuadorianId(value)) {
          error = 'Cédula ecuatoriana inválida';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'El email es obligatorio';
        } else if (!validateEmail(value)) {
          error = 'Email inválido';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'El teléfono es obligatorio';
        } else if (value.length !== 10) {
          error = 'El teléfono debe tener 10 dígitos';
        } else if (!/^\d+$/.test(value)) {
          error = 'El teléfono solo debe contener números';
        }
        break;
      case 'password':
        if (!value.trim()) {
          error = 'La contraseña es obligatoria';
        } else if (value.length < 8) {
          error = 'La contraseña debe tener al menos 8 caracteres';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  // Validar todos los campos
  const validateAllFields = (): boolean => {
    const fields = {
      firstNames,
      lastNames,
      idCard,
      email,
      phone,
      password,
    };

    let isValid = true;
    Object.entries(fields).forEach(([key, value]) => {
      if (!validateField(key, value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  async function onSubmit() {
    // Validar todos los campos
    if (!validateAllFields()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      const created = await registerService({
        firstNames,
        lastNames,
        idCard,
        email,
        phone,
        password,
        role: 'CLIENT',
        birthDate,
        gender,
      });

      // Auto-login after successful registration
      try {
        await loginContext(email, password);
        // Navigate into app
        router.replace('/');
      } catch (loginErr) {
        // If auto-login fails, fallback to login screen
        Alert.alert('Registrado', `Usuario creado: ${created.email || created.idCard}. Inicia sesión para continuar.`);
        router.replace('/login');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No fue posible registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Registro</ThemedText>

        <View>
          <ThemedTextInput 
            placeholder="Nombres *" 
            value={firstNames} 
            onChangeText={(text) => {
              setFirstNames(text);
              validateField('firstNames', text);
            }}
            onBlur={() => validateField('firstNames', firstNames)}
          />
          {errors.firstNames ? <ThemedText style={styles.errorText}>{errors.firstNames}</ThemedText> : null}
        </View>

        <View>
          <ThemedTextInput 
            placeholder="Apellidos *" 
            value={lastNames} 
            onChangeText={(text) => {
              setLastNames(text);
              validateField('lastNames', text);
            }}
            onBlur={() => validateField('lastNames', lastNames)}
          />
          {errors.lastNames ? <ThemedText style={styles.errorText}>{errors.lastNames}</ThemedText> : null}
        </View>

        <View>
          <ThemedTextInput 
            placeholder="Cédula (10 dígitos) *" 
            value={idCard} 
            onChangeText={(text) => {
              setIdCard(text);
              validateField('idCard', text);
            }}
            onBlur={() => validateField('idCard', idCard)}
            keyboardType="number-pad" 
            maxLength={10}
          />
          {errors.idCard ? <ThemedText style={styles.errorText}>{errors.idCard}</ThemedText> : null}
        </View>

        <View>
          <ThemedTextInput 
            placeholder="Email *" 
            value={email} 
            onChangeText={(text) => {
              setEmail(text);
              validateField('email', text);
            }}
            onBlur={() => validateField('email', email)}
            keyboardType="email-address" 
            autoCapitalize="none"
          />
          {errors.email ? <ThemedText style={styles.errorText}>{errors.email}</ThemedText> : null}
        </View>

        <View>
          <ThemedTextInput 
            placeholder="Teléfono (10 dígitos) *" 
            value={phone} 
            onChangeText={(text) => {
              setPhone(text);
              validateField('phone', text);
            }}
            onBlur={() => validateField('phone', phone)}
            keyboardType="phone-pad" 
            maxLength={10}
          />
          {errors.phone ? <ThemedText style={styles.errorText}>{errors.phone}</ThemedText> : null}
        </View>

        <View>
          <ThemedTextInput 
            placeholder="Contraseña (mínimo 8 caracteres) *" 
            value={password} 
            onChangeText={(text) => {
              setPassword(text);
              validateField('password', text);
            }}
            onBlur={() => validateField('password', password)}
            secureTextEntry 
          />
          {errors.password ? <ThemedText style={styles.errorText}>{errors.password}</ThemedText> : null}
        </View>

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
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});


