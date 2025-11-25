import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NotificationService } from '@/services';
import Colors from '@/constants/Colors';

export default function NotificationStatus() {
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const status = await NotificationService.getPermissionsStatus();
      setPermissionStatus(status.status);
    } catch (error) {
      setPermissionStatus('error');
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await NotificationService.requestPermissions();
      setPermissionStatus(granted ? 'granted' : 'denied');
    } catch (error) {
      setPermissionStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return Colors.dark.success;
      case 'denied':
        return Colors.dark.error;
      case 'error':
        return Colors.dark.error;
      default:
        return Colors.dark.textLight;
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notificaciones habilitadas';
      case 'denied':
        return 'Notificaciones denegadas';
      case 'error':
        return 'Error al verificar permisos';
      default:
        return 'Verificando permisos...';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      {permissionStatus === 'denied' && (
        <TouchableOpacity style={styles.enableButton} onPress={requestPermissions}>
          <Text style={styles.enableButtonText}>Habilitar Notificaciones</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.dark.tint,
    borderRadius: 8,
    margin: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: Colors.dark.text,
    fontSize: 14,
    flex: 1,
  },
  enableButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  enableButtonText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: '600',
  },
});
