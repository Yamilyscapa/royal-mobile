import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { AuthService } from '@/services';
import { validatePasswordStrength } from '@/helpers/passwordValidator';

const PASSWORD_REQUIREMENTS_TEXT =
  'La contraseña debe tener al menos 8 caracteres e incluir letras, números y un carácter especial (ej. @ !).';

export default function ResetPasswordScreen() {
  const { token: paramToken } = useLocalSearchParams<{ token: string }>();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Initialize with deep link token if present
  useEffect(() => {
    if (paramToken) {
      const tokenString = Array.isArray(paramToken) ? paramToken[0] : paramToken;
      setToken(tokenString);
      verifyToken(tokenString);
    }
  }, [paramToken]);

  const verifyToken = async (tokenToVerify: string) => {
    if (!tokenToVerify) {
      setTokenError('Por favor ingresa el código de verificación');
      return;
    }

    setIsVerifying(true);
    setTokenError(null);

    try {
      const response = await AuthService.verifyResetToken(tokenToVerify);
      if (response.success && response.data?.valid) {
        setIsTokenVerified(true);
        setTokenError(null);
      } else {
        setIsTokenVerified(false);
        setTokenError('El código no es válido o ha expirado. Por favor verifica o solicita uno nuevo.');
      }
    } catch (error) {
      setTokenError('Ocurrió un error al verificar el código.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    const validationResult = validatePasswordStrength(password);
    if (!validationResult.isValid) {
      setPasswordErrors(validationResult.errors);
      return;
    }

    setIsLoading(true);
    setPasswordErrors([]);

    try {
      const response = await AuthService.resetPassword(token, password);
      if (response.success) {
        Alert.alert(
          'Éxito',
          'Tu contraseña ha sido actualizada correctamente',
          [
            {
              text: 'Iniciar Sesión',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'No se pudo restablecer la contraseña');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/auth/login');
  };

  const navigateToForgotPassword = () => {
    router.replace('/auth/forgot-password');
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
                <Text style={styles.title}>Restablecer Contraseña</Text>
                <Text style={styles.subtitle}>
                  {isTokenVerified 
                    ? 'Ingresa tu nueva contraseña'
                    : 'Ingresa el código que recibiste por correo'}
                </Text>
              </View>

              <View style={styles.form}>
                {/* Step 1: Token Entry */}
                <View style={styles.section}>
                  <Text style={styles.label}>Código de Verificación</Text>
                  <View style={styles.tokenContainer}>
                    <TextInput
                      style={[
                        styles.input, 
                        isTokenVerified && styles.inputSuccess,
                        !!tokenError && styles.inputError
                      ]}
                      value={token}
                      onChangeText={(text) => {
                        setToken(text);
                        setTokenError(null);
                        if (isTokenVerified) setIsTokenVerified(false);
                      }}
                      placeholder="Pega tu código aquí"
                      placeholderTextColor={Colors.dark.textLight}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isTokenVerified && !isVerifying}
                    />
                    {isTokenVerified && (
                      <View style={styles.checkmarkContainer}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </View>
                  
                  {!!tokenError && (
                    <Text style={styles.errorText}>{tokenError}</Text>
                  )}

                  {!isTokenVerified && (
                    <TouchableOpacity
                      style={[styles.verifyButton, (!token || isVerifying) && styles.buttonDisabled]}
                      onPress={() => verifyToken(token)}
                      disabled={!token || isVerifying}
                    >
                      {isVerifying ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.verifyButtonText}>Verificar Código</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Step 2: Password Entry (Only visible if token is verified) */}
                {isTokenVerified && (
                  <View style={styles.passwordSection}>
                    {passwordErrors.length > 0 && (
                      <View style={styles.errorContainer}>
                        {passwordErrors.map((error, index) => (
                          <Text key={index} style={styles.errorTextItem}>• {error}</Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Nueva Contraseña</Text>
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setPasswordErrors([]);
                        }}
                        placeholder="Ingresa nueva contraseña"
                        placeholderTextColor={Colors.dark.textLight}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                      <Text style={styles.helperText}>{PASSWORD_REQUIREMENTS_TEXT}</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Confirmar Contraseña</Text>
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirma nueva contraseña"
                        placeholderTextColor={Colors.dark.textLight}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.button, (isLoading || !password || !confirmPassword) && styles.buttonDisabled]}
                      onPress={handleResetPassword}
                      disabled={isLoading || !password || !confirmPassword}
                    >
                      <Text style={styles.buttonText}>
                        {isLoading ? 'Actualizando...' : 'Restablecer Contraseña'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={navigateToLogin}
                >
                  <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
                </TouchableOpacity>
                
                {!isTokenVerified && (
                  <TouchableOpacity
                    style={styles.tertiaryButton}
                    onPress={navigateToForgotPassword}
                  >
                    <Text style={styles.tertiaryButtonText}>¿No recibiste el código?</Text>
                  </TouchableOpacity>
                )}
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textLight,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  passwordSection: {
    marginTop: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  tokenContainer: {
    position: 'relative',
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
  inputSuccess: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  checkmarkContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: Colors.dark.tint,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 24,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  tertiaryButton: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: Colors.dark.textLight,
    fontSize: 14,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorTextItem: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.dark.textLight,
    marginTop: 4,
    marginLeft: 2,
  },
});
