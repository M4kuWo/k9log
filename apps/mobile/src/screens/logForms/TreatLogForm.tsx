import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertTreatLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { LogFormShell } from './LogFormShell';

export function TreatLogForm({ dogId, onSuccess }: { dogId: string; onSuccess: () => void }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [treatName, setTreatName] = useState('');
  const [quantity, setQuantity] = useState('');

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
      onSubmit={() => mutation.mutate()}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      canSubmit={treatName.trim().length > 0}
    >
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Treat</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          placeholder="e.g. Peanut butter biscuit"
          value={treatName}
          onChangeText={setTreatName}
        />
      </View>
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Quantity (optional)</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          placeholder="e.g. 1"
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
      </View>
    </LogFormShell>
  );
}
