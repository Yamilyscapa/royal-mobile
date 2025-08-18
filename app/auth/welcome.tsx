import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useAuth } from '@/components/auth/AuthContext';
import * as SecureStore from 'expo-secure-store';
import ScreenWrapper from '@/components/ui/ScreenWrapper';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { clearStorage, markWelcomeAsSeen } = useAuth();

  const handleLogin = async () => {
    // Marcar la pantalla de bienvenida como vista
    await markWelcomeAsSeen();
    router.push('/auth/login');
  };

  const handleSignUp = async () => {
    // Marcar la pantalla de bienvenida como vista
    await markWelcomeAsSeen();
    router.push('/auth/signup');
  };

  const handleClearStorage = async () => {
    await clearStorage();
    // This will redirect to welcome screen since no user is authenticated
  };

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={[Colors.dark.background, Colors.dark.tint]}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>The Royal Barber</Text>
            <Text style={styles.subtitle}>
              Tu barbería de confianza
            </Text>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/icon_transparent.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.description}>
            <Text style={styles.descriptionText}>
              Reserva tu cita de manera fácil y rápida.
              Disfruta de los mejores servicios de barbería.
            </Text>
            <Text style={styles.descriptionSubtext}>
              Para continuar, inicia sesión o crea tu cuenta
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSignUp}
            >
              <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLogin}
            >
              <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Links */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              Al continuar, aceptas nuestros{' '}
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
        </View>
      </LinearGradient>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.dark.textLight,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
  },
  description: {
    alignItems: 'center',
    marginBottom: 40,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.dark.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  descriptionSubtext: {
    fontSize: 14,
    color: Colors.dark.primary,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  secondaryButtonText: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  legalContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  legalText: {
    fontSize: 12,
    color: Colors.dark.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.dark.primary,
    textDecorationLine: 'underline',
  },
}); 