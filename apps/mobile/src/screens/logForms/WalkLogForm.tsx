import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertWalkLog, softDeleteLog, type WalkLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { ChipGroup } from '../../components/ChipGroup';
import { LogFormShell } from './LogFormShell';

const SOURCES = ['timer', 'manual'] as const;

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
  const [occurredAt, setOccurredAt] = useState(log ? new Date(log.occurred_at) : new Date());
  const [notes, setNotes] = useState(log?.notes ?? '');
  // Editing an existing walk always uses the manual/duration field — there's
  // no live timer context to resume for a walk that already happened.
  const [source, setSource] = useState<(typeof SOURCES)[number]>(log ? 'manual' : 'timer');

  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [manualMinutes, setManualMinutes] = useState(
    log?.duration_seconds ? String(log.duration_seconds / 60) : ''
  );
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (timerStart) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - timerStart.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerStart]);

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
            className={timerStart ? 'bg-red-600 rounded-full px-6 py-3' : 'bg-neutral-900 rounded-full px-6 py-3'}
            onPress={() => {
              if (timerStart) {
                if (intervalRef.current) clearInterval(intervalRef.current);
              } else {
                setTimerStart(new Date());
                setElapsedSeconds(0);
              }
            }}
          >
            <Text className="text-white font-semibold">{timerStart ? 'Stop' : 'Start walk'}</Text>
          </Pressable>
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
