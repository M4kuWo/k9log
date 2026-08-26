import { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertMedicationLog, softDeleteLog, type MedicationLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { TextField } from '../../components/TextField';
import { LogFormShell } from './LogFormShell';

export function MedicationLogForm({
  dogId,
  log,
  onSuccess,
}: {
  dogId: string;
  log?: MedicationLog;
  onSuccess: () => void;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(log ? new Date(log.occurred_at) : new Date());
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [medicationName, setMedicationName] = useState(log?.medication_name ?? '');
  const [dose, setDose] = useState(log?.dose ?? '');
  const [unit, setUnit] = useState(log?.unit ?? '');
  const [isRecurring, setIsRecurring] = useState(log?.is_recurring ?? false);
  const [recurrenceRule, setRecurrenceRule] = useState(log?.recurrence_rule ?? '');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const medicationNameError =
    attemptedSubmit && !medicationName.trim() ? 'Please fill this in' : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      insertMedicationLog(supabase, {
        id: log?.id ?? Crypto.randomUUID(),
        dog_id: dogId,
        logged_by_user_id: session!.user.id,
        occurred_at: occurredAt.toISOString(),
        notes: notes.trim() || null,
        medication_name: medicationName.trim(),
        dose: dose.trim() || null,
        unit: unit.trim() || null,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule.trim() || null : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteLog(supabase, 'medication', log!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title={log ? 'Edit medication entry' : 'Log medication'}
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (medicationName.trim()) mutation.mutate();
      }}
      submitLabel={log ? 'Save changes' : 'Save'}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      onDelete={log ? () => deleteMutation.mutate() : undefined}
      isDeleting={deleteMutation.isPending}
    >
      <TextField
        label="Medication"
        value={medicationName}
        onChangeText={setMedicationName}
        error={medicationNameError}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Dose" value={dose} onChangeText={setDose} />
        </View>
        <View className="flex-1">
          <TextField
            label="Unit"
            placeholder="mg, tablet..."
            value={unit}
            onChangeText={setUnit}
          />
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-stone-700 dark:text-stone-300 text-base">Recurring</Text>
        <Switch
          value={isRecurring}
          onValueChange={setIsRecurring}
          trackColor={{ true: '#E2706A' }}
        />
      </View>
      {isRecurring && (
        <TextField
          label="Recurrence (e.g. daily, weekly)"
          value={recurrenceRule}
          onChangeText={setRecurrenceRule}
        />
      )}
    </LogFormShell>
  );
}
