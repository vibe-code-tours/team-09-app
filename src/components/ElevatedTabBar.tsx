// Custom tab bar matching Sketch 001-C: Center Tab Elevated
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, createShadows } from '../theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type TabConfig = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { key: 'Home', label: 'Home', icon: 'home-outline', iconFocused: 'home' },
  { key: 'Search', label: 'Search', icon: 'search-outline', iconFocused: 'search' },
  { key: 'Record', label: 'Record', icon: 'add', iconFocused: 'add' }, // Center
  { key: 'Settings', label: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
];

interface Props extends BottomTabBarProps {
  onCenterPress: () => void;
  isRecording?: boolean;
}

export const ElevatedTabBar: React.FC<Props> = ({
  state,
  navigation,
  onCenterPress,
  isRecording = false,
}) => {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const shadows = createShadows(isDark, colors.primary);
  const insets = useSafeAreaInsets();

  const isCenterTab = (routeName: string) => routeName === 'Record';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const routeIndex = state.routes.findIndex(r => r.name === tab.key);
          const isFocused = state.index === routeIndex;

          if (isCenterTab(tab.key)) {
            // Center elevated mic button
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.centerButtonWrapper, { marginTop: -24 }]}
                onPress={onCenterPress}
                activeOpacity={0.85}
              >
                <View style={[
                  styles.centerButton,
                  { backgroundColor: isRecording ? colors.danger : colors.primary },
                  shadows.primary,
                ]}>
                  <Ionicons
                    name="add"
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={[styles.centerLabel, { color: colors.textMuted }]}>Record</Text>
              </TouchableOpacity>
            );
          }

          const iconName = isFocused ? tab.iconFocused : tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={iconName} size={22} color={isFocused ? colors.primary : colors.textMuted} />
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? colors.primary : colors.textMuted }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
