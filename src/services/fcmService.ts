import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { apiClient } from '../config/api';

class FCMService {
  private fcmToken: string | null = null;

  /**
   * Request notification permission and get the FCM device token.
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('FCM permission granted:', authStatus);
      } else {
        console.log('FCM permission denied');
      }
      return enabled;
    } catch (error) {
      console.error('FCM requestPermission error:', error);
      return false;
    }
  }

  /**
   * Get the FCM device token.
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('FCM getToken error:', error);
      return null;
    }
  }

  /**
   * Register FCM token with the Laravel backend.
   */
  async registerTokenWithBackend(): Promise<boolean> {
    try {
      if (!this.fcmToken) {
        await this.getToken();
      }
      if (!this.fcmToken) {
        console.log('No FCM token available');
        return false;
      }

      const response = await apiClient.post('/patient/fcm-token', {
        fcm_token: this.fcmToken,
      });
      console.log('FCM token registered with backend:', response.data);
      return true;
    } catch (error: any) {
      console.error('Failed to register FCM token:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Full initialization: request permission → get token → send to backend.
   */
  async initialize(): Promise<void> {
    const permitted = await this.requestPermission();
    if (!permitted) return;

    await this.getToken();
    await this.registerTokenWithBackend();

    // Listen for token refresh
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      this.fcmToken = newToken;
      await this.registerTokenWithBackend();
    });
  }

  /**
   * Handle foreground messages — called when the app is open.
   */
  onForegroundMessage(callback: (remoteMessage: any) => void) {
    return messaging().onMessage(callback);
  }

  /**
   * Handle notification opened from background state.
   */
  onNotificationOpenedApp(callback: (remoteMessage: any) => void) {
    messaging().onNotificationOpenedApp(callback);
  }

  /**
   * Check if app was opened from a quit-state notification.
   */
  async getInitialNotification(): Promise<any | null> {
    return messaging().getInitialNotification();
  }

  /**
   * Unregister the FCM token from the backend.
   */
  async unregisterToken(): Promise<boolean> {
    try {
      await apiClient.delete('/patient/fcm-token');
      this.fcmToken = null;
      console.log('FCM token unregistered');
      return true;
    } catch (error: any) {
      console.error('Failed to unregister FCM token:', error.response?.data || error.message);
      return false;
    }
  }
}

export const fcmService = new FCMService();
export default fcmService;
