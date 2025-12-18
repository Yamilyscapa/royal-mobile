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

  // Get current push token (useful for checking if token changed)
  static async getCurrentPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
        return tokenData.data;
      } catch (tokenError) {
        console.warn('Failed to get Expo push token with projectId, retrying without it', tokenError);
        const tokenData = await Notifications.getExpoPushTokenAsync();
        return tokenData.data;
      }
    } catch (error) {
      console.error('Error getting current push token:', error);
      return null;
    }
  }
}
