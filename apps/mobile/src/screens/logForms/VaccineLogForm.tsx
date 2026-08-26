import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertVaccineLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { DatePickerField } from '../../components/DatePickerField';
import { TextField } from '../../components/TextField';
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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const vaccineNameError = attemptedSubmit && !vaccineName.trim() ? 'Please fill this in' : undefined;

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
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (vaccineName.trim()) mutation.mutate();
      }}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
    >
      <TextField
        label="Vaccine"
        value={vaccineName}
        onChangeText={setVaccineName}
        error={vaccineNameError}
      />
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
      <TextField label="Clinic (optional)" value={clinicName} onChangeText={setClinicName} />
    </LogFormShell>
  );
}
