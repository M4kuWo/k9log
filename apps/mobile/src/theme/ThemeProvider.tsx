import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme, useColorScheme } from 'nativewind';

const STORAGE_KEY = 'k9log-theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  setPreference: () => {},
});

// Applies to both NativeWind's dark: classes and native-rendered pieces
// (DateTimePicker, Alert, keyboard) that read RN's own Appearance API
// instead — without this, those would ignore a manually-picked theme and
// keep following the OS setting.
function applyScheme(pref: ThemePreference) {
  colorScheme.set(pref);
  Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
        applyScheme(stored);
      }
    });
  }, []);

  function setPreference(pref: ThemePreference) {
    setPreferenceState(pref);
    applyScheme(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  }

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  return useContext(ThemeContext);
}

// Re-exported so screens needing the *effective* light/dark (e.g. for a
// value that can't be expressed as a Tailwind class, like a native header
// backgroundColor) don't need a second import.
export { useColorScheme };
