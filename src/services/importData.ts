// Import Data Service — restores entries, settings, and audio from a ZIP backup
import { File, Directory, Paths } from 'expo-file-system';
import { writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import { getDb } from '../db';
import { entries, userSettings, weeklySummaries } from '../db/schema';
import { eq } from 'drizzle-orm';

// ── Types ─────────────────────────────────────────────────

interface ExportEntry {
  id: string;
  userId: string;
  title: string | null;
  entryType: string;
  transcript: string;
  editedTranscript: string | null;
  mood: string | null;
  moodConfidence: number | null;
  summary: string | null;
  categoryConfidence: number | null;
  processingStatus: string;
  audioPath: string;
  audioDuration: number;
  occurredAt: string;
  timezone: string;
  isPinned: boolean;
  isDeleted: boolean;
  syncStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface ExportSettings {
  userId: string;
  languageCode: string;
  currency: string;
  autoTranscribe: boolean;
  theme: string;
  notifications: boolean;
  reminderTime: string;
  weeklySummary: boolean;
  weeklySummaryLanguage: string;
  createdAt: string;
  updatedAt: string;
}

interface ExportWeeklySummary {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  summaryMy: string | null;
  summaryEn: string | null;
  categoryBreakdown: string | null;
  moodTrend: string | null;
  entryCount: number;
  totalDuration: number;
  language: string;
  createdAt: string;
}

interface ExportData {
  version: '1.0.0';
  exportedAt: string;
  appId: 'mhat-tan';
  entries: ExportEntry[];
  settings: ExportSettings[];
  weeklySummaries: ExportWeeklySummary[];
}

interface ImportResult {
  entriesImported: number;
  settingsImported: number;
  summariesImported: number;
  audioFilesImported: number;
}

// ── Helpers ───────────────────────────────────────────────

const RECORDINGS_DIR = new Directory(Paths.document, 'recordings');

function ensureDir(dir: Directory) {
  if (!dir.exists) {
    dir.create();
  }
}

// ── Import ────────────────────────────────────────────────

/**
 * Pick a ZIP file from the device and import its contents.
 * Returns the import result with counts of imported items.
 */
export const importDataFromZip = async (targetUserId: string): Promise<ImportResult> => {
  // 1. Pick a ZIP file
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/zip',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    throw new Error('No file selected');
  }

  const fileUri = result.assets[0].uri;

  // 2. Read the ZIP file
  const zipFile = new File(fileUri);
  if (!zipFile.exists) {
    throw new Error('Selected file not found');
  }

  const zipBase64 = zipFile.base64();
  const zip = await JSZip.loadAsync(zipBase64, { base64: true });

  // 3. Parse the metadata JSON
  const jsonFile = zip.file('mhat-tan-export.json');
  if (!jsonFile) {
    throw new Error('Invalid backup file: missing mhat-tan-export.json');
  }

  const jsonText = await jsonFile.async('text');
  const exportData: ExportData = JSON.parse(jsonText);

  if (exportData.appId !== 'mhat-tan') {
    throw new Error('This is not a Mhat Tan backup file');
  }

  // 4. Import audio files first (before DB inserts)
  ensureDir(RECORDINGS_DIR);
  let audioFilesImported = 0;
  const audioMapping = new Map<string, string>(); // old path -> new path

  const recordingsFolder = zip.folder('recordings');
  if (recordingsFolder) {
    // zip.folder() returns a clone sharing the parent's files map, so the keys
    // here are root-relative — they include mhat-tan-export.json as well as the
    // audio files. Filter to the folder's own directory entry name (e.g.
    // "recordings/") so only real audio files inside the folder are imported.
    const folderName = recordingsFolder.files['recordings/']?.name ?? 'recordings/';
    for (const [filename, fileData] of Object.entries(recordingsFolder.files)) {
      if (fileData.dir) continue; // skip the recordings/ directory entry
      if (!filename.startsWith(folderName)) continue; // skip root-level files

      try {
        // JSZip returns keys with folder prefix, e.g. "recordings/recording-xxx.m4a"
        const basename = filename.split('/').pop() || filename;
        const content = await fileData.async('base64');
        const destFile = new File(RECORDINGS_DIR, basename);
        // Use the legacy writeAsStringAsync — the new File.write() with an options
        // object throws "Received 2 arguments, but 1 was expected" on iOS (Expo Go SDK 54).
        await writeAsStringAsync(destFile.uri, content, { encoding: EncodingType.Base64 });
        audioFilesImported++;

        // Map the old audio path to the new one
        // Old paths look like: file:///data/.../recordings/recording-xxx.m4a
        // We match by the basename (filename after last /)
        for (const entry of exportData.entries) {
          const oldBasename = entry.audioPath.split('/').pop();
          if (oldBasename === basename) {
            audioMapping.set(entry.audioPath, destFile.uri);
          }
        }
      } catch (err) {
        console.warn('[ImportData] Failed to import audio:', filename, err);
      }
    }
  }

  // 5. Import entries
  const db = getDb();
  let entriesImported = 0;

  for (const entry of exportData.entries) {
    try {
      // Skip if entry already exists
      const existing = await db
        .select({ id: entries.id })
        .from(entries)
        .where(eq(entries.id, entry.id))
        .limit(1);

      if (existing.length > 0) continue;

      // Map audio path if we have a new location
      const newAudioPath = audioMapping.get(entry.audioPath) || entry.audioPath;

      await db.insert(entries).values({
        id: entry.id,
        userId: targetUserId, // Re-map to current user
        title: entry.title,
        entryType: entry.entryType,
        transcript: entry.transcript,
        editedTranscript: entry.editedTranscript,
        mood: entry.mood,
        moodConfidence: entry.moodConfidence,
        summary: entry.summary,
        categoryConfidence: entry.categoryConfidence,
        processingStatus: entry.processingStatus,
        audioPath: newAudioPath,
        audioDuration: entry.audioDuration,
        occurredAt: new Date(entry.occurredAt),
        timezone: entry.timezone,
        isPinned: entry.isPinned,
        isDeleted: entry.isDeleted,
        syncStatus: 'pending',
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      });
      entriesImported++;
    } catch (err) {
      console.warn('[ImportData] Failed to import entry:', entry.id, err);
    }
  }

  // 6. Import settings
  let settingsImported = 0;
  for (const setting of exportData.settings) {
    try {
      // Upsert settings for the current user
      const existing = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, targetUserId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userSettings)
          .set({
            languageCode: setting.languageCode,
            currency: setting.currency,
            autoTranscribe: setting.autoTranscribe,
            theme: setting.theme,
            notifications: setting.notifications,
            reminderTime: setting.reminderTime,
            weeklySummary: setting.weeklySummary,
            weeklySummaryLanguage: setting.weeklySummaryLanguage,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, targetUserId));
      } else {
        await db.insert(userSettings).values({
          userId: targetUserId,
          languageCode: setting.languageCode,
          currency: setting.currency,
          autoTranscribe: setting.autoTranscribe,
          theme: setting.theme,
          notifications: setting.notifications,
          reminderTime: setting.reminderTime,
          weeklySummary: setting.weeklySummary,
          weeklySummaryLanguage: setting.weeklySummaryLanguage,
          createdAt: new Date(setting.createdAt),
          updatedAt: new Date(setting.updatedAt),
        });
      }
      settingsImported++;
    } catch (err) {
      console.warn('[ImportData] Failed to import settings:', err);
    }
  }

  // 7. Import weekly summaries
  let summariesImported = 0;
  for (const summary of exportData.weeklySummaries) {
    try {
      const existing = await db
        .select({ id: weeklySummaries.id })
        .from(weeklySummaries)
        .where(eq(weeklySummaries.id, summary.id))
        .limit(1);

      if (existing.length > 0) continue;

      await db.insert(weeklySummaries).values({
        id: summary.id,
        userId: targetUserId,
        weekStart: new Date(summary.weekStart),
        weekEnd: new Date(summary.weekEnd),
        summaryMy: summary.summaryMy,
        summaryEn: summary.summaryEn,
        categoryBreakdown: summary.categoryBreakdown,
        moodTrend: summary.moodTrend,
        entryCount: summary.entryCount,
        totalDuration: summary.totalDuration,
        language: summary.language,
        createdAt: new Date(summary.createdAt),
      });
      summariesImported++;
    } catch (err) {
      console.warn('[ImportData] Failed to import weekly summary:', summary.id, err);
    }
  }

  console.log(
    `[ImportData] Import complete: ${entriesImported} entries, ${settingsImported} settings, ${summariesImported} summaries, ${audioFilesImported} audio files`
  );

  return {
    entriesImported,
    settingsImported,
    summariesImported,
    audioFilesImported,
  };
};
