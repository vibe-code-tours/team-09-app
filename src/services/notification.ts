// Notification Service — Daily Reminders
// Gracefully degrades in Expo Go (SDK 53+ removed expo-notifications from Expo Go)
import { Platform } from 'react-native';

// Check if we're running in Expo Go (no native notification module)
let Notifications: typeof import('expo-notifications') | null = null;
let isExpoGo = false;

try {
  Notifications = require('expo-notifications');
} catch {
  console.warn('[Notification] expo-notifications not available (Expo Go). Notifications disabled.');
  isExpoGo = true;
}

// Configure how notifications appear when app is open
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Create Android notification channel (no-op on iOS or Expo Go)
 */
export const setupNotificationChannel = async (): Promise<void> => {
  if (isExpoGo || !Notifications) {
    console.log('[Notification] Skipping channel setup (Expo Go)');
    return;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
};

/**
 * Request notification permission
 * Returns true if granted, false if denied or unavailable
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (isExpoGo || !Notifications) {
    console.log('[Notification] Skipping permission request (Expo Go)');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log(`[Notification] Existing permission status: ${existingStatus}`);

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  console.log(`[Notification] New permission status: ${status}`);
  return status === 'granted';
};

/**
 * Schedule a recurring daily notification
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 */
export const scheduleDailyReminder = async (
  hour: number,
  minute: number
): Promise<void> => {
  if (isExpoGo || !Notifications) {
    console.log('[Notification] Skipping schedule (Expo Go)');
    return;
  }

  // Guard against undefined/null values
  const safeHour = typeof hour === 'number' ? hour : 20;
  const safeMinute = typeof minute === 'number' ? minute : 0;

  // Cancel any existing notifications first
  await cancelDailyReminder();

  console.log(`[Notification] Scheduling daily reminder at ${safeHour}:${safeMinute.toString().padStart(2, '0')}`);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'မှတ်တမ်း',
      body: "Today's record is waiting! 🎙️",
      data: { screen: 'record' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: safeHour,
      minute: safeMinute,
      channelId: 'daily-reminder',
    },
  });

  console.log(`[Notification] Scheduled with ID: ${notificationId}`);
};

/**
 * Cancel all scheduled daily reminders
 */
export const cancelDailyReminder = async (): Promise<void> => {
  if (isExpoGo || !Notifications) return;
  console.log('[Notification] Cancelling all scheduled notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get all currently scheduled notifications
 */
export const getScheduledNotifications = async (): Promise<any[]> => {
  if (isExpoGo || !Notifications) return [];
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * Check if app was opened by tapping a notification
 * Returns the notification response if opened by notification, null otherwise
 */
export const getInitialNotification = async (): Promise<any | null> => {
  if (isExpoGo || !Notifications) return null;
  return await Notifications.getLastNotificationResponseAsync();
};

/**
 * Add listener for notification taps (when app is in foreground)
 */
export const addNotificationTapListener = (
  handler: (response: any) => void
): any => {
  if (isExpoGo || !Notifications) {
    // Return a no-op subscription
    return { remove: () => { } };
  }
  return Notifications.addNotificationResponseReceivedListener(handler);
};

// =============================================================================
// Weekly Summary Notifications
// =============================================================================

/**
 * Schedule a weekly summary notification for a specific day and time.
 * @param dayOfWeek - 0=Sunday, 1=Monday, ..., 6=Saturday
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 */
export const scheduleWeeklyReminder = async (
  dayOfWeek: number,
  hour: number,
  minute: number
): Promise<void> => {
  if (isExpoGo || !Notifications) {
    console.log('[Notification] Skipping weekly schedule (Expo Go)');
    return;
  }

  // Guard against NaN
  const safeDay = typeof dayOfWeek === 'number' && !isNaN(dayOfWeek) ? dayOfWeek : 0;
  const safeHour = typeof hour === 'number' && !isNaN(hour) ? hour : 20;
  const safeMinute = typeof minute === 'number' && !isNaN(minute) ? minute : 0;

  // Cancel any existing weekly notifications first
  await cancelWeeklyReminder();

  console.log(`[Notification] Scheduling weekly summary on day ${safeDay} at ${safeHour}:${safeMinute.toString().padStart(2, '0')}`);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Weekly Summary',
      body: 'Your weekly summary is ready! Tap to view.',
      data: { screen: 'weekly-summary' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: safeDay + 1, // Expo uses 1=Sunday, 2=Monday, ..., 7=Saturday
      hour: safeHour,
      minute: safeMinute,
      channelId: 'daily-reminder',
    },
  });

  console.log(`[Notification] Weekly summary scheduled with ID: ${notificationId}`);
};

/**
 * Cancel all scheduled weekly summary notifications.
 */
export const cancelWeeklyReminder = async (): Promise<void> => {
  if (isExpoGo || !Notifications) return;

  const all = await Notifications.getAllScheduledNotificationsAsync();
  const weekly = all.filter(
    (n) => n.content.data?.screen === 'weekly-summary'
  );

  for (const n of weekly) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
  console.log(`[Notification] Cancelled ${weekly.length} weekly notifications`);
};
