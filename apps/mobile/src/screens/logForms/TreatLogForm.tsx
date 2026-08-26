import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertTreatLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { TextField } from '../../components/TextField';
import { LogFormShell } from './LogFormShell';

export function TreatLogForm({ dogId, onSuccess }: { dogId: string; onSuccess: () => void }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [treatName, setTreatName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const treatNameError = attemptedSubmit && !treatName.trim() ? 'Please fill this in' : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      insertTreatLog(supabase, {
        id: Crypto.randomUUID(),
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

  return (
    <LogFormShell
      title="Log a treat"
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (treatName.trim()) mutation.mutate();
      }}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
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
