# Daily Reminder Notification — Implementation Plan

> Step-by-step implementation plan for daily reminder notifications.

**Date:** 2026-07-17
**Design Spec:** `2026-07-17-daily-reminder-notification-design.md`
**Estimated Effort:** 2-3 hours

---

## Phase 1: Dependencies & Setup (15 min)

### Step 1.1: Install expo-notifications

```bash
npx expo install expo-notifications
```

### Step 1.2: Verify installation

Check `package.json` for `expo-notifications` in dependencies.

---

## Phase 2: Database Schema (15 min)

### Step 2.1: Add reminderTime column to schema.ts

**File:** `src/db/schema.ts`

Add to `userSettings` table (after line 110):

```typescript
reminderTime: text('reminder_time').notNull().default('20:00'), // HH:MM format
```

### Step 2.2: Update default settings in db/index.ts

**File:** `src/db/index.ts`

Find the default user settings object and add:

```typescript
reminderTime: '20:00',
```

---

## Phase 3: Notification Service (45 min)

### Step 3.1: Create notification.ts

**File:** `src/services/notification.ts` (NEW)

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Create Android notification channel
 */
export const setupNotificationChannel = async (): Promise<void> => {
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
```

---

## Phase 4: App.tsx Integration (30 min)

### Step 4.1: Import notification service

**File:** `App.tsx`

Add imports at top:

```typescript
import {
  setupNotificationChannel,
  getInitialNotification,
  addNotificationTapListener,
} from './src/services/notification';
```

### Step 4.2: Add navigation ref for deep linking

```typescript
import { NavigationContainerRef } from '@react-navigation/native';

// Inside component:
const navigationRef = useRef<NavigationContainerRef<any>>(null);
```

### Step 4.3: Add useEffect for notification setup

```typescript
useEffect(() => {
  // Setup notification channel (Android)
  setupNotificationChannel();
  
  // Handle notification tap when app is closed
  getInitialNotification().then((response) => {
    if (response) {
      // App opened by notification tap
      setTimeout(() => {
        navigationRef.current?.navigate('RecordTab');
      }, 1000);
    }
  });
  
  // Handle notification tap when app is in foreground
  const subscription = addNotificationTapListener((response) => {
    navigationRef.current?.navigate('RecordTab');
  });
  
  return () => subscription.remove();
}, []);
```

### Step 4.4: Update NavigationContainer

```typescript
<NavigationContainer ref={navigationRef}>
  {/* ... rest of navigation */}
</NavigationContainer>
```

---

## Phase 5: SettingsScreen Wiring (45 min)

### Step 5.1: Add imports

**File:** `src/screens/SettingsScreen.tsx`

```typescript
import { useState, useEffect } from 'react';
import {
  // ... existing imports
  Platform,
} from 'react-native';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../services/notification';
```

### Step 5.2: Add state

```typescript
const [reminderEnabled, setReminderEnabled] = useState(false);
const [reminderTime, setReminderTime] = useState('20:00');
```

### Step 5.3: Add useEffect to load settings

```typescript
useEffect(() => {
  loadReminderSettings();
}, []);

const loadReminderSettings = async () => {
  // Load from user_settings in DB
  // For now, use default values
  // TODO: Wire to actual DB when user_settings service is ready
  setReminderEnabled(true); // Default to enabled
  setReminderTime('20:00');
};
```

### Step 5.4: Add toggle handler

```typescript
const handleToggleReminder = async () => {
  if (!reminderEnabled) {
    // Enabling
    const granted = await requestNotificationPermission();
    if (granted) {
      const [h, m] = reminderTime.split(':').map(Number);
      await scheduleDailyReminder(h, m);
      setReminderEnabled(true);
      // TODO: Save to DB
    } else {
      Alert.alert(
        'Notifications Blocked',
        'Please enable notifications in your device Settings to receive reminders.',
        [{ text: 'OK' }]
      );
    }
  } else {
    // Disabling
    await cancelDailyReminder();
    setReminderEnabled(false);
    // TODO: Save to DB
  }
};
```

### Step 5.5: Add time picker handler

```typescript
const handleTimePress = () => {
  if (Platform.OS === 'android') {
    // Show native time picker dialog
    const [initialHour, initialMinute] = reminderTime.split(':').map(Number);
    
    // For Android, we'll use a simple approach
    // In production, use @react-native-community/datetimepicker
    Alert.prompt(
      'Set Reminder Time',
      'Enter time in HH:MM format (24-hour)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: (value) => {
            if (value && /^\d{2}:\d{2}$/.test(value)) {
              handleTimeChange(value);
            }
          },
        },
      ],
      'plain-text',
      reminderTime
    );
  }
};

const handleTimeChange = async (time: string) => {
  setReminderTime(time);
  if (reminderEnabled) {
    const [h, m] = time.split(':').map(Number);
    await cancelDailyReminder();
    await scheduleDailyReminder(h, m);
    // TODO: Save to DB
  }
};
```

### Step 5.6: Update Daily Reminders ToggleRow

```typescript
<ToggleRow
  icon="🔔"
  title="Daily Reminders"
  subtitle="Remind to record entries"
  value={reminderEnabled}
  onToggle={handleToggleReminder}
  colors={colors}
  shadows={shadows}
/>
```

### Step 5.7: Add time picker row (after toggle)

```typescript
{reminderEnabled && (
  <TouchableOpacity
    style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
    onPress={handleTimePress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <Text style={styles.rowIcon}>⏰</Text>
      <View>
        <Text style={[styles.rowTitle, { color: colors.text }]}>Reminder Time</Text>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
          {formatTime(reminderTime)}
        </Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
  </TouchableOpacity>
)}
```

### Step 5.8: Add time formatting helper

```typescript
const formatTime = (time: string): string => {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};
```

---

## Phase 6: Testing (15 min)

### Step 6.1: Test notification scheduling

1. Open Settings → Notifications
2. Toggle ON → should see permission prompt
3. Grant permission → notification should be scheduled
4. Check time picker appears
5. Change time → notification should reschedule

### Step 6.2: Test notification delivery

1. Set reminder time to 1 minute from now
2. Close app completely
3. Wait for notification to fire
4. Tap notification → app should open to RecordScreen

### Step 6.3: Test disable

1. Toggle OFF → notification should be cancelled
2. Verify no notification fires at scheduled time

---

## Checklist

- [ ] Phase 1: Dependencies installed
- [ ] Phase 2: Database schema updated
- [ ] Phase 3: Notification service created
- [ ] Phase 4: App.tsx integration complete
- [ ] Phase 5: SettingsScreen wired up
- [ ] Phase 6: All tests passing
- [ ] Code reviewed
- [ ] PR created
