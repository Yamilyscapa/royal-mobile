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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';
import Colors from '@/constants/Colors';
import ScreenWrapper from '@/components/ui/ScreenWrapper';

const PASSWORD_REQUIREMENTS_TEXT =
  'La contraseña debe tener al menos 8 caracteres e incluir letras, números y un carácter especial (ej. @ !).';

const isPasswordValid = (value: string) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);

export default function RecoverScreen() {
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestPasswordRecovery, resetPasswordWithCode } = useAuth();

  const handleRequestCode = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Ingresa tu correo o teléfono asociado a la cuenta.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await requestPasswordRecovery(identifier.trim());
      if (success) {
        Alert.alert(
          'Código enviado',
          'Si la cuenta existe, enviamos un código de recuperación a tu correo o teléfono.'
        );
        setStep('verify');
      } else {
        Alert.alert('Error', 'No pudimos enviar el código. Inténtalo de nuevo en unos minutos.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al solicitar el código.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Ingresa el código de recuperación.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Ingresa y confirma tu nueva contraseña.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (!isPasswordValid(newPassword)) {
      Alert.alert('Error', PASSWORD_REQUIREMENTS_TEXT);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await resetPasswordWithCode(identifier.trim(), code.trim(), newPassword);
      if (success) {
        Alert.alert('Listo', 'Tu contraseña fue actualizada.');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Código inválido o expirado. Intenta nuevamente.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/auth/login');
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
                  onPress={navigateToLogin}
                >
                  <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Recuperar contraseña</Text>
                <Text style={styles.subtitle}>
                  Usa el código que guardaste en tu perfil o el que te enviamos por correo/teléfono.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Correo o teléfono</Text>
                  <TextInput
                    style={styles.input}
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="tu@email.com o +52 123 456 7890"
                    placeholderTextColor={Colors.dark.textLight}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    editable={!isSubmitting}
                  />
                </View>

                {step === 'verify' && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Código de recuperación</Text>
                      <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={setCode}
                        placeholder="Ingresa el código"
                        placeholderTextColor={Colors.dark.textLight}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Nueva contraseña</Text>
                      <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="••••••••"
                        placeholderTextColor={Colors.dark.textLight}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!isSubmitting}
                      />
                      <Text style={styles.helperText}>{PASSWORD_REQUIREMENTS_TEXT}</Text>
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
                        editable={!isSubmitting}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.button, isSubmitting && styles.buttonDisabled]}
                  onPress={step === 'request' ? handleRequestCode : handleResetPassword}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting
                      ? 'Enviando...'
                      : step === 'request'
                        ? 'Enviar código'
                        : 'Restablecer contraseña'}
                  </Text>
                </TouchableOpacity>

                {step === 'request' && (
                  <Text style={styles.helperTextCentered}>
                    Te enviaremos un código único. Si ya guardaste uno desde tu perfil, úsalo aquí directamente. Si no recibes nada, revisa spam o intenta de nuevo.
                  </Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
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
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'relative',
    bottom: 12,
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
    lineHeight: 16,
  },
  helperTextCentered: {
    fontSize: 12,
    color: Colors.dark.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});
