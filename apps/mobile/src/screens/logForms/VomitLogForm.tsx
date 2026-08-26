import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertVomitLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { ChipGroup } from '../../components/ChipGroup';
import { TextField } from '../../components/TextField';
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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const consistencyError = attemptedSubmit && !consistency ? 'Please select one' : undefined;

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
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (consistency) mutation.mutate();
      }}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
    >
      <ChipGroup
        label="Consistency"
        options={CONSISTENCIES}
        value={consistency}
        onChange={setConsistency}
        error={consistencyError}
      />
      <TextField label="Color (optional)" value={color} onChangeText={setColor} />
      <TextField label="Texture (optional)" value={texture} onChangeText={setTexture} />
      <TextField
        label="Suspected cause (optional)"
        placeholder="e.g. ate grass"
        value={suspectedCause}
        onChangeText={setSuspectedCause}
      />
    </LogFormShell>
  );
}
