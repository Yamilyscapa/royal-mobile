import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';

export default function LoadingScreen() {
  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.tint]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>The Royal Barber</Text>
        <ActivityIndicator size="large" color={Colors.dark.primary} style={styles.spinner} />
        <Text style={styles.subtitle}>Cargando...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textLight,
  },
}); 