# Mhat Tan — UI Redesign Implementation Plan

This document provides a comprehensive, step-by-step technical plan for migrating the premium UI/UX enhancements and refactored data structures from the prototype [prototype.html](file:///home/pc/Documents/AI%20vibe%20coding/team-09-app/prototype.html) into the production React Native / Expo application codebase.

---

## 1. Data Structure & Type Updates

Refactor the database entity definition to bind voice recordings directly to note entries.

### Type Definitions (`src/types/index.ts`)
Update the `Entry` type definition to support optional audio file attachments, view-only modes, and pinning options:

```typescript
export interface Entry {
  id: string;
  userId: string;
  title: string;
  transcript: string;
  category: 'money' | 'feelings' | 'work' | 'health' | 'ideas' | 'other';
  isPinned: boolean;
  audioFile?: string; // Links to locally saved .m4a audio URI
  createdAt: Date;
  updatedAt: Date;
}
```

### Storage Helpers (`src/services/storage.ts`)
Ensure that the local SQLite / AsyncStorage save functions correctly write the `audioFile` reference directly into the entry payload.

---

## 2. HomeScreen Refactoring (`src/screens/HomeScreen.tsx`)

Convert the dashboard into a minimal, screen-wide agenda list grouped by date.

### A. Remove Standalone Recordings Section
Locate and delete the recordings list container `<section class="recordings-section">` at the bottom of the screen.

### B. Header & Stats Refactoring
* **Avatar Header**: Render a header row containing the user greeting and a circular avatar container styled with initials (e.g., "KA"):
  ```tsx
  <View style={styles.avatarBadge}>
    <Text style={styles.avatarText}>KA</Text>
  </View>
  ```
* **Stats Row**: Compute statistics dynamically from loaded entries:
  * **Today**: `entries.filter(e => isToday(e.createdAt)).length`
  * **This Week**: `entries.filter(e => isThisWeek(e.createdAt)).length` (Style this card with a pink accent background and drop shadow).
  * **Total**: `entries.length`

### C. Category Chips Selector
Build a horizontal `<ScrollView horizontal showsHorizontalScrollIndicator={false}>` chip row. Clicking a category filters the chronological timeline list in real-time.

### D. Pinned vs. Chronological Feed Layout
Modify the render list logic to split entries into two sections:
1. **Pinned Entries Section**:
   * Renders at the very top of the feed under a `📌 Pinned Entries` header.
   * Renders only if entries with `isPinned === true` exist.
2. **Recent Entries Section**:
   * Renders unpinned entries grouped by day (e.g. "Friday – Jul 17").
   * Filter the list to display **only the 5 most recent unpinned entries** to keep the homepage feed lightweight.
   * Hide items in this list if they are already displayed in the Pinned section above.

### E. Inline Play Button and Audio Badge
For items containing `audioFile` properties:
* Display a small microphone `🎙️ Audio` badge next to the category label in the entry subtitle.
* Render a circular play button (`.agenda-play-btn`) next to the pencil edit icon:
  ```tsx
  {item.audioFile && (
    <TouchableOpacity 
      style={[styles.agendaPlayBtn, isPlaying && styles.agendaPlayBtnPlaying]}
      onPress={() => handleTogglePlayback(item.id, item.audioFile)}
    >
      <Ionicons name={isPlaying ? "stop" : "play"} size={12} color="#E91E63" />
    </TouchableOpacity>
  )}
  ```

---

## 3. Bottom Sheet Navigation Drawer

Replace the old floating popover selector with a modern, bottom-anchored modal drawer.

### A. Setup Overlay Backdrop
Implement an animated dark backdrop overlay overlaying both the viewport content and bottom tab navigation:
```typescript
const [sheetVisible, setSheetVisible] = useState(false);
const slideAnim = useRef(new Animated.Value(300)).current; // Bottom sheet height
```

### B. Bottom-Anchored Layout
Render the bottom sheet drawer absolute-positioned at the bottom of the viewport with hardware-accelerated transitions:
```tsx
<Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
  <View style={styles.handleBar} />
  
  {/* Primary Record Card Option */}
  <TouchableOpacity style={styles.recordActionCard} onPress={triggerVoiceRecording}>
    <Ionicons name="mic-outline" size={24} color="#E91E63" />
    <View>
      <Text style={styles.actionTitle}>🎙️ Record Voice</Text>
      <Text style={styles.actionSub}>Speak your mind — AI transcribes & categorizes</Text>
    </View>
  </TouchableOpacity>

  {/* Manual Note Card Option */}
  <TouchableOpacity style={styles.noteActionCard} onPress={triggerManualNote}>
    <Ionicons name="document-text-outline" size={24} color="#2196F3" />
    <View>
      <Text style={styles.actionTitle}>📝 New Note</Text>
      <Text style={styles.actionSub}>Type or paste text directly</Text>
    </View>
  </TouchableOpacity>
</Animated.View>
```

---

## 4. Voice Recording Workflow Redirection (`src/screens/RecordScreen.tsx`)

Streamline the Speech-to-Text recording workflow by bypassing the review details overlay and navigating directly into the new note notepad canvas.

### A. Remove the Bottom Details overlay
* Locate the bottom details preview sheet (`#sim-bottom-details` equivalents in JSX) and strip it out completely.
* Remove the audio preview playback timeline elements inside the recording view.

### B. Trigger Immediate Redirection
Inside the transcription conclusion callback (the step where the AI returns text and predicted categories):
1. Save the audio recording locally to obtain a permanent `.m4a` file path.
2. Navigate programmatically straight to the **New Note (Create Note)** notepad canvas.
3. Pass parameters to initialize the Create page:
   ```typescript
   navigation.navigate('CreateNote', {
     prefilledText: transcribedText,
     predictedCategory: predictedCategory, // e.g. 'work'
     audioFile: savedAudioUri,
     startViewOnly: true // Trigger view-only state initially
   });
   ```

---

## 5. Unified Notepad Viewports (Create & Edit Screens)

Provide a distraction-free notepad writing space with full support for embedded audio playbacks, view-only modes, and autosaving.

### A. Distraction-Free Styling System
* **No Field Labels**: Remove static field label containers ("Title (Optional)", "Content").
* **Canvas Title Input**: Styled as a boundaryless, transparent text input field matching the viewport background with high-contrast bold typography and placeholder `"Untitled"`.
* **Notepad Textarea**: Expands to take up all remaining vertical space inside the notepad layout.
* **Tools Strip**: Fits category pills and the pin toggle badge right beneath the title header.

### B. Custom Dark-Themed Audio Player Component
If the notepad view contains a voice recording draft (via `audioFile` references), render the `.notepad-audio-player` container:
* Displays the file name `🎙️ recording-20260717-1245.m4a`.
* Contains a circular play/pause button that controls `expo-av` playback.
* Features a track progress bar displaying playback status and remaining time:
  ```tsx
  const sound = new Audio.Sound();
  await sound.loadAsync({ uri: audioFile });
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis / status.durationMillis);
      setDurationReadout(formatTime(status.positionMillis) + " / " + formatTime(status.durationMillis));
    }
  });
  ```

### C. Redirect View-Only State with Save & Edit Controllers
When opening the New Note screen via the voice recorder redirect (`startViewOnly: true`):
1. **Apply Read-Only**: Set `editable={false}` attributes on the Title text input and transcript textarea.
2. **Lock Selection Row**: Add `pointerEvents="none"` and `opacity: 0.7` to the category chips tool row.
3. **Render Bottom View Actions**: Display `[ Edit Note ]` and `[ Save Note ]` action buttons:
   * Clicking **Save Note** calls the save helper and navigates back to the timeline.
   * Clicking **Edit Note** removes all read-only restrictions, focuses the text area cursor, and switches the bottom bar to show only the full-width primary **[ Save Note ]** button.
4. **Manual Creation Mode**: Standard manual additions start in editing mode from the start, displaying the full-width **Save Note** button directly at the bottom.

### D. Autosaving Engine
Bind text input listener hooks to triggers:
* **Edit Note Screen**: Live-saves fields to memory dynamically as the user types (with debounced SQLite query executions).
* **Back-Navigation Save**: Tapping the top-left back navigation icon triggers an immediate flush to memory, showing a Toast popup `"Changes saved automatically"` or `"Note saved automatically"`. For new notes, prevent blank drafts by saving only if transcript text content is not empty.
