import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { PermissionStatus } from 'expo-modules-core';
import { Platform } from 'react-native';
import { AuthService } from './auth.service';

const EAS_PROJECT_ID = '0f0e2810-b144-420f-b837-52c85b738152';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface AppointmentNotificationData {
  username: string;
  service: string;
  time: string;
  isPartialPayment?: boolean;
  remainingAmount?: number;
}

export class NotificationService {
  // Request notification permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Register for push notifications (for future use)
  static async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      let token: string | null = null;

      if (Platform.OS === 'android') {
        // Ensure Android channel exists before scheduling notifications
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return null;
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })).data;
      } catch (tokenError) {
        console.warn('Failed to get Expo push token with projectId, retrying without it', tokenError);
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }

      return token || null;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Send appointment confirmation notification
  static async sendAppointmentConfirmation(data: AppointmentNotificationData): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return;
      }

      // Format time to HH:00 format
      const formatTime = (time: string): string => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const displayHour = hour.toString().padStart(2, '0');
        return `${displayHour}:00`;
      };

      // Create the main message
      let message = `${data.username}! Tu ${data.service} ha sido confirmado a las ${formatTime(data.time)}`;

      // Add partial payment reminder if applicable
      if (data.isPartialPayment && data.remainingAmount) {
        const formattedAmount = new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
        }).format(data.remainingAmount);
        message += `\n\nRecuerda pagar el restante de ${formattedAmount} en la barbería`;
      }

      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Cita Confirmada!',
          body: message,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      console.log('Appointment confirmation notification sent');
    } catch (error) {
      console.error('Error sending appointment confirmation notification:', error);
    }
  }

  // Send test notification
  static async sendTestNotification(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from The Royal Barber App',
          sound: true,
        },
        trigger: null,
      });

      console.log('Test notification sent');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Cancel all notifications
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  // Get notification permissions status
  static async getPermissionsStatus(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('Error getting notification permissions:', error);
      return {
        status: PermissionStatus.UNDETERMINED,
        granted: false,
        canAskAgain: true,
        expires: 'never',
      };
    }
  }

  // Register push token with API
  static async registerPushTokenWithAPI(expoPushToken: string): Promise<boolean> {
    try {
      const response = await AuthService.registerPushToken(expoPushToken);
      if (!response.success) {
        console.error('Failed to register push token with API:', response.error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error registering push token with API:', error);
      return false;
    }
  }

  // Complete setup: get push token and send to API
  static async setupPushNotifications(): Promise<boolean> {
    try {
      const expoPushToken = await this.registerForPushNotificationsAsync();
      if (!expoPushToken) {
        return false;
      }
      return await this.registerPushTokenWithAPI(expoPushToken);
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      return false;
    }
  }
}
