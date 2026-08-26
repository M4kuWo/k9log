import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertFoodLog, softDeleteLog, type FoodLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { ChipGroup } from '../../components/ChipGroup';
import { TextField } from '../../components/TextField';
import { LogFormShell } from './LogFormShell';

const FOOD_TYPES = ['dry', 'wet', 'raw', 'other'] as const;
const UNITS = ['g', 'cups', 'oz'] as const;

export function FoodLogForm({
  dogId,
  log,
  onSuccess,
}: {
  dogId: string;
  log?: FoodLog;
  onSuccess: () => void;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(log ? new Date(log.occurred_at) : new Date());
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [foodName, setFoodName] = useState(log?.food_name ?? '');
  const [foodType, setFoodType] = useState<(typeof FOOD_TYPES)[number] | null>(
    log?.food_type ?? null
  );
  const [amount, setAmount] = useState(log?.amount != null ? String(log.amount) : '');
  const [unit, setUnit] = useState<(typeof UNITS)[number] | null>(log?.unit ?? null);

  const mutation = useMutation({
    mutationFn: () =>
      insertFoodLog(supabase, {
        id: log?.id ?? Crypto.randomUUID(),
        dog_id: dogId,
        logged_by_user_id: session!.user.id,
        occurred_at: occurredAt.toISOString(),
        notes: notes.trim() || null,
        food_name: foodName.trim() || 'Unspecified',
        food_type: foodType,
        amount: amount ? Number(amount) : null,
        unit,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteLog(supabase, 'food', log!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title={log ? 'Edit food entry' : 'Log food'}
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => mutation.mutate()}
      submitLabel={log ? 'Save changes' : 'Save'}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      onDelete={log ? () => deleteMutation.mutate() : undefined}
      isDeleting={deleteMutation.isPending}
    >
      <TextField
        label="Food (optional)"
        placeholder="e.g. Kibble brand — leave blank for unspecified"
        value={foodName}
        onChangeText={setFoodName}
      />

      <ChipGroup label="Type" options={FOOD_TYPES} value={foodType} onChange={setFoodType} />

      <TextField
        label="Amount (optional)"
        placeholder="e.g. 1.5"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <ChipGroup label="Unit" options={UNITS} value={unit} onChange={setUnit} />
    </LogFormShell>
  );
}
