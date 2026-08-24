import { useState } from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertMedicationLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
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
      onSubmit={() => mutation.mutate()}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      canSubmit={medicationName.trim().length > 0}
    >
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Medication</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          value={medicationName}
          onChangeText={setMedicationName}
        />
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          <Text className="text-neutral-500 text-sm">Dose</Text>
          <TextInput
            className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
            value={dose}
            onChangeText={setDose}
          />
        </View>
        <View className="flex-1 gap-2">
          <Text className="text-neutral-500 text-sm">Unit</Text>
          <TextInput
            className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
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
        <View className="gap-2">
          <Text className="text-neutral-500 text-sm">Recurrence (e.g. daily, weekly)</Text>
          <TextInput
            className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
            value={recurrenceRule}
            onChangeText={setRecurrenceRule}
          />
        </View>
      )}
    </LogFormShell>
  );
}
