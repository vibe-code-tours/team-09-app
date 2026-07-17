// Mhat Tan - Main App
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { initDatabase } from './src/db';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecordScreen } from './src/screens/RecordScreen';
import { MoneyScreen } from './src/screens/MoneyScreen';
import { ExpenseListScreen } from './src/screens/ExpenseListScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { ElevatedTabBar } from './src/components/ElevatedTabBar';
import {
  setupNotificationChannel,
  getInitialNotification,
  addNotificationTapListener,
} from './src/services/notification';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function MoneyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoneyMain" component={MoneyScreen} />
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <ElevatedTabBar
          {...props}
          onCenterPress={() => props.navigation.navigate('Record')}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Record" component={RecordScreen} />
      <Tab.Screen name="Money" component={MoneyStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const { isReady: authReady } = useAuth();
  const [dbReady, setDbReady] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('[DB] Init failed:', err);
        setDbReady(true); // proceed anyway — screens will show errors
      });
  }, []);

  // Setup notifications on app mount
  useEffect(() => {
    // Create Android notification channel
    setupNotificationChannel();

    // Handle notification tap when app was closed
    getInitialNotification().then((response) => {
      if (response) {
        // App opened by tapping notification
        setTimeout(() => {
          navigationRef.current?.navigate('Record');
        }, 1000);
      }
    });

    // Handle notification tap when app is in foreground
    const subscription = addNotificationTapListener((response) => {
      navigationRef.current?.navigate('Record');
    });

    return () => subscription.remove();
  }, []);

  if (!dbReady || !authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#1a1a2e' : '#F5F5F5' }}>
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
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
