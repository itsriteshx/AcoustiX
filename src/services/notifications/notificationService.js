import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_ENABLED_KEY = '@acoustitape_daily_reminder';
const ALERT_CHANNEL_ID = 'acoustic-alerts';
let lastNoiseAlertAt = 0;

// SDK 58 foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permissions, configures the Android channel,
 * and attempts to retrieve an Expo Push Token when supported.
 *
 * @returns {Promise<{ granted: boolean, expoPushToken: string | null }>}
 */
export async function setupNotifications() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
        name: 'Acoustic Alerts & Audits',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 150, 200],
        lightColor: '#06B6D4',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { granted: false, expoPushToken: null };
    }

    let expoPushToken = null;
    try {
      const tokenRes = await Notifications.getExpoPushTokenAsync();
      expoPushToken = tokenRes?.data || null;
    } catch (_) {
      // Expected in simulators or Expo Go without EAS projectId
    }

    return { granted: true, expoPushToken };
  } catch (error) {
    console.warn('[notificationService] Setup warning:', error?.message);
    return { granted: false, expoPushToken: null };
  }
}

/**
 * Fires an immediate local notification summarizing a completed room audit.
 *
 * @param {Object} measurement
 */
export async function sendAuditCompleteNotification(measurement) {
  if (!measurement) return;
  try {
    const clarityPart = measurement.clarity
      ? ` • STI ${measurement.clarity.sti.toFixed(2)} (${measurement.clarity.stiRating})`
      : '';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Audit Complete: ${measurement.roomName}`,
        body: `RT60: ${measurement.overallRT60.toFixed(2)}s • R² ${(measurement.rSquared * 100).toFixed(0)}%${clarityPart}`,
        data: { measurementId: measurement.id, type: 'audit_complete' },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[notificationService] Audit notification skipped:', error?.message);
  }
}

/**
 * Fires a rate-limited OSHA noise hazard alert when SPL exceeds 85 dBA.
 *
 * @param {number} dba
 */
export async function sendNoiseWarningNotification(dba) {
  const now = Date.now();
  if (dba < 85 || now - lastNoiseAlertAt < 30000) return;
  lastNoiseAlertAt = now;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'High Noise Warning (> 85 dBA)',
        body: `Measured ${dba} dBA. Prolonged exposure exceeds OSHA safe listening limits.`,
        data: { dba, type: 'osha_noise_warning' },
      },
      trigger: null,
    });
  } catch (_) {}
}

/**
 * Sends an instant test notification so the user can verify alerts on device.
 */
export async function sendTestNotification() {
  const { granted } = await setupNotifications();
  if (!granted) {
    throw new Error('Notification permission not granted.');
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'AcoustiTape Notifications Active',
      body: 'Acoustic audit summaries, OSHA noise alerts, and daily reminders are enabled.',
      data: { type: 'test' },
    },
    trigger: null,
  });
  return true;
}

/**
 * Schedules a recurring daily acoustic audit reminder at the given hour/minute.
 */
export async function scheduleDailyAuditReminder(hour = 9, minute = 0) {
  const { granted } = await setupNotifications();
  if (!granted) {
    throw new Error('Notification permission not granted.');
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Room Acoustic Check',
      body: 'Ready to run your scheduled RT60 & clarity audit with AcoustiTape.',
      data: { type: 'daily_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
  return true;
}

/**
 * Cancels all scheduled daily acoustic reminders.
 */
export async function cancelAuditReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
}

/**
 * Returns whether the daily audit reminder is persisted as enabled.
 */
export async function isDailyReminderEnabled() {
  try {
    const val = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
    return val === 'true';
  } catch (_) {
    return false;
  }
}
