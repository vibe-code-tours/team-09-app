// Export Data Service — bundles entries, settings, and audio files into a ZIP
import { File, Directory, Paths } from 'expo-file-system';
import { writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { getDb } from '../db';
import { entries, userSettings, weeklySummaries } from '../db/schema';
import { and, eq } from 'drizzle-orm';

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
  occurredAt: string; // ISO string
  timezone: string;
  isPinned: boolean;
  isDeleted: boolean;
  syncStatus: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
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

// ── Helpers ───────────────────────────────────────────────

const RECORDINGS_DIR = new Directory(Paths.document, 'recordings');

function ensureDir(dir: Directory) {
  if (!dir.exists) {
    dir.create();
  }
}

function timestampToDate(ts: number | Date): Date {
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

// ── Export ────────────────────────────────────────────────

/**
 * Export all user data (entries, settings, weekly summaries) and audio files
 * into a ZIP file. Returns the URI of the created ZIP file.
 */
export const exportAllData = async (userId: string): Promise<string> => {
  const db = getDb();

  // 1. Fetch all live entries for this user.
  // Excludes soft-deleted rows (isDeleted = true) — deleted entries have their
  // audio removed from disk, so exporting them would produce a ZIP whose JSON
  // references audio files that don't exist in the bundle.
  const dbEntries = await db
    .select()
    .from(entries)
    .where(and(eq(entries.userId, userId), eq(entries.isDeleted, false)));

  // 2. Fetch user settings
  const dbSettings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  // 3. Fetch weekly summaries
  const dbSummaries = await db
    .select()
    .from(weeklySummaries)
    .where(eq(weeklySummaries.userId, userId));

  // 4. Build export JSON
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appId: 'mhat-tan',
    entries: dbEntries.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      entryType: row.entryType,
      transcript: row.transcript,
      editedTranscript: row.editedTranscript,
      mood: row.mood,
      moodConfidence: row.moodConfidence,
      summary: row.summary,
      categoryConfidence: row.categoryConfidence,
      processingStatus: row.processingStatus,
      audioPath: row.audioPath,
      audioDuration: row.audioDuration,
      occurredAt: timestampToDate(row.occurredAt).toISOString(),
      timezone: row.timezone,
      isPinned: row.isPinned,
      isDeleted: row.isDeleted,
      syncStatus: row.syncStatus,
      createdAt: timestampToDate(row.createdAt).toISOString(),
      updatedAt: timestampToDate(row.updatedAt).toISOString(),
    })),
    settings: dbSettings.map((row) => ({
      userId: row.userId,
      languageCode: row.languageCode,
      currency: row.currency,
      autoTranscribe: row.autoTranscribe,
      theme: row.theme,
      notifications: row.notifications,
      reminderTime: row.reminderTime,
      weeklySummary: row.weeklySummary,
      weeklySummaryLanguage: row.weeklySummaryLanguage,
      createdAt: timestampToDate(row.createdAt).toISOString(),
      updatedAt: timestampToDate(row.updatedAt).toISOString(),
    })),
    weeklySummaries: dbSummaries.map((row) => ({
      id: row.id,
      userId: row.userId,
      weekStart: timestampToDate(row.weekStart).toISOString(),
      weekEnd: timestampToDate(row.weekEnd).toISOString(),
      summaryMy: row.summaryMy,
      summaryEn: row.summaryEn,
      categoryBreakdown: row.categoryBreakdown,
      moodTrend: row.moodTrend,
      entryCount: row.entryCount,
      totalDuration: row.totalDuration,
      language: row.language,
      createdAt: timestampToDate(row.createdAt).toISOString(),
    })),
  };

  // 5. Create ZIP with JSON + audio files
  const zip = new JSZip();

  // Add the metadata JSON
  zip.file('mhat-tan-export.json', JSON.stringify(exportData, null, 2));

  // Add audio files
  ensureDir(RECORDINGS_DIR);
  const audioFolder = zip.folder('recordings');
  let audioFilesAdded = 0;

  for (const entry of dbEntries) {
    if (entry.audioPath) {
      try {
        const audioFile = new File(entry.audioPath);
        if (audioFile.exists) {
          const base64 = audioFile.base64();
          const filename = entry.audioPath.split('/').pop() || `audio-${entry.id}.m4a`;
          audioFolder?.file(filename, base64, { base64: true });
          audioFilesAdded++;
        }
      } catch (err) {
        console.warn('[ExportData] Failed to read audio file:', entry.audioPath, err);
      }
    }
  }

  // 6. Generate ZIP as base64
  const zipBase64 = await zip.generateAsync({ type: 'base64' });

  // 7. Write ZIP to a temp location
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zipFilename = `mhat-tan-backup-${timestamp}.zip`;
  const tempDir = new Directory(Paths.cache, 'export');
  ensureDir(tempDir);
  const zipFile = new File(tempDir, zipFilename);
  // Use the legacy writeAsStringAsync — the new File.write() with an options
  // object throws "Received 2 arguments, but 1 was expected" on iOS (Expo Go SDK 54).
  await writeAsStringAsync(zipFile.uri, zipBase64, { encoding: EncodingType.Base64 });

  console.log(
    `[ExportData] Export complete: ${dbEntries.length} entries, ${dbSettings.length} settings, ${audioFilesAdded} audio files`
  );

  return zipFile.uri;
};

/**
 * Share the exported ZIP file via the OS share sheet.
 */
export const shareExportFile = async (zipUri: string): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(zipUri, {
    mimeType: 'application/zip',
    dialogTitle: 'Export Mhat Tan Data',
    UTI: 'public.zip-archive',
  });
};
