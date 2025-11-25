import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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
      let token;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return null;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);
      } else {
        console.log('Must use physical device for Push Notifications');
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
      return { status: 'undetermined' };
    }
  }
}

// Import Device from expo-device for push notifications
import * as Device from 'expo-device';
