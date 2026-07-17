// CreateNoteScreen - Unified notepad for creating and editing notes
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { CATEGORIES, Category, spacing, radius } from '../theme';
import { getEntryById, saveEntry, updateEntry } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import AudioPlayer from '../components/AudioPlayer';

type CreateNoteParams = {
  entryId?: string;
  prefilledText?: string;
  predictedCategory?: Category;
  audioFile?: string;
  startViewOnly?: boolean;
};

export const CreateNoteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: CreateNoteParams }, 'params'>>();
  const { theme } = useTheme();
  const { colors } = theme;
  const { userId } = useAuth();

  const {
    entryId,
    prefilledText,
    predictedCategory,
    audioFile,
    startViewOnly = false,
  } = route.params || {};

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>(predictedCategory || 'other');
  const [isPinned, setIsPinned] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(startViewOnly);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const contentInputRef = useRef<TextInput>(null);

  // Load existing entry if editing
  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    } else if (prefilledText) {
      setContent(prefilledText);
    }
  }, [entryId, prefilledText]);

  // Cleanup on unmount — unload any pending audio resources
  useEffect(() => {
    return () => {
      // AudioPlayer handles its own cleanup via its useEffect return
    };
  }, []);

  const loadEntry = async (id: string) => {
    try {
      const entry = await getEntryById(id);
      if (entry) {
        setTitle(entry.title);
        setContent(entry.transcript);
        setCategory(entry.category);
        setIsPinned(entry.isPinned);
      }
    } catch (error) {
      console.error('[CreateNoteScreen] Error loading entry:', error);
    }
  };

  // ── Manual Save ──────────────────────────────────────────────
  const handleManualSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Note', 'Please add a title or content before saving.');
      return;
    }

    try {
      setIsSaving(true);
      if (entryId) {
        await updateEntry(entryId, {
          title: title.trim(),
          transcript: content.trim(),
          category,
          isPinned,
        });
      } else {
        const newEntryId = await saveEntry(userId, {
          title: title.trim(),
          transcript: content.trim(),
          category,
          summary: '',
          mood: 'neutral',
          audioUri: audioFile || '',
          audioDuration: 0,
          isPinned,
        });
        navigation.setParams({ entryId: newEntryId } as any);
      }
      setHasUnsavedChanges(false);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Note saved', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('[CreateNoteScreen] Save error:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Back Navigation ──────────────────────────────────────────
  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. What would you like to do?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
          { text: 'Save', onPress: handleManualSave },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // ── View / Edit Toggle ───────────────────────────────────────
  const handleEdit = () => {
    setIsViewOnly(false);
    setTimeout(() => {
      contentInputRef.current?.focus();
    }, 100);
  };

  const handleView = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'Save your changes before switching to view mode?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => { setHasUnsavedChanges(false); setIsViewOnly(true); } },
          { text: 'Save', onPress: async () => { await handleManualSave(); setIsViewOnly(true); } },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      setIsViewOnly(true);
    }
  };

  // ── Category & Pin ───────────────────────────────────────────
  const toggleCategory = () => {
    const categories: Category[] = ['feelings', 'work', 'health', 'ideas', 'money', 'other'];
    const currentIndex = categories.indexOf(category);
    const nextIndex = (currentIndex + 1) % categories.length;
    setCategory(categories[nextIndex]);
    setHasUnsavedChanges(true);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    setHasUnsavedChanges(true);
  };

  const handleTextChange = (text: string) => {
    setContent(text);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasUnsavedChanges(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {isViewOnly ? (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.primary }]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text style={[styles.headerButtonText, { color: '#FFFFFF' }]}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surfaceAlt }]}
                onPress={handleView}
              >
                <Ionicons name="eye-outline" size={16} color={colors.text} />
                <Text style={[styles.headerButtonText, { color: colors.text }]}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  hasUnsavedChanges
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.primaryLight },
                ]}
                onPress={handleManualSave}
                disabled={isSaving || !hasUnsavedChanges}
              >
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={hasUnsavedChanges ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.headerButtonText,
                    { color: hasUnsavedChanges ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
        >
          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Title"
            placeholderTextColor={colors.textMuted}
            editable={!isViewOnly}
            multiline
            maxLength={100}
          />

          {/* Tools Strip */}
          <View style={styles.toolsStrip}>
            <TouchableOpacity
              style={[styles.categoryPill, { backgroundColor: CATEGORIES[category].color + '20' }]}
              onPress={toggleCategory}
              disabled={isViewOnly}
            >
              <Text style={styles.categoryEmoji}>{CATEGORIES[category].icon}</Text>
              <Text style={[styles.categoryLabel, { color: CATEGORIES[category].color }]}>
                {CATEGORIES[category].label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pinButton, { backgroundColor: isPinned ? colors.accent + '20' : colors.surfaceAlt }]}
              onPress={togglePin}
              disabled={isViewOnly}
            >
              <Text style={styles.pinEmoji}>📌</Text>
              <Text style={[styles.pinLabel, { color: isPinned ? colors.accent : colors.textMuted }]}>
                {isPinned ? 'Pinned' : 'Pin'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Audio Player */}
          {audioFile && (
            <View style={styles.audioSection}>
              <AudioPlayer audioUri={audioFile} />
            </View>
          )}

          {/* Content — plain text in view mode, TextInput in edit mode */}
          {isViewOnly ? (
            content.trim() ? (
              <ScrollView style={styles.viewContentContainer} nestedScrollEnabled>
                <Text style={[styles.viewContent, { color: colors.text }]}>
                  {content}
                </Text>
              </ScrollView>
            ) : (
              <Text style={[styles.emptyContent, { color: colors.textMuted }]}>
                Empty note
              </Text>
            )
          ) : (
            <TextInput
              ref={contentInputRef}
              style={[styles.contentInput, { color: colors.text }]}
              value={content}
              onChangeText={handleTextChange}
              placeholder="Start writing..."
              placeholderTextColor={colors.textMuted}
              editable={!isViewOnly}
              multiline
              textAlignVertical="top"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.lg,
    padding: 0,
  },
  toolsStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  pinEmoji: {
    fontSize: 14,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  audioSection: {
    marginBottom: spacing.xl,
  },
  viewContentContainer: {
    maxHeight: 400,
  },
  viewContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
  },
  emptyContent: {
    fontSize: 16,
    fontStyle: 'italic',
    minHeight: 300,
  },
});
