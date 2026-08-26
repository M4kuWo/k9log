import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  listDogs,
  getLogsSince,
  summarize,
  rangeStartISO,
  bucketWalkMinutes,
  type ReportRange,
  type LogKind,
} from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { DogSelector } from '../components/DogSelector';
import { BarChart } from '../components/BarChart';
import { LogGlyph } from '../components/LogGlyph';
import { LOG_KIND_COLORS } from '../constants/logIcons';
import { PALETTE, PALETTE_SOFT } from '../constants/palette';

const RANGE_LABELS: Record<ReportRange, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

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

function ReportCard({
  kind,
  title,
  value,
  sub,
}: {
  kind: LogKind;
  title: string;
  value: string;
  sub?: string;
}) {
  const color = LOG_KIND_COLORS[kind];
  return (
    <View className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm flex-row items-center gap-3">
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: PALETTE_SOFT[color] }}
      >
        <LogGlyph kind={kind} size={18} color={PALETTE[color]} />
      </View>
      <Text className="flex-1 text-base font-medium text-stone-900">{title}</Text>
      <View className="items-end">
        <Text className="text-base text-stone-900">{value}</Text>
        {sub && <Text className="text-stone-400 text-sm">{sub}</Text>}
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
    <SafeAreaView className="flex-1 bg-stone-50">
      <DogSelector dogs={dogs} activeDogId={activeDogId} onSelect={setSelectedDogId} />

      <View className="flex-row gap-2 px-4 pb-2">
        {(Object.keys(RANGE_LABELS) as ReportRange[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            className={
              r === range
                ? 'bg-[#E2706A] rounded-full px-4 py-2'
                : 'bg-white border border-stone-200 rounded-full px-4 py-2'
            }
          >
            <Text className={r === range ? 'text-white font-medium' : 'text-stone-700'}>
              {RANGE_LABELS[r]}
            </Text>
          </Pressable>
        ))}
      </View>

      {logsQuery.isLoading || !summary ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E2706A" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-4 gap-2 py-2">
          {range !== 'day' && (
            <View className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm gap-2 mb-1">
              <Text className="font-semibold text-stone-900">Walk minutes</Text>
              <BarChart data={bucketWalkMinutes(logsQuery.data ?? [], range)} unit="minutes" />
            </View>
          )}
          <ReportCard
            kind="walk"
            title="Walks"
            value={`${summary.walk.count}`}
            sub={summary.walk.count ? `${formatDuration(summary.walk.totalDurationSeconds)} total` : undefined}
          />
          <ReportCard
            kind="food"
            title="Food"
            value={`${summary.food.count} meal${summary.food.count === 1 ? '' : 's'}`}
            sub={formatAmountByUnit(summary.food.amountByUnit)}
          />
          <ReportCard
            kind="treat"
            title="Treats"
            value={`${summary.treat.count}`}
            sub={summary.treat.totalQuantity != null ? `${summary.treat.totalQuantity} total` : undefined}
          />
          <ReportCard kind="vomit" title="Vomit / illness" value={`${summary.vomit.count}`} />
          <ReportCard kind="medication" title="Medication" value={`${summary.medication.count}`} />
          <ReportCard kind="vaccine" title="Vaccines" value={`${summary.vaccine.count}`} />
          <ReportCard
            kind="vet_appointment"
            title="Vet appointments"
            value={`${summary.vet_appointment.count}`}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
