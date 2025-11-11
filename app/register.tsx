import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedTextInput } from '@/components/ui/text-input';
import { EarthColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const colorScheme = useColorScheme();

  const handleRegister = () => {
    // Aquí irá la lógica de registro
    console.log('Registrarse:', { fullName, email, password, confirmPassword });
  };

  const handleLogin = () => {
    // Navegar a la pantalla de login
    router.push('/login');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header fijo */}
      <Header title="Registro" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Título con logo y subtítulo */}
          <ThemedView style={styles.headerContainer}>
            <ThemedView style={styles.titleRow}>
              <Image
                source={require('@/assets/images/hatunbus2-removebg.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <ThemedText 
                type="title" 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.title}>
                Crear cuenta
              </ThemedText>
            </ThemedView>
            <ThemedText 
              lightColor={EarthColors.earthDark} 
              darkColor={EarthColors.beigeMedium} 
              style={styles.subtitle}>
              Completa los datos para registrarte
            </ThemedText>
          </ThemedView>

          {/* Campos de entrada */}
          <ThemedView style={styles.formContainer}>
            {/* Nombre completo */}
            <ThemedView style={styles.fieldContainer}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.label}>
                Nombre completo
              </ThemedText>
              <ThemedTextInput
                placeholder="Ingresa tu nombre completo"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                containerStyle={styles.inputContainer}
              />
            </ThemedView>

            {/* Email */}
            <ThemedView style={styles.fieldContainer}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.label}>
                Email
              </ThemedText>
              <ThemedTextInput
                placeholder="Ingresa tu email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                containerStyle={styles.inputContainer}
              />
            </ThemedView>

            {/* Contraseña */}
            <ThemedView style={styles.fieldContainer}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.label}>
                Contraseña
              </ThemedText>
              <View style={styles.passwordContainer}>
                <ThemedTextInput
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  containerStyle={[styles.inputContainer, styles.passwordInputContainer]}
                  style={styles.passwordInput}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}>
                  <IconSymbol
                    name={showPassword ? 'eye.slash' : 'eye'}
                    size={22}
                    color={colorScheme === 'dark' ? EarthColors.grayEarth : EarthColors.earthPrimary}
                  />
                </Pressable>
              </View>
            </ThemedView>

            {/* Confirmar contraseña */}
            <ThemedView style={styles.fieldContainer}>
              <ThemedText 
                lightColor={EarthColors.earthDarker} 
                darkColor={EarthColors.beigeLight} 
                style={styles.label}>
                Confirmar contraseña
              </ThemedText>
              <View style={styles.passwordContainer}>
                <ThemedTextInput
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  containerStyle={[styles.inputContainer, styles.passwordInputContainer]}
                  style={styles.passwordInput}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <IconSymbol
                    name={showConfirmPassword ? 'eye.slash' : 'eye'}
                    size={22}
                    color={colorScheme === 'dark' ? EarthColors.grayEarth : EarthColors.earthPrimary}
                  />
                </Pressable>
              </View>
            </ThemedView>

            {/* Botón de registro */}
            <Button
              title="Registrarse"
              onPress={handleRegister}
              style={styles.registerButton}
            />

            {/* Enlace de login */}
            <ThemedView style={styles.loginContainer}>
              <ThemedText lightColor={EarthColors.earthDark} darkColor={EarthColors.beigeMedium} style={styles.loginText}>
                ¿Ya tienes una cuenta?{' '}
              </ThemedText>
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
                <ThemedText type="link" style={styles.loginLink}>Inicia sesión</ThemedText>
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
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: EarthColors.beigeBone,
  },
  headerContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  title: {
    letterSpacing: -0.5,
  },
  subtitle: {
    opacity: 0.75,
    lineHeight: 22,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    marginVertical: 0,
  },
  passwordContainer: {
    position: 'relative',
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
  registerButton: {
    width: '100%',
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
  },
});

