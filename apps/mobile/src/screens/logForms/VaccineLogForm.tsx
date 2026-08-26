import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertVaccineLog, softDeleteLog, type VaccineLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { DatePickerField } from '../../components/DatePickerField';
import { TextField } from '../../components/TextField';
import { LogFormShell } from './LogFormShell';

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

export function VaccineLogForm({
  dogId,
  log,
  onSuccess,
}: {
  dogId: string;
  log?: VaccineLog;
  onSuccess: () => void;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(log ? new Date(log.occurred_at) : new Date());
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [vaccineName, setVaccineName] = useState(log?.vaccine_name ?? '');
  const [administeredDate, setAdministeredDate] = useState<Date>(
    log ? new Date(log.administered_date) : new Date()
  );
  const [nextDueDate, setNextDueDate] = useState<Date | null>(
    log?.next_due_date ? new Date(log.next_due_date) : null
  );
  const [clinicName, setClinicName] = useState(log?.clinic_name ?? '');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const vaccineNameError = attemptedSubmit && !vaccineName.trim() ? 'Please fill this in' : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      insertVaccineLog(supabase, {
        id: log?.id ?? Crypto.randomUUID(),
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

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteLog(supabase, 'vaccine', log!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title={log ? 'Edit vaccine entry' : 'Log a vaccine'}
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (vaccineName.trim()) mutation.mutate();
      }}
      submitLabel={log ? 'Save changes' : 'Save'}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      onDelete={log ? () => deleteMutation.mutate() : undefined}
      isDeleting={deleteMutation.isPending}
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
