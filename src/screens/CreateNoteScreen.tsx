// CreateNoteScreen - Unified notepad for creating and editing notes
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Alert,
  ActivityIndicator,
  DeviceEventEmitter,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { CATEGORIES, Category, spacing, radius, MOOD_EMOJI } from "../theme";
import { MOODS } from "../db/schema";

type Mood = (typeof MOODS)[number];
import {
  getEntryById,
  getEntries,
  saveEntry,
  updateEntry,
  deleteEntry,
} from "../services/storage";
import { deleteAudioFile, audioFileExists } from "../services/audioStorage";
import { useAuth } from "../context/AuthContext";
import AudioPlayer from "../components/AudioPlayer";
import { Skeleton } from "../components/Skeleton";
import { PinLimitModal } from "../components/PinLimitModal";
import { checkPinLimit, pinEntry, replacePin } from "../utils/pinLimit";

type CreateNoteParams = {
  entryId?: string;
  prefilledText?: string;
  predictedCategory?: Category;
  audioFile?: string;
  startViewOnly?: boolean;
};

export const CreateNoteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: CreateNoteParams }, "params">>();
  const { theme } = useTheme();
  const { colors } = theme;
  const { userId } = useAuth();

  const {
    entryId,
    prefilledText,
    predictedCategory,
    audioFile: initialAudioFile,
    startViewOnly = false,
  } = route.params || {};

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>(
    predictedCategory || "other",
  );
  const [mood, setMood] = useState<Mood>("neutral");
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(startViewOnly);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [pendingPinEntry, setPendingPinEntry] = useState<any | null>(null);
  const [pinnedForReplace, setPinnedForReplace] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [audioFile, setAudioFile] = useState<string | undefined>(
    initialAudioFile,
  );
  const [isDeletingAudio, setIsDeletingAudio] = useState(false);
  const [audioKey, setAudioKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const contentInputRef = useRef<TextInput>(null);

  // Load entry or initialize states based on route params
  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
      setIsViewOnly(startViewOnly);
    } else {
      // Clear/Reset all fields for new note
      setTitle("");
      setContent(prefilledText || "");
      setCategory(predictedCategory || "other");
      setMood("neutral");
      setIsPinned(false);
      setIsViewOnly(startViewOnly);
      setAudioFile(initialAudioFile);
      setHasUnsavedChanges(false);
    }
  }, [entryId, prefilledText, predictedCategory, initialAudioFile, startViewOnly]);

  // Load all entries for pin limit check
  useEffect(() => {
    getEntries(userId).then(setAllEntries);
  }, []);

  // Cleanup on unmount — unload any pending audio resources
  useEffect(() => {
    return () => {
      // AudioPlayer handles its own cleanup via its useEffect return
    };
  }, []);

  const loadEntry = async (id: string) => {
    setIsLoading(true);
    try {
      const entry = await getEntryById(id);
      if (entry) {
        setTitle(entry.title);
        setContent(entry.transcript);
        setCategory(entry.category);
        if (entry.mood && (MOODS as readonly string[]).includes(entry.mood)) {
          setMood(entry.mood as Mood);
        } else {
          setMood("neutral");
        }
        setIsPinned(entry.isPinned);
        if (entry.audioUri) {
          setAudioFile(entry.audioUri);
        } else {
          setAudioFile(undefined);
        }
      }
    } catch (error) {
      console.error("[CreateNoteScreen] Error loading entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Manual Save ──────────────────────────────────────────────
  const handleManualSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Empty Note", "Please add a title or content before saving.");
      return;
    }

    try {
      setIsSaving(true);

      // Generate a default title if empty
      let finalTitle = title.trim();
      if (!finalTitle) {
        const words = content.trim().split(/\s+/).slice(0, 6).join(' ');
        finalTitle = words.length > 0 ? words : 'Voice Note';
        setTitle(finalTitle); // sync state so user sees it
      }

      if (entryId) {
        await updateEntry(entryId, {
          title: finalTitle,
          transcript: content.trim(),
          category,
          mood,
          isPinned,
        });
      } else {
        const newEntryId = await saveEntry(userId, {
          title: finalTitle,
          transcript: content.trim(),
          category,
          summary: "",
          mood,
          audioUri: audioFile || "",
          audioDuration: 0,
          isPinned,
        });
        setHasUnsavedChanges(false);
        if (Platform.OS === "android") {
          ToastAndroid.show("Note saved", ToastAndroid.SHORT);
        }
        // Redirect back for new notes
        navigation.goBack();
        return;
      }
      setHasUnsavedChanges(false);
      if (Platform.OS === "android") {
        ToastAndroid.show("Note saved", ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error("[CreateNoteScreen] Save error:", error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = () => {
    if (!entryId) return;

    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEntry(entryId);
            navigation.goBack();
          } catch (error) {
            console.error("[CreateNoteScreen] Delete error:", error);
            Alert.alert("Error", "Failed to delete entry.");
          }
        },
      },
    ]);
  };

  // ── Back Navigation ──────────────────────────────────────────
  const handleBack = () => {
    if (hasUnsavedChanges || !entryId) {
      Alert.alert(
        "Discard Note?",
        "This note has not been saved yet. What would you like to do?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              if (audioFile && !entryId) {
                deleteAudioFile(audioFile);
              }
              navigation.goBack();
            },
          },
          { text: "Save", onPress: handleManualSave },
          { text: "Cancel", style: "cancel" },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Discard Note?",
      "Are you sure you want to discard this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            if (audioFile && !entryId) {
              deleteAudioFile(audioFile);
            }
            navigation.goBack();
          },
        },
      ]
    );
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
        "Unsaved Changes",
        "Save your changes before switching to view mode?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setHasUnsavedChanges(false);
              setIsViewOnly(true);
            },
          },
          {
            text: "Save",
            onPress: async () => {
              await handleManualSave();
              setIsViewOnly(true);
            },
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
    } else {
      setIsViewOnly(true);
    }
  };

  // ── Category & Pin ───────────────────────────────────────────
  const applyCategory = async (newCategory: Category) => {
    setCategory(newCategory);
    // Auto-save if editing an existing entry
    if (entryId) {
      try {
        await updateEntry(entryId, { category: newCategory });
      } catch (err) {
        console.error("[CreateNoteScreen] Auto-save category failed:", err);
      }
    } else {
      setHasUnsavedChanges(true);
    }
  };

  const toggleCategory = async () => {
    const categories: Category[] = [
      "feelings",
      "work",
      "health",
      "ideas",
      "money",
      "other",
    ];
    const currentIndex = categories.indexOf(category);
    const nextIndex = (currentIndex + 1) % categories.length;
    await applyCategory(categories[nextIndex]);
  };

  const handleCategoryPick = (newCategory: Category) => {
    setCategoryModalVisible(false);
    applyCategory(newCategory);
  };

  const moodActive = mood !== "neutral";
  const applyMood = async (newMood: Mood) => {
    setMood(newMood);
    if (entryId) {
      try {
        await updateEntry(entryId, { mood: newMood });
      } catch (err) {
        console.error("[CreateNoteScreen] Auto-save mood failed:", err);
      }
    } else {
      setHasUnsavedChanges(true);
    }
  };

  const toggleMood = () => {
    const currentIndex = MOODS.indexOf(mood);
    const nextIndex = (currentIndex + 1) % MOODS.length;
    applyMood(MOODS[nextIndex]);
  };

  const handleMoodPick = (newMood: Mood) => {
    setMoodModalVisible(false);
    applyMood(newMood);
  };

  const togglePin = async () => {
    // Unpinning is always allowed
    if (isPinned) {
      setIsPinned(false);
      if (entryId) {
        try {
          await updateEntry(entryId, { isPinned: false });
          if (Platform.OS === "android") {
            ToastAndroid.show("Unpinned", ToastAndroid.SHORT);
          }
        } catch (err) {
          console.error("[CreateNoteScreen] Auto-save pin failed:", err);
        }
      } else {
        setHasUnsavedChanges(true);
      }
      return;
    }

    // Pinning — check limit
    const currentEntry = entryId
      ? allEntries.find((e) => e.id === entryId)
      : null;
    const entryToCheck =
      currentEntry || ({ id: entryId || "new", isPinned: false } as any);
    const needsReplace = checkPinLimit(allEntries, entryToCheck);

    if (needsReplace) {
      setPendingPinEntry(entryToCheck);
      setPinnedForReplace(needsReplace);
      setPinModalVisible(true);
      return;
    }

    // Under limit, pin directly
    setIsPinned(true);
    if (entryId) {
      try {
        await pinEntry(entryToCheck);
        if (Platform.OS === "android") {
          ToastAndroid.show("Pinned", ToastAndroid.SHORT);
        }
      } catch (err) {
        console.error("[CreateNoteScreen] Auto-save pin failed:", err);
      }
    } else {
      setHasUnsavedChanges(true);
    }
  };

  const handleReplacePin = async (entryToUnpin: any) => {
    if (!pendingPinEntry) return;
    try {
      await replacePin(entryToUnpin, pendingPinEntry);
      setPinModalVisible(false);
      setPendingPinEntry(null);
      setPinnedForReplace([]);
      setIsPinned(true);
      if (Platform.OS === "android") {
        ToastAndroid.show("Pinned", ToastAndroid.SHORT);
      }
      // Refresh all entries
      const refreshed = await getEntries(userId);
      setAllEntries(refreshed);
    } catch (err) {
      console.error("[CreateNoteScreen] Replace pin failed:", err);
    }
  };

  const handleCancelPinLimit = () => {
    setPinModalVisible(false);
    setPendingPinEntry(null);
    setPinnedForReplace([]);
  };

  const handleDeleteAudio = () => {
    Alert.alert(
      "Delete Recording?",
      "This will remove the audio from this note.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeletingAudio(true);
              deleteAudioFile(audioFile || "");
              // Keep audioUri in database — AudioPlayer will show "Recording unavailable"
              setAudioKey((prev) => prev + 1); // Force AudioPlayer to re-check file
              // Notify other screens (HomeScreen) that audio was deleted
              DeviceEventEmitter.emit("audio-deleted", { uri: audioFile });
            } catch (err) {
              console.error("[CreateNoteScreen] Delete audio failed:", err);
            } finally {
              setIsDeletingAudio(false);
            }
          },
        },
      ],
    );
  };

  const handleTextChange = (text: string) => {
    setContent(text);
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasUnsavedChanges(true);
  };

  const renderEditorSkeleton = () => (
    <View style={styles.scrollContent}>
      {/* Title placeholder */}
      <View style={{ marginBottom: spacing.lg }}>
        <Skeleton width="55%" height={34} borderRadius={radius.sm} />
      </View>

      {/* Tools strip */}
      <View style={[styles.toolsStrip, { marginBottom: spacing.xl }]}>
        <Skeleton width={88} height={32} borderRadius={radius.full} />
        <Skeleton width={88} height={32} borderRadius={radius.full} />
      </View>

      {/* Audio placeholder — only when the note has audio */}
      {initialAudioFile && (
        <View style={styles.audioSection}>
          <Skeleton height={44} borderRadius={radius.md} style={{ flex: 1 }} />
          <Skeleton width={32} height={32} borderRadius={radius.sm} />
        </View>
      )}

      {/* Paper card */}
      <View
        style={[
          styles.paperCard,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        ]}
      >
        <View style={styles.skeletonCardGap}>
          <Skeleton width="92%" height={16} />
          <Skeleton width="85%" height={16} />
          <Skeleton width="60%" height={16} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {isViewOnly ? (
            <>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={16} color={colors.text} />
                <Text style={[styles.headerButtonText, { color: colors.text }]}>
                  Edit
                </Text>
              </TouchableOpacity>
              {entryId && (
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    { backgroundColor: colors.danger + "15" },
                  ]}
                  onPress={handleDelete}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={handleView}
              >
                <Ionicons name="eye-outline" size={16} color={colors.text} />
                <Text style={[styles.headerButtonText, { color: colors.text }]}>
                  View
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleManualSave}
              >
                <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                <Text style={[styles.headerButtonText, { color: "#FFFFFF" }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {isLoading ? renderEditorSkeleton() : (
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
              style={[
                styles.categoryPill,
                { backgroundColor: CATEGORIES[category].color + "20" },
              ]}
              onPress={toggleCategory}
              onLongPress={() => setCategoryModalVisible(true)}
              delayLongPress={450}
            >
              <Text style={styles.categoryEmoji}>
                {CATEGORIES[category].icon}
              </Text>
              <Text
                style={[
                  styles.categoryLabel,
                  { color: CATEGORIES[category].color },
                ]}
              >
                {CATEGORIES[category].label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pinButton,
                {
                  backgroundColor: isPinned
                    ? colors.accent + "20"
                    : colors.surfaceAlt,
                },
              ]}
              onPress={togglePin}
            >
              <Text style={styles.pinEmoji}>📌</Text>
              <Text
                style={[
                  styles.pinLabel,
                  { color: isPinned ? colors.accent : colors.textMuted },
                ]}
              >
                {isPinned ? "Pinned" : "Pin"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.moodPill,
                {
                  backgroundColor: moodActive
                    ? colors.primary + "20"
                    : colors.surfaceAlt,
                },
              ]}
              onPress={toggleMood}
              onLongPress={() => setMoodModalVisible(true)}
              delayLongPress={450}
            >
              <Text style={styles.moodEmoji}>
                {MOOD_EMOJI[mood] || "😐"}
              </Text>
              <Text
                style={[
                  styles.moodLabel,
                  { color: moodActive ? colors.primary : colors.textMuted },
                ]}
              >
                {mood}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Audio Player */}
          {audioFile && (
            <View style={styles.audioSection}>
              <View style={styles.audioPlayerWrapper}>
                {isDeletingAudio ? (
                  <View style={styles.deletingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text
                      style={[styles.deletingText, { color: colors.textMuted }]}
                    >
                      Deleting...
                    </Text>
                  </View>
                ) : (
                  <AudioPlayer key={audioKey} audioUri={audioFile} />
                )}
              </View>
              {audioFileExists(audioFile) && !isDeletingAudio && (
                <TouchableOpacity
                  style={styles.deleteAudioBtn}
                  onPress={handleDeleteAudio}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content — paper card in both view and edit mode */}
          <View
            style={[
              styles.paperCard,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}
          >
            {isViewOnly ? (
              content.trim() ? (
                <ScrollView
                  style={styles.viewContentContainer}
                  nestedScrollEnabled
                >
                  <Text style={[styles.viewContent, { color: colors.text }]}>
                    {content}
                  </Text>
                </ScrollView>
              ) : (
                <Text
                  style={[styles.emptyContent, { color: colors.textMuted }]}
                >
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
          </View>
        </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Bottom Actions Bar */}
      {isViewOnly ? (
        // View Only Mode
        <View
          style={[
            styles.bottomActions,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          {entryId ? (
            <TouchableOpacity
              style={[
                styles.bottomButton,
                styles.bottomButtonSecondary,
                { borderColor: colors.border },
              ]}
              onPress={handleEdit}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.bottomButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                Edit Note
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.bottomButton,
                  styles.bottomButtonSecondary,
                  { borderColor: colors.border },
                ]}
                onPress={handleSkip}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.bottomButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Skip
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bottomButton, { backgroundColor: colors.primary }]}
                onPress={handleManualSave}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={[styles.bottomButtonText, { color: "#FFFFFF" }]}>
                  Save Note
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        // Edit Mode
        <View
          style={[
            styles.bottomActions,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: colors.primary }]}
            onPress={handleManualSave}
          >
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.bottomButtonText, { color: "#FFFFFF" }]}>
              Save Note
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <PinLimitModal
        visible={pinModalVisible}
        pinnedEntries={pinnedForReplace}
        newEntryTitle={title || content || "new entry"}
        onSelectReplace={handleReplacePin}
        onCancel={handleCancelPinLimit}
      />

      {/* Category Picker Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View
            style={[
              styles.categorySheet,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.categorySheetTitle, { color: colors.text }]}>
              Select Category
            </Text>
            {(Object.keys(CATEGORIES) as Category[]).map((c) => {
              const isActive = c === category;
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: isActive
                        ? CATEGORIES[c].color + "20"
                        : "transparent",
                    },
                  ]}
                  onPress={() => handleCategoryPick(c)}
                >
                  <Text style={styles.categoryOptionIcon}>
                    {CATEGORIES[c].icon}
                  </Text>
                  <Text
                    style={[
                      styles.categoryOptionLabel,
                      { color: colors.text },
                    ]}
                  >
                    {CATEGORIES[c].label}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={CATEGORIES[c].color}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Mood Picker Modal */}
      <Modal
        visible={moodModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoodModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMoodModalVisible(false)}
        >
          <View
            style={[
              styles.categorySheet,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.categorySheetTitle, { color: colors.text }]}>
              Select Mood
            </Text>
            {MOODS.map((m) => {
              const isActive = m === mood;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: isActive
                        ? colors.primary + "20"
                        : "transparent",
                    },
                  ]}
                  onPress={() => handleMoodPick(m)}
                >
                  <Text style={styles.categoryOptionIcon}>
                    {MOOD_EMOJI[m] || "😐"}
                  </Text>
                  <Text
                    style={[
                      styles.categoryOptionLabel,
                      { color: colors.text },
                    ]}
                  >
                    {m}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
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
    fontWeight: "700",
    marginBottom: spacing.lg,
    padding: 0,
  },
  toolsStrip: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "500",
  },
  pinButton: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  categorySheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  categorySheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  categoryOptionIcon: {
    fontSize: 20,
    width: 28,
  },
  categoryOptionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  audioSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  moodEmoji: {
    fontSize: 14,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  audioPlayerWrapper: {
    flex: 1,
  },
  deleteAudioBtn: {
    padding: spacing.sm,
  },
  deletingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: radius.md,
  },
  deletingText: {
    fontSize: 14,
  },
  // Paper card style
  paperCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 200,
  },
  viewContentContainer: {
    maxHeight: 400,
  },
  viewContent: {
    fontSize: 16,
    lineHeight: 30,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 30,
    minHeight: 300,
    padding: 0,
  },
  skeletonCardGap: {
    gap: spacing.md,
  },
  emptyContent: {
    fontSize: 16,
    fontStyle: "italic",
    minHeight: 300,
  },
  bottomActions: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
  },
  bottomButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  bottomButtonSecondary: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  bottomButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
