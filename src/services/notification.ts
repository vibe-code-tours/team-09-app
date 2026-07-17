// Notification Service — Daily Reminders
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Create Android notification channel (no-op on iOS)
 */
export const setupNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  // iOS doesn't need notification channels
};

/**
 * Request notification permission
 * Returns true if granted, false if denied
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
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
  // Cancel any existing notifications first
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'မှတ်တမ်း',
      body: "Today's record is waiting! 🎙️",
      data: { screen: 'record' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'daily-reminder',
    },
  });
};

/**
 * Cancel all scheduled daily reminders
 */
export const cancelDailyReminder = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get all currently scheduled notifications
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * Check if app was opened by tapping a notification
 * Returns the notification response if opened by notification, null otherwise
 */
export const getInitialNotification = async (): Promise<Notifications.NotificationResponse | null> => {
  return await Notifications.getLastNotificationResponseAsync();
};

/**
 * Add listener for notification taps (when app is in foreground)
 */
export const addNotificationTapListener = (
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};
