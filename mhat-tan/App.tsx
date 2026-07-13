// Mhat Tan - Main App
import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecordScreen } from './src/screens/RecordScreen';
import { MoneyScreen } from './src/screens/MoneyScreen';
import { ExpenseListScreen } from './src/screens/ExpenseListScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { ElevatedTabBar } from './src/components/ElevatedTabBar';
import { spacing, createShadows } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Recording Overlay (Sketch 001-C style)
const RecordingOverlay: React.FC<{
  visible: boolean;
  onStop: () => void;
  onCancel: () => void;
}> = ({ visible, onStop, onCancel }) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (visible) {
      setSeconds(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [visible]);

  if (!visible) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <Animated.View style={[styles.recordingOverlay, { opacity }]}>
      <View style={[styles.recordingCard, { backgroundColor: colors.surface }, shadows.md]}>
        {/* Recording indicator */}
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.recordingText, { color: colors.danger }]}>Recording...</Text>
          <Text style={[styles.recordingTimer, { color: colors.textMuted }]}>
            {mins}:{String(secs).padStart(2, '0')}
          </Text>
        </View>

        {/* Waveform visualization */}
        <View style={styles.waveformContainer}>
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              style={[styles.waveBar, { backgroundColor: colors.primary }]}
            />
          ))}
        </View>

        {/* Cancel / Stop buttons */}
        <View style={styles.recordingButtons}>
          <TouchableOpacity
            style={[styles.recordingBtn, { backgroundColor: colors.bg }]}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.recordingBtnStop, { backgroundColor: colors.danger }]}
            onPress={onStop}
            activeOpacity={0.8}
          >
            <Ionicons name="stop" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Record" component={RecordScreen} />
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
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const [isRecording, setIsRecording] = useState(false);

  const handleCenterPress = () => {
    setIsRecording(true);
  };

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => (
          <ElevatedTabBar
            {...props}
            onCenterPress={handleCenterPress}
            isRecording={isRecording}
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
      <RecordingOverlay
        visible={isRecording}
        onStop={() => setIsRecording(false)}
        onCancel={() => setIsRecording(false)}
      />
    </>
  );
}

function AppContent() {
  const { isDark } = useTheme();

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
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  recordingOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  recordingCard: {
    width: '88%',
    borderRadius: 20,
    padding: spacing.xl,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordingTimer: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '500',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  waveBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  recordingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  recordingBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingBtnStop: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
