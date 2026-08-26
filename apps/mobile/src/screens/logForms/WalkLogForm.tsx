import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertWalkLog, softDeleteLog, type WalkLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { useWalkTimer } from '../../walkTimer/WalkTimerProvider';
import { formatElapsed } from '../../walkTimer/format';
import { ChipGroup } from '../../components/ChipGroup';
import { LogFormShell } from './LogFormShell';

const SOURCES = ['timer', 'manual'] as const;

export function WalkLogForm({
  dogId,
  log,
  onSuccess,
}: {
  dogId: string;
  log?: WalkLog;
  onSuccess: () => void;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { activeTimers, startTimer, clearTimer } = useWalkTimer();
  // Editing a past walk never resumes a live timer for it.
  const persistedStart = !log ? activeTimers[dogId] : undefined;

  const [occurredAt, setOccurredAt] = useState(log ? new Date(log.occurred_at) : new Date());
  const [notes, setNotes] = useState(log?.notes ?? '');
  // Editing an existing walk always uses the manual/duration field — there's
  // no live timer context to resume for a walk that already happened.
  const [source, setSource] = useState<(typeof SOURCES)[number]>(log ? 'manual' : 'timer');

  // `timerStart` is the frozen reference used for start_time even after
  // Stop is pressed; `isRunning` controls the ticking and the button state.
  const [timerStart, setTimerStart] = useState<Date | null>(
    persistedStart ? new Date(persistedStart) : null
  );
  const [isRunning, setIsRunning] = useState(!!persistedStart);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [manualMinutes, setManualMinutes] = useState(
    log?.duration_seconds ? String(log.duration_seconds / 60) : ''
  );
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Picks up a timer that was already running when this screen mounts (e.g.
  // navigated in from the Timeline's "walk in progress" banner), including
  // the case where the active-timers store hadn't finished loading yet on
  // the very first render.
  useEffect(() => {
    if (persistedStart) {
      setTimerStart(new Date(persistedStart));
      setIsRunning(true);
    }
  }, [persistedStart]);

  useEffect(() => {
    if (timerStart && isRunning) {
      const tick = () => setElapsedSeconds(Math.floor((Date.now() - timerStart.getTime()) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerStart, isRunning]);

  const durationSeconds =
    source === 'timer' ? elapsedSeconds : manualMinutes ? Math.round(Number(manualMinutes) * 60) : null;
  const durationError =
    attemptedSubmit && !(durationSeconds && durationSeconds > 0)
      ? source === 'timer'
        ? 'Start and stop the timer to log a duration'
        : 'Please fill this in'
      : undefined;

  const mutation = useMutation({
    mutationFn: () => {
      const startTime = source === 'timer' && timerStart ? timerStart : occurredAt;
      return insertWalkLog(supabase, {
        id: log?.id ?? Crypto.randomUUID(),
        dog_id: dogId,
        logged_by_user_id: session!.user.id,
        occurred_at: occurredAt.toISOString(),
        notes: notes.trim() || null,
        start_time: startTime.toISOString(),
        end_time: source === 'timer' ? new Date().toISOString() : null,
        duration_seconds: durationSeconds,
        distance_meters: null,
        route: null,
        source,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      // Covers saving directly off a still-running timer, without an
      // explicit Stop press first.
      if (!log) clearTimer(dogId);
      onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteLog(supabase, 'walk', log!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title={log ? 'Edit walk entry' : 'Log a walk'}
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (durationSeconds && durationSeconds > 0) mutation.mutate();
      }}
      submitLabel={log ? 'Save changes' : 'Save'}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      onDelete={log ? () => deleteMutation.mutate() : undefined}
      isDeleting={deleteMutation.isPending}
    >
      <ChipGroup label="How" options={SOURCES} value={source} onChange={setSource} />

      {source === 'timer' ? (
        <View className="items-center gap-3 py-2">
          <Text className="text-4xl font-mono text-neutral-900">
            {formatElapsed(elapsedSeconds)}
          </Text>
          <Pressable
            className={isRunning ? 'bg-red-600 rounded-full px-6 py-3' : 'bg-neutral-900 rounded-full px-6 py-3'}
            onPress={() => {
              if (isRunning) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setIsRunning(false);
                if (!log) clearTimer(dogId);
              } else {
                const now = new Date();
                setTimerStart(now);
                setElapsedSeconds(0);
                setIsRunning(true);
                if (!log) startTimer(dogId, now.toISOString());
              }
            }}
          >
            <Text className="text-white font-semibold">{isRunning ? 'Stop' : 'Start walk'}</Text>
          </Pressable>
          {isRunning && (
            <Text className="text-neutral-400 text-sm">
              Running — you can leave this screen, it'll keep counting.
            </Text>
          )}
          {durationError && <Text className="text-red-600 text-sm">{durationError}</Text>}
        </View>
      ) : (
        <View className="gap-2">
          <Text className="text-neutral-500 text-sm">Duration (minutes)</Text>
          <TextInput
            className={
              durationError
                ? 'border border-red-400 rounded-lg px-4 py-3 text-base'
                : 'border border-neutral-300 rounded-lg px-4 py-3 text-base'
            }
            placeholder="e.g. 30"
            keyboardType="decimal-pad"
            value={manualMinutes}
            onChangeText={setManualMinutes}
          />
          {durationError && <Text className="text-red-600 text-sm">{durationError}</Text>}
        </View>
      )}
    </LogFormShell>
  );
}
