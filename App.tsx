// Mhat Tan - Main App
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SystemUI from 'expo-system-ui';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { initDatabase } from './src/db';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecordScreen } from './src/screens/RecordScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WeeklySummaryScreen } from './src/screens/WeeklySummaryScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { CreateNoteScreen } from './src/screens/CreateNoteScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { DayDetailScreen } from './src/screens/DayDetailScreen';
import { ElevatedTabBar } from './src/components/ElevatedTabBar';
import { CreateSheet } from './src/components/CreateSheet';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="CreateNote" component={CreateNoteScreen} />
      <Stack.Screen name="WeeklySummary" component={WeeklySummaryScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="WeeklySummary" component={WeeklySummaryScreen} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="CreateNote" component={CreateNoteScreen} />
    </Stack.Navigator>
  );
}

function NotesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotesMain" component={NotesScreen} />
      <Stack.Screen name="DayDetail" component={DayDetailScreen} />
      <Stack.Screen name="CreateNote" component={CreateNoteScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const tabNavigationRef = useRef<any>(null);

  const handleRecordVoice = () => {
    setSheetVisible(false);
    if (tabNavigationRef.current) {
      tabNavigationRef.current.navigate('Record');
    }
  };

  const handleNewNote = () => {
    setSheetVisible(false);
    if (tabNavigationRef.current) {
      tabNavigationRef.current.navigate('Home', {
        screen: 'CreateNote',
        params: {},
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => {
          tabNavigationRef.current = props.navigation;
          return (
            <ElevatedTabBar
              {...props}
              onCenterPress={() => setSheetVisible(true)}
            />
          );
        }}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Search" component={SearchStack} />
        <Tab.Screen name="Record" component={RecordScreen} />
        <Tab.Screen name="Notes" component={NotesStack} />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>

      <CreateSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onRecordVoice={handleRecordVoice}
        onNewNote={handleNewNote}
      />
    </View>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const { isReady: authReady } = useAuth();
  const [dbReady, setDbReady] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Set Android system bars color based on theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(isDark ? '#121212' : '#F5F5F5');
    }
  }, [isDark]);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('[DB] Init failed:', err);
        setDbReady(true); // proceed anyway — screens will show errors
      });
  }, []);

  // Setup notifications on app mount (dynamically imported to avoid Expo Go error)
  useEffect(() => {
    let subscription: any = null;

    const setupNotifications = async () => {
      try {
        const {
          setupNotificationChannel,
          getInitialNotification,
          addNotificationTapListener,
        } = await import('./src/services/notification');

        // Create Android notification channel
        await setupNotificationChannel();

        // Handle notification tap when app was closed
        const response = await getInitialNotification();
        if (response) {
          const screen = response?.notification?.request?.content?.data?.screen;
          setTimeout(() => {
            if (screen === 'weekly-summary') {
              navigationRef.current?.navigate('Settings', { screen: 'WeeklySummary' });
            } else {
              navigationRef.current?.navigate('Record');
            }
          }, 1000);
        }

        // Handle notification tap when app is in foreground
        subscription = addNotificationTapListener((res) => {
          const screen = res?.notification?.request?.content?.data?.screen;
          if (screen === 'weekly-summary') {
            navigationRef.current?.navigate('Settings', { screen: 'WeeklySummary' });
          } else {
            navigationRef.current?.navigate('Record');
          }
        });
      } catch {
        // expo-notifications unavailable (Expo Go) — skip
      }
    };

    setupNotifications();

    return () => {
      if (subscription?.remove) subscription.remove();
    };
  }, []);

  if (!dbReady || !authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
