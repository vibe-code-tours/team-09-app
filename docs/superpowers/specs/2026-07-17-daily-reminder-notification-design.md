# Daily Reminder Notification — Design Spec

> Voice-first daily record app for Burmese speakers — remind users to record their day.

**Date:** 2026-07-17
**Status:** Approved
**Scope:** Daily reminder only (weekly summary deferred to V2)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Daily Reminder Behavior](#daily-reminder-behavior)
4. [Settings UI Changes](#settings-ui-changes)
5. [Data Model Changes](#data-model-changes)
6. [Notification Service](#notification-service)
7. [Integration Points](#integration-points)
8. [Error Handling & Edge Cases](#error-handling--edge-cases)
9. [Testing & Acceptance Criteria](#testing--acceptance-criteria)
10. [Out of Scope](#out-of-scope)

---

## Overview

### Problem
Users forget to record daily entries, leading to gaps in their timeline and reduced app engagement.

### Solution
A configurable daily reminder notification that nudges users to open the app and record their day. Tapping the notification opens the RecordScreen directly.

### Approach
- **expo-notifications** with local scheduling (no server required)
- User-configurable time (default: 8:00 PM)
- Android-first, OS-managed delivery

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SettingsScreen                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Daily Reminders  [toggle] → opens time picker   │    │
│  │ Weekly Summary   [toggle] → (disabled for now)  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NotificationService (new)                   │
│  • requestPermission()                                  │
│  • scheduleDailyReminder(hour, minute)                  │
│  • cancelDailyReminder()                                │
│  • getReminderTime()                                    │
│  • saveReminderTime(userId, time)                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              expo-notifications (local)                  │
│  • Recurring daily notification at user-chosen time     │
│  • Tapping notification → opens RecordScreen            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              SQLite (user_settings)                      │
│  • notifications: boolean (master toggle)               │
│  • reminderTime: string (HH:MM format, e.g. "20:00")   │
└─────────────────────────────────────────────────────────┘
```

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Local notifications only | No server required for daily reminders |
| Recurring schedule | `expo-notifications` supports repeating triggers |
| Deep link on tap | Tapping notification opens RecordScreen |
| Time stored in DB | Persists across app restarts, syncs if user signs in |
| HH:MM string format | Simpler to read/write, easy to parse |

---

## Daily Reminder Behavior

### Notification Content

| Field | Value |
|-------|-------|
| Title | `မှတ်တမ်း` (app name in Burmese) |
| Body | `Today's record is waiting! 🎙️` |
| Icon | App icon |
| Sound | Default system sound |
| Channel | `daily-reminder` (Android notification channel) |

### Tapping Behavior
- Opens the app → navigates to `RecordScreen`
- Uses deep link URL: `mhat-tan://record`
- Works when app is closed (OS handles)

### Scheduling Logic

```
When user enables toggle:
  1. Request notification permission (if not granted)
  2. Show time picker (default: 20:00 / 8 PM)
  3. Save time to user_settings.reminderTime
  4. Schedule recurring local notification

When user changes time:
  1. Cancel existing notification
  2. Schedule new one with updated time

When user disables toggle:
  1. Cancel existing notification
  2. Update user_settings.notifications = false
```

### Time Picker UX
- Simple inline picker below the toggle (not a modal)
- Shows current time, tap to change
- Uses native Android time picker dialog
- Default: 20:00 (8 PM) — evening is when people reflect on their day

---

## Settings UI Changes

### Current State
SettingsScreen already has hardcoded toggles for "Daily Reminders" and "Weekly Summary" (lines 209-231). We need to wire them up.

### Target State

```
NOTIFICATIONS
┌─────────────────────────────────────────────────┐
│ 🔔 Daily Reminders                    [toggle]  │
│    Remind to record entries                      │
│    ┌─────────────────────────────────────────┐  │
│    │ ⏰ Reminder Time: 8:00 PM        [tap]  │  │
│    └─────────────────────────────────────────┘  │
│─────────────────────────────────────────────────│
│ 📊 Weekly Summary                     [toggle]  │
│    Spending report every Sunday    (disabled)   │
└─────────────────────────────────────────────────┘
```

### Behavior Matrix

| User Action | What Happens |
|-------------|--------------|
| Toggle ON | Request permission → show time picker → schedule notification |
| Toggle OFF | Cancel notification → update DB |
| Tap time | Open native Android time picker → update schedule |
| Permission denied | Toggle stays off, show toast: "Enable notifications in Settings" |
| Already enabled | Just update time |

### New State in SettingsScreen

```typescript
const [reminderEnabled, setReminderEnabled] = useState(false);
const [reminderTime, setReminderTime] = useState('20:00'); // HH:MM
```

### Weekly Summary Toggle
- Stays disabled (greyed out) for now
- Shows "Coming soon" subtitle
- No interaction until we build it

### Time Display Format
- Store: `20:00` (24h format)
- Display: `8:00 PM` (12h format for user-facing)
- Use simple formatting function, no date-fns dependency

---

## Data Model Changes

### New Column in `user_settings` Table

```typescript
reminderTime: text('reminder_time').notNull().default('20:00'), // HH:MM format
```

### Migration

```sql
ALTER TABLE user_settings ADD COLUMN reminder_time TEXT NOT NULL DEFAULT '20:00';
```

### Updated Schema

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `notifications` | boolean | `true` | Master toggle for daily reminders |
| `reminderTime` | text | `'20:00'` | When to send reminder (HH:MM) |

### Future Fields (Weekly Summary — V2)

```typescript
weeklySummary: integer('weekly_summary', { mode: 'boolean' }).notNull().default(false),
weeklySummaryDay: text('weekly_summary_day').notNull().default('sunday'),
```

---

## Notification Service

### New File: `src/services/notification.ts`

```typescript
// Core functions:
requestNotificationPermission() → Promise<boolean>
scheduleDailyReminder(hour: number, minute: number) → Promise<void>
cancelDailyReminder() → Promise<void>
getScheduledNotifications() → Promise<NotificationRequest[]>
```

### Flow for Enabling Reminder

```
User toggles ON
    │
    ▼
requestNotificationPermission()
    │
    ├─ Granted ──► scheduleDailyReminder(hour, minute)
    │                   │
    │                   ▼
    │               Save to DB: notifications=true, reminderTime
    │
    └─ Denied ──► Show toast: "Enable in Settings"
                      │
                      ▼
                  Toggle stays OFF
```

### Flow for Changing Time

```
User taps time picker
    │
    ▼
Show Android TimePickerDialog
    │
    ▼
User selects new time (e.g. 21:30)
    │
    ▼
cancelDailyReminder()
    │
    ▼
scheduleDailyReminder(21, 30)
    │
    ▼
Save to DB: reminderTime='21:30'
```

### Notification Channel Setup (Android)

```typescript
// Create channel on app start
Notifications.setNotificationChannelAsync('daily-reminder', {
  name: 'Daily Reminders',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'default',
});
```

### Deep Link Handler

```typescript
// When notification is tapped
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  if (data.screen === 'record') {
    navigation.navigate('Record');
  }
});
```

---

## Integration Points

### Files to Modify

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `reminderTime` column to `userSettings` |
| `src/screens/SettingsScreen.tsx` | Wire toggles, add time picker, request permission |
| `src/services/notification.ts` | **New file** — all notification logic |
| `App.tsx` | Set up notification channel, handle deep links |
| `src/db/index.ts` | Add `reminderTime` to default settings |

### App.tsx Changes

```typescript
// On app mount:
useEffect(() => {
  // 1. Create Android notification channel
  setupNotificationChannel();
  
  // 2. Load user's reminder settings from DB
  // 3. If enabled, verify notification is still scheduled
  // 4. Add listener for notification taps (deep link)
}, []);
```

### SettingsScreen.tsx Changes

```typescript
// New state
const [reminderEnabled, setReminderEnabled] = useState(false);
const [reminderTime, setReminderTime] = useState('20:00');

// On mount: load from user_settings
useEffect(() => {
  loadReminderSettings();
}, []);

// Toggle handler
const handleToggleReminder = async () => {
  if (!reminderEnabled) {
    const granted = await requestNotificationPermission();
    if (granted) {
      const [h, m] = reminderTime.split(':').map(Number);
      await scheduleDailyReminder(h, m);
      setReminderEnabled(true);
    }
  } else {
    await cancelDailyReminder();
    setReminderEnabled(false);
  }
};

// Time picker handler
const handleTimeChange = async (time: string) => {
  setReminderTime(time);
  if (reminderEnabled) {
    const [h, m] = time.split(':').map(Number);
    await cancelDailyReminder();
    await scheduleDailyReminder(h, m);
  }
};
```

### Dependencies to Install

```bash
npx expo install expo-notifications
```

---

## Error Handling & Edge Cases

### Permission Errors

| Scenario | Handling |
|----------|----------|
| User denies permission | Toggle stays off, show toast: "Notifications blocked. Enable in device Settings." |
| Permission previously denied | Same as above — can't re-prompt, must go to OS settings |
| Permission grant fails | Toggle stays off, log error, show generic toast |

### Scheduling Errors

| Scenario | Handling |
|----------|----------|
| Schedule fails | Revert toggle, show toast: "Failed to set reminder" |
| Cancel fails | Log warning, continue anyway (notification might not exist) |
| DB save fails | Notification still scheduled, log error, retry on next app open |

### Edge Cases

| Scenario | Handling |
|----------|----------|
| User changes device time | Notification fires at new time (OS handles) |
| User changes timezone | Notification adjusts to new timezone (OS handles) |
| User reinstalls app | Permission lost, need to re-enable (expected behavior) |
| App data cleared | Settings reset to defaults, notification cancelled |
| Multiple notifications scheduled | Cancel all before scheduling new one (prevent duplicates) |

### Notification Tapping When App is Closed

```typescript
// Check if app was opened by notification
const initialNotification = await Notifications.getLastNotificationResponseAsync();
if (initialNotification) {
  // App opened by tapping notification
  navigation.navigate('Record');
}
```

### Cleanup on Sign-out

```typescript
// When user signs out
await cancelDailyReminder();
// Reset local settings to defaults
```

---

## Testing & Acceptance Criteria

### Functional Tests

| Test | Expected Result |
|------|-----------------|
| Toggle ON | Permission prompt appears → notification scheduled |
| Toggle OFF | Notification cancelled → toggle stays off |
| Change time | Old notification cancelled → new one scheduled |
| Permission denied | Toggle stays off → toast shown |
| App killed → notification fires | User sees notification at scheduled time |
| Tap notification | App opens → RecordScreen shown |
| Sign out | Notifications cancelled → settings reset |
| App reinstall | Permission lost → toggle reflects actual state |

### Acceptance Criteria

- [ ] User can enable daily reminder from Settings
- [ ] Time picker shows when toggle is enabled
- [ ] Default time is 8:00 PM
- [ ] Notification fires at scheduled time even when app is closed
- [ ] Tapping notification opens RecordScreen
- [ ] Disabling toggle cancels the notification
- [ ] Permission denial is handled gracefully with toast
- [ ] Settings persist across app restarts
- [ ] Works on Android (primary target)
- [ ] Weekly Summary toggle is disabled with "Coming soon" label

---

## Out of Scope (V1)

- ❌ Weekly summary notification
- ❌ AI-generated narrative
- ❌ Custom notification sounds
- ❌ Multiple reminder times
- ❌ Notification history/inbox
- ❌ iOS-specific optimizations
- ❌ Server-side scheduling
- ❌ Smart/adaptive reminders

---

## Summary

| Aspect | Detail |
|--------|--------|
| **Scope** | Daily reminder notifications only |
| **Dependencies** | `expo-notifications` (1 new package) |
| **Files changed** | 5 files (1 new, 4 modified) |
| **Complexity** | Low-Medium |
| **Estimated effort** | 2-3 hours |
