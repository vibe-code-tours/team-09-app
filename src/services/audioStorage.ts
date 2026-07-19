// Audio Storage Service — local file management
import { File, Directory, Paths } from 'expo-file-system';
import { Alert } from 'react-native';

const RECORDINGS_DIR = new Directory(Paths.document, 'recordings');

// Storage limits (in bytes)
const STORAGE_WARN_MB = 500;
const STORAGE_CAP_MB = 1000;
const BYTES_PER_MB = 1024 * 1024;
const STORAGE_WARN_BYTES = STORAGE_WARN_MB * BYTES_PER_MB;
const STORAGE_CAP_BYTES = STORAGE_CAP_MB * BYTES_PER_MB;

/**
 * Format a date as a filename-safe string: YYYY-MM-DD_HH-mm-ss
 * This format sorts lexicographically in chronological order.
 */
const formatDateToFileName = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};

/**
 * Ensure the recordings directory exists.
 */
const ensureDir = () => {
  if (!RECORDINGS_DIR.exists) {
    RECORDINGS_DIR.create();
  }
};

/**
 * Get total size of all recordings in bytes.
 */
export const getTotalRecordingsSize = (): number => {
  ensureDir();
  const items = RECORDINGS_DIR.list();
  let totalSize = 0;

  for (const item of items) {
    if (item instanceof File && item.name.endsWith('.m4a')) {
      totalSize += item.size;
    }
  }

  return totalSize;
};

/**
 * Get human-readable size string.
 */
export const formatStorageSize = (bytes: number): string => {
  const mb = bytes / BYTES_PER_MB;
  return `${Math.round(mb)} MB`;
};

/**
 * Check if recording can be saved.
 * Returns { allowed, message } — if not allowed, message explains why.
 */
export const canSaveRecording = (fileSizeBytes: number): { allowed: boolean; message?: string } => {
  const currentSize = getTotalRecordingsSize();
  const newTotal = currentSize + fileSizeBytes;

  if (newTotal > STORAGE_CAP_BYTES) {
    const usedMB = Math.round(currentSize / BYTES_PER_MB);
    return {
      allowed: false,
      message: `Storage full (${usedMB} MB used). Delete some recordings to free space.`,
    };
  }

  if (newTotal > STORAGE_WARN_BYTES) {
    const usedMB = Math.round(currentSize / BYTES_PER_MB);
    return {
      allowed: true,
      message: `Storage: ${usedMB} MB used. Consider deleting old recordings.`,
    };
  }

  return { allowed: true };
};

/**
 * Save a recording from temp storage to permanent local storage.
 * Returns the permanent file URI.
 * Returns null if storage limit reached.
 */
export const saveAudioLocally = async (tempUri: string): Promise<string | null> => {
  ensureDir();

  // Get temp file size to check against storage limit
  const tempFile = new File(tempUri);
  const fileSize = tempFile.size;

  // Check storage limit before saving
  const { allowed, message } = canSaveRecording(fileSize);
  if (!allowed) {
    console.warn('[AudioStorage] Storage limit reached:', message);
    return null;
  }

  // Show warning if approaching limit
  if (message) {
    console.warn('[AudioStorage] Storage warning:', message);
  }

  // Generate filename with human-readable datetime format
  const filename = `recording-${formatDateToFileName(new Date())}.m4a`;
  const permanentFile = new File(RECORDINGS_DIR, filename);

  // Copy from temp to permanent storage (copy is safer than move)
  tempFile.copy(permanentFile);

  return permanentFile.uri;
};

/**
 * Delete an audio file from local storage.
 * Returns true if file was deleted, false if not found or error.
 */
export const deleteAudioFile = (uri: string): boolean => {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
      console.log('[AudioStorage] Deleted file:', uri);
      return true;
    }
    console.warn('[AudioStorage] File not found:', uri);
    return false;
  } catch (err) {
    console.error('[AudioStorage] Delete failed:', err);
    return false;
  }
};

/**
 * Check if an audio file exists.
 */
export const audioFileExists = (uri: string): boolean => {
  const file = new File(uri);
  return file.exists;
};

/**
 * List all saved recordings.
 * Returns array of { name, uri, size } objects.
 */
export const listRecordings = (): Array<{ name: string; uri: string; size: number }> => {
  ensureDir();
  const items = RECORDINGS_DIR.list();
  const recordings: Array<{ name: string; uri: string; size: number }> = [];

  for (const item of items) {
    if (item instanceof File && item.name.endsWith('.m4a')) {
      recordings.push({
        name: item.name,
        uri: item.uri,
        size: item.size,
      });
    }
  }

  return recordings.sort((a, b) => b.name.localeCompare(a.name)); // newest first
};
