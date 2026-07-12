// EmptyState Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Entries Yet',
  message = 'Tap the record button to start',
  icon = 'mic-outline',
}) => (
  <View style={styles.container}>
    <Ionicons name={icon} size={80} color="#E0E0E0" />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  title: { fontSize: 20, fontWeight: '600', color: '#666', marginTop: 16, marginBottom: 8 },
  message: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
});
