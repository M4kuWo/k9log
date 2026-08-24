import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertFoodLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { ChipGroup } from '../../components/ChipGroup';
import { LogFormShell } from './LogFormShell';

const FOOD_TYPES = ['dry', 'wet', 'raw', 'other'] as const;
const UNITS = ['g', 'cups', 'oz'] as const;

export function FoodLogForm({ dogId, onSuccess }: { dogId: string; onSuccess: () => void }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [foodName, setFoodName] = useState('');
  const [foodType, setFoodType] = useState<(typeof FOOD_TYPES)[number] | null>(null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<(typeof UNITS)[number] | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      insertFoodLog(supabase, {
        id: Crypto.randomUUID(),
        dog_id: dogId,
        logged_by_user_id: session!.user.id,
        occurred_at: occurredAt.toISOString(),
        notes: notes.trim() || null,
        food_name: foodName.trim(),
        food_type: foodType,
        amount: amount ? Number(amount) : null,
        unit,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title="Log food"
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => mutation.mutate()}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      canSubmit={foodName.trim().length > 0}
    >
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Food</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          placeholder="e.g. Kibble brand"
          value={foodName}
          onChangeText={setFoodName}
        />
      </View>

      <ChipGroup label="Type" options={FOOD_TYPES} value={foodType} onChange={setFoodType} />

      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Amount</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          placeholder="e.g. 1.5"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <ChipGroup label="Unit" options={UNITS} value={unit} onChange={setUnit} />
    </LogFormShell>
  );
}
