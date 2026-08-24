import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertVomitLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { ChipGroup } from '../../components/ChipGroup';
import { LogFormShell } from './LogFormShell';

const CONSISTENCIES = ['liquid', 'chunky', 'foamy', 'bile', 'other'] as const;

export function VomitLogForm({ dogId, onSuccess }: { dogId: string; onSuccess: () => void }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [consistency, setConsistency] = useState<(typeof CONSISTENCIES)[number] | null>(null);
  const [color, setColor] = useState('');
  const [texture, setTexture] = useState('');
  const [suspectedCause, setSuspectedCause] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      insertVomitLog(supabase, {
        id: Crypto.randomUUID(),
        dog_id: dogId,
        logged_by_user_id: session!.user.id,
        occurred_at: occurredAt.toISOString(),
        notes: notes.trim() || null,
        consistency,
        color: color.trim() || null,
        texture: texture.trim() || null,
        suspected_cause: suspectedCause.trim() || null,
        photo_url: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title="Log vomit / illness"
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => mutation.mutate()}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      canSubmit={consistency !== null}
    >
      <ChipGroup
        label="Consistency"
        options={CONSISTENCIES}
        value={consistency}
        onChange={setConsistency}
      />
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Color (optional)</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          value={color}
          onChangeText={setColor}
        />
      </View>
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Texture (optional)</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          value={texture}
          onChangeText={setTexture}
        />
      </View>
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Suspected cause (optional)</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          placeholder="e.g. ate grass"
          value={suspectedCause}
          onChangeText={setSuspectedCause}
        />
      </View>
    </LogFormShell>
  );
}
