// Audio Storage Service — local file management
import { File, Directory, Paths } from 'expo-file-system';

const RECORDINGS_DIR = new Directory(Paths.document, 'recordings');

/**
 * Ensure the recordings directory exists.
 */
const ensureDir = () => {
  if (!RECORDINGS_DIR.exists) {
    RECORDINGS_DIR.create();
  }
};

/**
 * Save a recording from temp storage to permanent local storage.
 * Returns the permanent file URI.
 */
export const saveAudioLocally = async (tempUri: string): Promise<string> => {
  ensureDir();

  // Generate a unique filename with timestamp
  const filename = `recording-${Date.now()}.m4a`;
  const permanentFile = new File(RECORDINGS_DIR, filename);

  // Copy from temp to permanent storage (copy is safer than move)
  const tempFile = new File(tempUri);
  tempFile.copy(permanentFile);

  return permanentFile.uri;
};

/**
 * Delete an audio file from local storage.
 */
export const deleteAudioFile = (uri: string): void => {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // File may already be deleted
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
