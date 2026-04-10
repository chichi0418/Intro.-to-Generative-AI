import { useState } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem('chatSettings');
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<Settings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        apiKeys: {
          ...DEFAULT_SETTINGS.apiKeys,
          ...(parsed.apiKeys ?? {}),
        },
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  function setSettings(update: Partial<Settings>) {
    setSettingsState(prev => {
      const next = {
        ...prev,
        ...update,
        apiKeys: {
          ...prev.apiKeys,
          ...(update.apiKeys ?? {}),
        },
      };
      localStorage.setItem('chatSettings', JSON.stringify(next));
      return next;
    });
  }

  return { settings, setSettings };
}
