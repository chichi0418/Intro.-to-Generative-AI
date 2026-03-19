import { useState } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem('chatSettings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  function setSettings(update: Partial<Settings>) {
    setSettingsState(prev => {
      const next = { ...prev, ...update };
      localStorage.setItem('chatSettings', JSON.stringify(next));
      return next;
    });
  }

  return { settings, setSettings };
}
