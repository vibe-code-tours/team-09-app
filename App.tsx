// Mhat Tan - Main App
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { initDatabase } from './src/db';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecordScreen } from './src/screens/RecordScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { CreateNoteScreen } from './src/screens/CreateNoteScreen';
import { ElevatedTabBar } from './src/components/ElevatedTabBar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const { theme } = useTheme();
  const { colors } = theme;
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetAnimation = useRef(new Animated.Value(0)).current;
  const tabNavigationRef = useRef<any>(null);

  // Bottom sheet animation functions
  const openSheet = () => {
    setSheetVisible(true);
    Animated.spring(sheetAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
    });
  };

  const handleCenterPress = () => {
    openSheet();
  };

  const handleRecordVoice = () => {
    closeSheet();
    // Navigate to Record tab
    if (tabNavigationRef.current) {
      tabNavigationRef.current.navigate('Record');
    }
  };

  const handleNewNote = () => {
    closeSheet();
    // Navigate to CreateNote screen in HomeStack
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
              onCenterPress={handleCenterPress}
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

      {/* Bottom Sheet Overlay */}
      {sheetVisible && (
        <Animated.View
          style={[
            styles.sheetOverlay,
            {
              opacity: sheetAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            onPress={closeSheet}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.surface,
                transform: [
                  {
                    translateY: sheetAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [SCREEN_HEIGHT, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Handle bar */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* Sheet title */}
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Create New</Text>

            {/* Options */}
            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomColor: colors.border }]}
              onPress={handleRecordVoice}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="mic" size={24} color={colors.primary} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.text }]}>Record Voice</Text>
                <Text style={[styles.sheetOptionSubtitle, { color: colors.textMuted }]}>
                  Speak to create a new entry
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handleNewNote}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="document-text" size={24} color={colors.success} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionTitle, { color: colors.text }]}>New Note</Text>
                <Text style={[styles.sheetOptionSubtitle, { color: colors.textMuted }]}>
                  Write a note manually
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
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

const styles = StyleSheet.create({
  // Bottom Sheet
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  sheetOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetOptionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
