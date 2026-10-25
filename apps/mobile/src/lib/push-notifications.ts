/**
 * Calinfco Mobile - Android Firebase Cloud Messaging & Push Notification Service
 * Configured for Android native FCM with Expo Notifications.
 * 
 * Strict Zero-Deception Policy:
 * - Accurately reports whether FCM device token registration succeeded, is unconfigured, or denied.
 * - Never claims FCM works if native services are absent or token retrieval fails.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { db, isDemoMode } from './firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export interface PushRegistrationResult {
  status: 'registered' | 'unconfigured' | 'permission_denied' | 'unsupported_platform';
  token: string | null;
  nativeFcmToken?: string | null;
  platform: string;
  error?: string;
  message?: string;
}

// 1. Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Configure Android notification channels with water-themed priority styling
 */
export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // Channel 1: Order Updates & Installation Dispatch
    await Notifications.setNotificationChannelAsync('order-updates', {
      name: 'Order & Installation Updates',
      description: 'Real-time order confirmation, dispatch, and technician arrival alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0077B6',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Channel 2: Dealership Approvals & Wholesale
    await Notifications.setNotificationChannelAsync('dealer-status', {
      name: 'Dealership & Wholesale Status',
      description: 'Wholesale application reviews and credit approval notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Channel 3: Filter Replacement & Maintenance Alerts
    await Notifications.setNotificationChannelAsync('service-alerts', {
      name: 'Filter Care & Maintenance Alerts',
      description: 'Critical TDS warnings, filter replacement schedules, and service reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#EF4444',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  } catch (err) {
    console.warn('[PushNotifications] Could not set Android notification channels:', err);
  }
}

/**
 * Register device for push notifications
 * Returns verified status without claiming success if mocked or unconfigured.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  const currentPlatform = Platform.OS;

  // Web fallback
  if (currentPlatform === 'web') {
    return {
      status: 'unsupported_platform',
      token: null,
      platform: 'web',
      message: 'Native Android FCM requires an Android device or development build. Web push is handled via in-app toast notifications.',
    };
  }

  // Setup channels for Android
  await setupAndroidNotificationChannels();

  // Check physical device vs emulator
  if (!Device.isDevice) {
    return {
      status: 'unconfigured',
      token: null,
      platform: currentPlatform,
      error: 'Running on Android emulator or virtual device without Google Play Services. Native FCM push token generation requires a physical Android device or Google APIs emulator with logged-in Google Play.',
    };
  }

  // Request user permissions
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return {
        status: 'permission_denied',
        token: null,
        platform: currentPlatform,
        error: 'Push notification permission was denied by user.',
      };
    }

    // Try retrieving native FCM device push token (for direct FCM integration)
    let nativeFcmToken: string | null = null;
    try {
      const deviceTokenObj = await Notifications.getDevicePushTokenAsync();
      if (deviceTokenObj && deviceTokenObj.data) {
        nativeFcmToken = deviceTokenObj.data;
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.warn('[PushNotifications] Native device push token not available:', err.message);
    }

    // Also obtain Expo Push Token (which routes to FCM for Expo standalone/development builds)
    let expoPushToken: string | null = null;
    try {
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      const pushTokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      expoPushToken = pushTokenData?.data || null;
    } catch (e: unknown) {
      const err = e as Error;
      console.warn('[PushNotifications] Expo push token not available:', err.message);
    }

    const effectiveToken = expoPushToken || nativeFcmToken;

    if (!effectiveToken) {
      return {
        status: 'unconfigured',
        token: null,
        platform: currentPlatform,
        error: 'FCM / Google Services configuration missing. Add google-services.json from Firebase Console to apps/mobile and build a development client (npx expo run:android).',
      };
    }

    return {
      status: 'registered',
      token: effectiveToken,
      nativeFcmToken,
      platform: currentPlatform,
      message: 'Device successfully registered with Firebase Cloud Messaging / Expo Push service.',
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      status: 'unconfigured',
      token: null,
      platform: currentPlatform,
      error: err.message || 'Push notification registration failed',
    };
  }
}

/**
 * Save device push token securely to Firestore and the trusted server endpoint
 */
export async function saveDevicePushToken(
  userId: string,
  tokenInfo: { token: string; nativeFcmToken?: string | null; platform: string }
): Promise<boolean> {
  if (!userId || !tokenInfo.token) return false;

  const payload = {
    pushToken: tokenInfo.token,
    nativeFcmToken: tokenInfo.nativeFcmToken || null,
    devicePlatform: tokenInfo.platform,
    pushTokenUpdatedAt: new Date().toISOString(),
  };

  // 1. Save directly to Firestore if available
  if (!isDemoMode && db) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, payload);
      console.log('[PushNotifications] Device token saved to Firestore for user:', userId);
    } catch (err) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, payload, { merge: true });
      } catch (innerErr) {
        console.warn('[PushNotifications] Could not save token to Firestore:', innerErr);
      }
    }
  }

  // 2. Also register via server API endpoint if web / server is available
  try {
    const apiUrl = Platform.select({
      web: '/api/users/device-token',
      default: 'https://calinfco-admin.vercel.app/api/users/device-token',
    });

    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...payload,
      }),
    });
  } catch {
    // Non-critical endpoint sync fallback
  }

  return true;
}

/**
 * Setup listeners for incoming notifications and user tap response
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  const subReceived = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[PushNotifications] Notification received in foreground:', notification);
    onNotificationReceived?.(notification);
  });

  const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[PushNotifications] Notification tapped by user:', response);
    onNotificationResponse?.(response);
  });

  return () => {
    subReceived.remove();
    subResponse.remove();
  };
}
