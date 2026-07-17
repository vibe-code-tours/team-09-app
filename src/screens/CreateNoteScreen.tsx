// CreateNoteScreen - Unified notepad for creating and editing notes
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import Markdown from 'react-native-markdown-display';
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing entry if editing
  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    } else if (prefilledText) {
      setContent(prefilledText);
    }
  }, [entryId, prefilledText]);

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
      console.error('Error loading entry:', error);
    }
  };

  // Autosave with debounce
  const scheduleAutosave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!title.trim() && !content.trim()) {
        // Don't save blank drafts
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
          // Create new entry
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
          // Update route params with new entry ID for future saves
          navigation.setParams({ entryId: newEntryId } as any);
        }
        setHasUnsavedChanges(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Changes saved automatically', ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error('Autosave error:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000); // 2 second debounce
  }, [title, content, category, isPinned, entryId, userId, audioFile, navigation]);

  // Trigger autosave on text changes
  useEffect(() => {
    if (hasUnsavedChanges && !isViewOnly) {
      scheduleAutosave();
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, category, isPinned, hasUnsavedChanges, isViewOnly, scheduleAutosave]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      // Save before going back
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true);
      saveEntryFinally();
    } else {
      navigation.goBack();
    }
  };

  const saveEntryFinally = async () => {
    try {
      if (!title.trim() && !content.trim()) {
        navigation.goBack();
        return;
      }

      if (entryId) {
        await updateEntry(entryId, {
          title: title.trim(),
          transcript: content.trim(),
          category,
          isPinned,
        });
      } else {
        await saveEntry(userId, {
          title: title.trim(),
          transcript: content.trim(),
          category,
          summary: '',
          mood: 'neutral',
          audioUri: audioFile || '',
          audioDuration: 0,
          isPinned,
        });
      }
      if (Platform.OS === 'android') {
        ToastAndroid.show('Note saved', ToastAndroid.SHORT);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsViewOnly(false);
    setTimeout(() => {
      contentInputRef.current?.focus();
    }, 100);
  };

  const handleSaveAndView = async () => {
    setIsSaving(true);
    await saveEntryFinally();
    setIsViewOnly(true);
  };

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
            <>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.primaryLight }]}
                onPress={handleEdit}
              >
                <Text style={[styles.headerButtonText, { color: colors.primary }]}>Edit Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveAndView}
                disabled={isSaving}
              >
                <Text style={[styles.headerButtonText, { color: '#FFFFFF' }]}>
                  {isSaving ? 'Saving...' : 'Save Note'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.headerRight}>
              {isSaving && (
                <Text style={[styles.savingText, { color: colors.textMuted }]}>Saving...</Text>
              )}
            </View>
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

          {/* Content — rendered markdown in view mode, raw text in edit mode */}
          {isViewOnly ? (
            content.trim() ? (
              <Markdown
                style={markdownStyles(colors)}
                mergeStyle
              >
                {content}
              </Markdown>
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
              placeholder="Start writing... (supports **markdown**)"
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingText: {
    fontSize: 12,
    marginRight: spacing.sm,
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

// Markdown styles that match the app theme
function markdownStyles(colors: { text: string; textSecondary: string; textMuted: string; primary: string; border: string }) {
  return {
    body: { color: colors.text, fontSize: 16, lineHeight: 24 },
    heading1: { color: colors.text, fontSize: 28, fontWeight: '700' as const, marginBottom: 12, marginTop: 16 },
    heading2: { color: colors.text, fontSize: 24, fontWeight: '700' as const, marginBottom: 8, marginTop: 12 },
    heading3: { color: colors.text, fontSize: 20, fontWeight: '600' as const, marginBottom: 8, marginTop: 12 },
    bold: { fontWeight: '700' as const },
    italic: { fontStyle: 'italic' as const },
    link: { color: colors.primary },
    blockquote: { borderLeftColor: colors.border, borderLeftWidth: 3, paddingLeft: 12, color: colors.textSecondary },
    code_block: { backgroundColor: colors.border, padding: 12, borderRadius: 8, fontFamily: 'monospace' as const },
    fence: { backgroundColor: colors.border, padding: 12, borderRadius: 8 },
    bullet_list: { marginVertical: 8 },
    ordered_list: { marginVertical: 8 },
    list_item: { marginVertical: 4 },
    hr: { backgroundColor: colors.border, height: 1, marginVertical: 16 },
  };
}
