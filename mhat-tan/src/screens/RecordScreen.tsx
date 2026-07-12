// RecordScreen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RecordButton } from '../components/RecordButton';
import { useRecording } from '../hooks/useRecording';

export const RecordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, startRecording, stopRecording, playRecording, stopPlayback, discardRecording, formatDuration } = useRecording();

  const handleRecordPress = async () => {
    if (state.isRecording) await stopRecording();
    else await startRecording();
  };

  const handleSave = async () => {
    Alert.alert('Saved!', 'Entry saved successfully', [
      { text: 'OK', onPress: () => { discardRecording(); navigation.goBack(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Entry</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatDuration(state.duration)}</Text>
        <Text style={styles.timerLabel}>{state.isRecording ? 'Recording...' : 'Max 60 seconds'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <RecordButton isRecording={state.isRecording} onPress={handleRecordPress} />
      </View>

      {state.uri && !state.isRecording && (
        <View style={styles.playbackContainer}>
          <TouchableOpacity style={styles.playButton} onPress={state.isPlaying ? stopPlayback : playRecording}>
            <Ionicons name={state.isPlaying ? 'pause' : 'play'} size={32} color="#E91E63" />
          </TouchableOpacity>
        </View>
      )}

      {state.uri && !state.isRecording && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.discardButton} onPress={() => { discardRecording(); navigation.goBack(); }}>
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  timerContainer: { alignItems: 'center', paddingVertical: 40 },
  timer: { fontSize: 48, fontWeight: '300', color: '#333' },
  timerLabel: { fontSize: 14, color: '#999', marginTop: 8 },
  buttonContainer: { alignItems: 'center', paddingVertical: 20 },
  playbackContainer: { alignItems: 'center', paddingVertical: 20 },
  playButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E91E63' },
  actionContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40, marginTop: 30 },
  discardButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 25, borderWidth: 1, borderColor: '#DDD' },
  discardText: { fontSize: 16, color: '#666' },
  saveButton: { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 25, backgroundColor: '#E91E63' },
  saveText: { fontSize: 16, color: 'white', fontWeight: '600' },
});
