import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertVomitLog, softDeleteLog, type VomitLog } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { ChipGroup } from '../../components/ChipGroup';
import { TextField } from '../../components/TextField';
import { LogFormShell } from './LogFormShell';

const CONSISTENCIES = ['liquid', 'chunky', 'foamy', 'bile', 'other'] as const;

export function VomitLogForm({
  dogId,
  log,
  onSuccess,
}: {
  dogId: string;
  log?: VomitLog;
  onSuccess: () => void;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState(log ? new Date(log.occurred_at) : new Date());
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [consistency, setConsistency] = useState<(typeof CONSISTENCIES)[number] | null>(
    log?.consistency ?? null
  );
  const [color, setColor] = useState(log?.color ?? '');
  const [texture, setTexture] = useState(log?.texture ?? '');
  const [suspectedCause, setSuspectedCause] = useState(log?.suspected_cause ?? '');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const consistencyError = attemptedSubmit && !consistency ? 'Please select one' : undefined;

  const mutation = useMutation({
    mutationFn: () =>
      insertVomitLog(supabase, {
        id: log?.id ?? Crypto.randomUUID(),
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

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteLog(supabase, 'vomit', log!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', dogId] });
      onSuccess();
    },
  });

  return (
    <LogFormShell
      title={log ? 'Edit vomit / illness entry' : 'Log vomit / illness'}
      occurredAt={occurredAt}
      onChangeOccurredAt={setOccurredAt}
      notes={notes}
      onChangeNotes={setNotes}
      onSubmit={() => {
        setAttemptedSubmit(true);
        if (consistency) mutation.mutate();
      }}
      submitLabel={log ? 'Save changes' : 'Save'}
      isSubmitting={mutation.isPending}
      error={mutation.isError ? (mutation.error as Error).message : null}
      onDelete={log ? () => deleteMutation.mutate() : undefined}
      isDeleting={deleteMutation.isPending}
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
