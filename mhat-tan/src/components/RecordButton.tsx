// RecordButton Component
import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  onPress,
  disabled = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isRecording]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.recordingButton,
          disabled && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons name={isRecording ? 'stop' : 'mic'} size={60} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
});
