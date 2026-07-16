// useSettings hook — loads and persists user settings
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserSettings, updateUserSettings } from '../services/settings';
import { UserSetting } from '../db/schema';

export type CategorizerType = 'gemini' | 'custom';

interface UseSettingsReturn {
  settings: UserSetting | null;
  isReady: boolean;
  categorizer: CategorizerType;
  setCategorizer: (value: CategorizerType) => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const { userId } = useAuth();
  const [settings, setSettings] = useState<UserSetting | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const s = await getUserSettings(userId);
        if (!cancelled) setSettings(s);
      } catch (err) {
        console.error('[useSettings] Failed to load settings:', err);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const setCategorizer = useCallback(async (value: CategorizerType) => {
    const updated = await updateUserSettings(userId, { categorizer: value });
    setSettings(updated);
  }, [userId]);

  return {
    settings,
    isReady,
    categorizer: (settings?.categorizer as CategorizerType) || 'gemini',
    setCategorizer,
  };
}
