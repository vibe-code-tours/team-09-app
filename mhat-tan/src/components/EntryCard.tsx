// EntryCard Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Entry, CATEGORIES } from '../types';

interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress }) => {
  const categoryInfo = CATEGORIES[entry.category];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
          <Text style={[styles.categoryLabel, { color: categoryInfo.color }]}>
            {categoryInfo.label}
          </Text>
        </View>
      </View>
      <Text style={styles.summary} numberOfLines={2}>
        {entry.summary}
      </Text>
      <Text style={styles.mood}>Feeling: {entry.mood}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summary: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  mood: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
});
