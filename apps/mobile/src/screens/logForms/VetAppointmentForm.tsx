import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertVetAppointment } from '@k9log/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthProvider';
import { ChipGroup } from '../../components/ChipGroup';
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
      canSubmit
    >
      <ChipGroup label="Status" options={STATUSES} value={status} onChange={setStatus} />
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Reason</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          placeholder="e.g. annual checkup"
          value={reason}
          onChangeText={setReason}
        />
      </View>
      <View className="gap-2">
        <Text className="text-neutral-500 text-sm">Clinic (optional)</Text>
        <TextInput
          className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
          value={clinicName}
          onChangeText={setClinicName}
        />
      </View>
      {status === 'completed' && (
        <>
          <View className="gap-2">
            <Text className="text-neutral-500 text-sm">Summary (optional)</Text>
            <TextInput
              className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
              value={summaryNotes}
              onChangeText={setSummaryNotes}
              multiline
            />
          </View>
          <View className="gap-2">
            <Text className="text-neutral-500 text-sm">Cost (optional)</Text>
            <TextInput
              className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
              keyboardType="decimal-pad"
              value={cost}
              onChangeText={setCost}
            />
          </View>
        </>
      )}
    </LogFormShell>
  );
}
