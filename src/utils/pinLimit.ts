// Pin limit utility - enforces max 3 pinned entries
import { Entry } from '../types';
import { updateEntry } from '../services/storage';

export const MAX_PINS = 3;

/**
 * Check if pinning is allowed and return the pinned entries if limit is reached.
 * Returns null if pinning is allowed directly.
 * Returns the list of pinned entries if user needs to choose one to replace.
 */
export function checkPinLimit(
  allEntries: Entry[],
  entryToPin: Entry
): Entry[] | null {
  // If already pinned, unpinning is always allowed
  if (entryToPin.isPinned) return null;

  const pinnedEntries = allEntries.filter(e => e.isPinned);

  if (pinnedEntries.length < MAX_PINS) {
    return null; // Can pin directly
  }

  return pinnedEntries; // Need to replace one
}

/**
 * Pin an entry directly (when under limit or replacing).
 */
export async function pinEntry(entry: Entry): Promise<void> {
  if (!entry.isPinned) {
    await updateEntry(entry.id, { isPinned: true });
  }
}

/**
 * Unpin an entry.
 */
export async function unpinEntry(entry: Entry): Promise<void> {
  if (entry.isPinned) {
    await updateEntry(entry.id, { isPinned: false });
  }
}

/**
 * Replace one pinned entry with another (unpin old, pin new).
 */
export async function replacePin(
  entryToUnpin: Entry,
  entryToPin: Entry
): Promise<void> {
  await Promise.all([
    updateEntry(entryToUnpin.id, { isPinned: false }),
    updateEntry(entryToPin.id, { isPinned: true }),
  ]);
}
