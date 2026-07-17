// Mhat Tan - Main App
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { initDatabase } from './src/db';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecordScreen } from './src/screens/RecordScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { CreateNoteScreen } from './src/screens/CreateNoteScreen';
import { ElevatedTabBar } from './src/components/ElevatedTabBar';
import { CreateSheet } from './src/components/CreateSheet';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="CreateNote" component={CreateNoteScreen} />
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
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Record" component={RecordScreen} />
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

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('[DB] Init failed:', err);
        setDbReady(true); // proceed anyway — screens will show errors
      });
  }, []);

  if (!dbReady || !authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#1a1a2e' : '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
