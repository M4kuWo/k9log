import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertVaccineLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { DatePickerField } from '../../components/DatePickerField';
import { LogFormShell } from './LogFormShell';

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

export function VaccineLogForm({ dogId, onSuccess }: { dogId: string; onSuccess: () => void }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [administeredDate, setAdministeredDate] = useState<Date>(new Date());
  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);
  const [clinicName, setClinicName] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      insertVaccineLog(supabase, {
        id: Crypto.randomUUID(),
        dog_id: dogId,
        logged_by_user_id: session!.user.id,
        occurred_at: occurredAt.toISOString(),
        notes: notes.trim() || null,
        vaccine_name: vaccineName.trim(),
        administered_date: toDateOnly(administeredDate),
        next_due_date: nextDueDate ? toDateOnly(nextDueDate) : null,
        clinic_name: clinicName.trim() || null,
        document_url: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title="Log a vaccine"
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => mutation.mutate()}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      canSubmit={vaccineName.trim().length > 0}
    >
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Vaccine</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          value={vaccineName}
          onChangeText={setVaccineName}
        />
      </View>
      <DatePickerField
        label="Administered on"
        value={administeredDate}
        onChange={(d) => d && setAdministeredDate(d)}
      />
      <DatePickerField
        label="Next due (optional)"
        value={nextDueDate}
        onChange={setNextDueDate}
        clearable
      />
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Clinic (optional)</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          value={clinicName}
          onChangeText={setClinicName}
        />
      </View>
    </LogFormShell>
  );
}
