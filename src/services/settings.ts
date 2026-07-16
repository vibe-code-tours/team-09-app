// Settings CRUD service — reads/writes user_settings table
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { userSettings, UserSetting } from '../db/schema';

const DEFAULT_SETTINGS = {
  languageCode: 'my' as const,
  currency: 'MMK',
  autoTranscribe: true,
  theme: 'system' as const,
  notifications: true,
  categorizer: 'gemini' as const,
};

/**
 * Get user settings. Creates defaults if none exist.
 */
export async function getUserSettings(userId: string): Promise<UserSetting> {
  const db = getDb();
  const now = new Date();

  // Try to find existing settings
  const existing = db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .get();

  if (existing) return existing;

  // Create default settings
  const newSettings = {
    userId,
    ...DEFAULT_SETTINGS,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(userSettings).values(newSettings).run();

  return db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .get()!;
}

/**
 * Update user settings (partial update).
 */
export async function updateUserSettings(
  userId: string,
  updates: Partial<Pick<UserSetting, 'categorizer' | 'theme' | 'languageCode' | 'notifications' | 'autoTranscribe' | 'currency'>>
): Promise<UserSetting> {
  const db = getDb();
  const now = new Date();

  // Ensure settings row exists
  await getUserSettings(userId);

  db.update(userSettings)
    .set({ ...updates, updatedAt: now })
    .where(eq(userSettings.userId, userId))
    .run();

  return db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .get()!;
}
