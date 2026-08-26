import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertVetAppointment } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { ChipGroup } from '../../components/ChipGroup';
import { TextField } from '../../components/TextField';
import { LogFormShell } from './LogFormShell';

const STATUSES = ['upcoming', 'completed', 'cancelled'] as const;

export function VetAppointmentForm({
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
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('upcoming');
  const [clinicName, setClinicName] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [cost, setCost] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      insertVetAppointment(supabase, {
        id: Crypto.randomUUID(),
        dog_id: dogId,
        logged_by_user_id: session!.user.id,
        occurred_at: occurredAt.toISOString(),
        notes: notes.trim() || null,
        scheduled_date: occurredAt.toISOString(),
        reason: reason.trim() || null,
        status,
        clinic_name: clinicName.trim() || null,
        summary_notes: summaryNotes.trim() || null,
        cost: cost ? Number(cost) : null,
        follow_up_date: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title="Vet appointment"
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => mutation.mutate()}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
    >
      <ChipGroup label="Status" options={STATUSES} value={status} onChange={setStatus} />
      <TextField
        label="Reason (optional)"
        placeholder="e.g. annual checkup"
        value={reason}
        onChangeText={setReason}
      />
      <TextField label="Clinic (optional)" value={clinicName} onChangeText={setClinicName} />
      {status === 'completed' && (
        <>
          <TextField
            label="Summary (optional)"
            value={summaryNotes}
            onChangeText={setSummaryNotes}
            multiline
          />
          <TextField
            label="Cost (optional)"
            keyboardType="decimal-pad"
            value={cost}
            onChangeText={setCost}
          />
        </>
      )}
    </LogFormShell>
  );
}
