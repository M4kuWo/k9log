import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertTreatLog, softDeleteLog, type TreatLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { TextField } from '../../components/TextField';
import { LogFormShell } from './LogFormShell';

export function TreatLogForm({
  dogId,
  log,
  onSuccess,
}: {
  dogId: string;
  log?: TreatLog;
  onSuccess: () => void;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(log ? new Date(log.occurred_at) : new Date());
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [treatName, setTreatName] = useState(log?.treat_name ?? '');
  const [quantity, setQuantity] = useState(log?.quantity != null ? String(log.quantity) : '');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const treatNameError = attemptedSubmit && !treatName.trim() ? 'Please fill this in' : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      insertTreatLog(supabase, {
        id: log?.id ?? Crypto.randomUUID(),
        dog_id: dogId,
        logged_by_user_id: session!.user.id,
        occurred_at: occurredAt.toISOString(),
        notes: notes.trim() || null,
        treat_name: treatName.trim(),
        quantity: quantity ? Number(quantity) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteLog(supabase, 'treat', log!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title={log ? 'Edit treat entry' : 'Log a treat'}
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (treatName.trim()) mutation.mutate();
      }}
      submitLabel={log ? 'Save changes' : 'Save'}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      onDelete={log ? () => deleteMutation.mutate() : undefined}
      isDeleting={deleteMutation.isPending}
    >
      <TextField
        label="Treat"
        placeholder="e.g. Peanut butter biscuit"
        value={treatName}
        onChangeText={setTreatName}
        error={treatNameError}
      />
      <TextField
        label="Quantity (optional)"
        placeholder="e.g. 1"
        keyboardType="decimal-pad"
        value={quantity}
        onChangeText={setQuantity}
      />
    </LogFormShell>
  );
}
