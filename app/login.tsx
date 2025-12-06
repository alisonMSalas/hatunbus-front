import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedTextInput } from '@/components/ui/text-input';
import { EarthColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const { login } = useAuth();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Ingresa un correo electronico valido');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Redirect to index, which will handle navigation based on auth state
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Credenciales incorrectas o error del servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.logoContainer}>
            <Image source={require('@/assets/images/hatunbus-removebg-preview.png')} style={styles.logo} resizeMode="contain" />
          </ThemedView>

          <ThemedView style={styles.headerContainer}>
            <ThemedText type="title" lightColor={EarthColors.earthDarker} darkColor={EarthColors.beigeLight} style={styles.title}>
              Bienvenido de nuevo
            </ThemedText>
            <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.beigeMedium} style={styles.subtitle}>
              Inicia sesión en tu cuenta
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.formContainer}>
            <ThemedTextInput placeholder="Email o Usuario" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />

            <View style={styles.passwordContainer}>
              <ThemedTextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="password" textContentType="password" containerStyle={styles.passwordInputContainer} style={styles.passwordInput} />
              <Pressable style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <IconSymbol name={showPassword ? 'eye.slash' : 'eye'} size={22} color={colorScheme === 'dark' ? EarthColors.grayEarth : EarthColors.earthPrimary} />
              </Pressable>
            </View>

            <Button title={isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'} onPress={handleLogin} style={styles.loginButton} disabled={isLoading} />

            <ThemedView style={styles.signUpContainer}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.beigeMedium} style={styles.signUpText}>
                ¿Nuevo en HatunBus?{' '}
              </ThemedText>
              <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
                <ThemedText type="link" style={styles.signUpLink}>
                  Regístrate
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EarthColors.beigeBone,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 40,
    backgroundColor: EarthColors.beigeBone,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    width: 200,
    height: 200,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    opacity: 0.75,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  passwordContainer: {
    position: 'relative',
    marginVertical: 8,
  },
  passwordInputContainer: {
    marginVertical: 0,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    height: 24,
    width: 24,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    marginTop: 24,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
  },
});

