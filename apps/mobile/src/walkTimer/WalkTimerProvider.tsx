import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'k9log-active-walk-timers';

// dogId -> ISO start timestamp. A running walk timer doesn't need any
// background process to "keep counting" — elapsed time is always just
// `now - startedAt`, so persisting the start timestamp is enough for the
// timer to survive navigating away, backgrounding, or fully closing the app.
type ActiveTimers = Record<string, string>;

type WalkTimerContextValue = {
  activeTimers: ActiveTimers;
  startTimer: (dogId: string, startedAtISO: string) => void;
  clearTimer: (dogId: string) => void;
};

const WalkTimerContext = createContext<WalkTimerContextValue>({
  activeTimers: {},
  startTimer: () => {},
  clearTimer: () => {},
});

export function WalkTimerProvider({ children }: { children: ReactNode }) {
  const [activeTimers, setActiveTimers] = useState<ActiveTimers>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        setActiveTimers(JSON.parse(raw));
      } catch {
        // Corrupted storage — start fresh rather than crash on it.
      }
    });
  }, []);

  function persist(next: ActiveTimers) {
    setActiveTimers(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function startTimer(dogId: string, startedAtISO: string) {
    persist({ ...activeTimers, [dogId]: startedAtISO });
  }

  function clearTimer(dogId: string) {
    if (!(dogId in activeTimers)) return;
    const next = { ...activeTimers };
    delete next[dogId];
    persist(next);
  }

  return (
    <WalkTimerContext.Provider value={{ activeTimers, startTimer, clearTimer }}>
      {children}
    </WalkTimerContext.Provider>
  );
}

export function useWalkTimer() {
  return useContext(WalkTimerContext);
}
