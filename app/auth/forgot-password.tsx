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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { AuthService } from '@/services';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.requestPasswordReset(email);
      // Always show success for security (even if email doesn't exist)
      setIsSuccess(true);
      
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/auth/login');
    }
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
                <Text style={styles.title}>
                  {isSuccess ? 'Correo Enviado' : 'Recuperar Contraseña'}
                </Text>
                <Text style={styles.subtitle}>
                  {isSuccess 
                    ? 'Hemos enviado las instrucciones a tu correo' 
                    : 'Ingresa tu correo electrónico para recibir instrucciones'}
                </Text>
              </View>

              {isSuccess ? (
                <View style={styles.successContainer}>
                  <View style={styles.iconContainer}>
                    <FontAwesome name="envelope-o" size={80} color={Colors.dark.primary} />
                  </View>
                  <Text style={styles.successText}>
                    Si tu correo existe en nuestro sistema, recibirás un código para restablecer tu contraseña.
                  </Text>
                  <Text style={styles.successSubtext}>
                    Por favor revisa tu bandeja de entrada y copia el código.
                  </Text>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace('/auth/reset-password')}
                  >
                    <Text style={styles.buttonText}>Ingresar Código</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.form}>
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
                      editable={!isLoading}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.haveCodeButton}
                    onPress={() => router.push('/auth/reset-password')}
                  >
                    <Text style={styles.haveCodeText}>
                      ¿Ya tienes un código?
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, (isLoading || !email) && styles.buttonDisabled]}
                    onPress={handleRequestReset}
                    disabled={isLoading || !email}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Enviando...' : 'Enviar enlace'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
    marginBottom: 48,
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
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
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
    marginTop: 12,
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
  haveCodeButton: {
    alignSelf: 'flex-end',
    marginTop: -12,
    marginBottom: 12,
  },
  haveCodeText: {
    color: Colors.dark.textLight,
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 0,
    zIndex: 10,
  },
  backButtonText: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  successText: {
    fontSize: 16,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  successSubtext: {
    fontSize: 14,
    color: Colors.dark.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
});
