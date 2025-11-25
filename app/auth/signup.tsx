import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';
import Colors from '@/constants/Colors';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { formatPhoneAsTyping, isValidPhoneNumber } from '@/helpers/phoneFormatter';

const PASSWORD_REQUIREMENTS_TEXT =
  'La contraseña debe tener al menos 8 caracteres e incluir letras, números y un carácter especial (ej. @ !).';

const isPasswordValid = (value: string) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !phone || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!isPasswordValid(password)) {
      Alert.alert('Error', PASSWORD_REQUIREMENTS_TEXT);
      return;
    }

    // Validate phone number format for Twilio compatibility
    if (!isValidPhoneNumber(phone)) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido en formato internacional (ej: +1234567890)');
      return;
    }

    setIsLoading(true);
    try {
      const success = await signUp(email, password, firstName, lastName, phone);
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Ocurrió un error al crear la cuenta');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  const navigateToWelcome = () => {
    router.push('/auth/welcome');
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LinearGradient
            colors={[Colors.dark.background, Colors.dark.tint]}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={navigateToWelcome}
                >
                  <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>The Royal Barber</Text>
                <Text style={styles.subtitle}>Crea tu cuenta</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nombre</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Tu nombre"
                    placeholderTextColor={Colors.dark.textLight}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Apellido</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Tu apellido"
                    placeholderTextColor={Colors.dark.textLight}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={(text) => setPhone(formatPhoneAsTyping(text))}
                    placeholder="+52 (123) 456-7890"
                    placeholderTextColor={Colors.dark.textLight}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                  {/* Helper and warning text for phone format */}
                  <Text style={styles.helperText}>
                    Incluye el código de país, por ejemplo: +52 123 456 7890
                  </Text>
                  {phone.length > 0 && !isValidPhoneNumber(phone) && (
                    <Text style={styles.warningText}>
                      Formato inválido. Usa el formato internacional: +52 123 456 7890
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Correo electrónico</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor={Colors.dark.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Contraseña</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.dark.textLight}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <Text style={styles.helperText}>{PASSWORD_REQUIREMENTS_TEXT}</Text>
                  {password.length > 0 && !isPasswordValid(password) && (
                    <Text style={styles.warningText}>
                      Tu contraseña aún no cumple con todos los requisitos.
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmar contraseña</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.dark.textLight}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Text>
                </TouchableOpacity>

                {/* Legal Links */}
                <View style={styles.legalContainer}>
                  <Text style={styles.legalText}>
                    Al crear una cuenta, aceptas nuestros{' '}
                    <Text 
                      style={styles.legalLink}
                      onPress={() => Linking.openURL('https://theroyalbarber.com/terms')}
                    >
                      Términos de Servicio
                    </Text>
                    {' '}y{' '}
                    <Text 
                      style={styles.legalLink}
                      onPress={() => Linking.openURL('https://theroyalbarber.com/privacy')}
                    >
                      Política de Privacidad
                    </Text>
                  </Text>
                </View>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={navigateToLogin}
                >
                  <Text style={styles.secondaryButtonText}>
                    ¿Ya tienes cuenta? Inicia sesión
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textLight,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.dark.gray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  button: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.gray,
  },
  dividerText: {
    color: Colors.dark.textLight,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    position: 'relative',
    bottom: 16,
    left: 0,
  },
  backButtonText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: Colors.dark.textLight,
    marginTop: 4,
    marginLeft: 2,
  },
  warningText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 2,
    marginLeft: 2,
  },
  notificationText: {
    fontSize: 12,
    color: Colors.dark.primary,
    marginTop: 4,
    marginLeft: 2,
    fontStyle: 'italic',
  },
  legalContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  legalText: {
    fontSize: 11,
    color: Colors.dark.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: Colors.dark.primary,
    textDecorationLine: 'underline',
  },
}); 
