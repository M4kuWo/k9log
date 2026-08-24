import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  listDogs,
  getLogsSince,
  summarize,
  rangeStartISO,
  type ReportRange,
} from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { DogSelector } from '../components/DogSelector';

const RANGE_LABELS: Record<ReportRange, string> = { day: 'Day', week: 'Week', month: 'Month' };

function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function formatAmountByUnit(byUnit: Record<string, number>): string | undefined {
  const entries = Object.entries(byUnit);
  if (entries.length === 0) return undefined;
  return entries.map(([unit, amount]) => `${amount} ${unit}`).join(', ');
}

function ReportCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <View className="border border-neutral-200 rounded-lg px-4 py-3 flex-row justify-between items-center">
      <Text className="text-base font-medium text-neutral-900">{title}</Text>
      <View className="items-end">
        <Text className="text-base text-neutral-900">{value}</Text>
        {sub && <Text className="text-neutral-400 text-sm">{sub}</Text>}
      </View>
    </View>
  );
}

export function ReportsScreen({ householdId }: { householdId: string }) {
  const [range, setRange] = useState<ReportRange>('day');
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);

  const dogsQuery = useQuery({
    queryKey: ['dogs', householdId],
    queryFn: () => listDogs(supabase, householdId),
  });
  const dogs = dogsQuery.data ?? [];
  const activeDogId = selectedDogId ?? dogs[0]?.id ?? null;

  const logsQuery = useQuery({
    queryKey: ['reportLogs', activeDogId, range],
    queryFn: () => getLogsSince(supabase, activeDogId!, rangeStartISO(range)),
    enabled: !!activeDogId,
  });

  const summary = logsQuery.data ? summarize(logsQuery.data) : null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <DogSelector dogs={dogs} activeDogId={activeDogId} onSelect={setSelectedDogId} />

      <View className="flex-row gap-2 px-4 pb-2">
        {(Object.keys(RANGE_LABELS) as ReportRange[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            className={
              r === range ? 'bg-neutral-900 rounded-full px-4 py-2' : 'bg-neutral-100 rounded-full px-4 py-2'
            }
          >
            <Text className={r === range ? 'text-white' : 'text-neutral-700'}>
              {RANGE_LABELS[r]}
            </Text>
          </Pressable>
        ))}
      </View>

      {logsQuery.isLoading || !summary ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-4 gap-2 py-2">
          <ReportCard
            title="Walks"
            value={`${summary.walk.count}`}
            sub={summary.walk.count ? `${formatDuration(summary.walk.totalDurationSeconds)} total` : undefined}
          />
          <ReportCard
            title="Food"
            value={`${summary.food.count} meal${summary.food.count === 1 ? '' : 's'}`}
            sub={formatAmountByUnit(summary.food.amountByUnit)}
          />
          <ReportCard
            title="Treats"
            value={`${summary.treat.count}`}
            sub={summary.treat.totalQuantity != null ? `${summary.treat.totalQuantity} total` : undefined}
          />
          <ReportCard title="Vomit / illness" value={`${summary.vomit.count}`} />
          <ReportCard title="Medication" value={`${summary.medication.count}`} />
          <ReportCard title="Vaccines" value={`${summary.vaccine.count}`} />
          <ReportCard title="Vet appointments" value={`${summary.vet_appointment.count}`} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
