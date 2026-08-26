import { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertMedicationLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { TextField } from '../../components/TextField';
import { LogFormShell } from './LogFormShell';

export function MedicationLogForm({
  dogId,
  onSuccess,
}: {
  dogId: string;
  onSuccess: () => void;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const medicationNameError =
    attemptedSubmit && !medicationName.trim() ? 'Please fill this in' : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      insertMedicationLog(supabase, {
        id: Crypto.randomUUID(),
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

  return (
    <LogFormShell
      title="Log medication"
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (medicationName.trim()) mutation.mutate();
      }}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
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
        <Text className="text-neutral-700 text-base">Recurring</Text>
        <Switch value={isRecurring} onValueChange={setIsRecurring} />
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
