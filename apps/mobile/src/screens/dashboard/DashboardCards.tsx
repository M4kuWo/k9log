import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DashboardSummary, LogKind, VaccineStatus } from '@k9log/shared';
import { LOG_KIND_ICONS, LOG_KIND_COLORS } from '../../constants/logIcons';
import { PALETTE, PALETTE_SOFT } from '../../constants/palette';
import { formatDuration, formatRelative, formatDate } from '../../utils/format';

function CardShell({
  kind,
  title,
  onPress,
  children,
}: {
  kind: LogKind;
  title: string;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  const color = LOG_KIND_COLORS[kind];
  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm gap-1"
    >
      <View className="flex-row items-center gap-2">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: PALETTE_SOFT[color] }}
        >
          <Ionicons name={LOG_KIND_ICONS[kind]} size={16} color={PALETTE[color]} />
        </View>
        <Text className="font-semibold text-stone-900">{title}</Text>
      </View>
      {children}
    </Pressable>
  );
}

export function WalkCard({
  summary,
  onPress,
}: {
  summary: DashboardSummary['walk'];
  onPress: () => void;
}) {
  return (
    <CardShell kind="walk" title="Walks" onPress={onPress}>
      <Text className="text-stone-900">
        {summary.todayCount > 0
          ? `Walked ${formatDuration(summary.todayDurationSeconds)} today`
          : 'No walks yet today'}
      </Text>
      <Text className="text-stone-400 text-sm">
        {summary.todayCount} walk{summary.todayCount === 1 ? '' : 's'} today · Last walk{' '}
        {summary.lastAt ? formatRelative(summary.lastAt) : 'never'}
      </Text>
    </CardShell>
  );
}

export function FoodCard({
  summary,
  onPress,
}: {
  summary: DashboardSummary['food'];
  onPress: () => void;
}) {
  return (
    <CardShell kind="food" title="Food" onPress={onPress}>
      <Text className="text-stone-900">
        {summary.lastAt ? `Fed ${summary.lastFoodName} ${formatRelative(summary.lastAt)}` : 'Not fed yet'}
      </Text>
      <Text className="text-stone-400 text-sm">
        {summary.todayCount} meal{summary.todayCount === 1 ? '' : 's'} today
      </Text>
    </CardShell>
  );
}

export function TreatCard({
  summary,
  onPress,
}: {
  summary: DashboardSummary['treat'];
  onPress: () => void;
}) {
  return (
    <CardShell kind="treat" title="Treats" onPress={onPress}>
      <Text className="text-stone-900">
        {summary.todayCount} treat{summary.todayCount === 1 ? '' : 's'} today
      </Text>
      <Text className="text-stone-400 text-sm">
        Last treat {summary.lastAt ? formatRelative(summary.lastAt) : 'never'}
      </Text>
    </CardShell>
  );
}

export function MedicationCard({
  summary,
  onPress,
}: {
  summary: DashboardSummary['medication'];
  onPress: () => void;
}) {
  return (
    <CardShell kind="medication" title="Medication" onPress={onPress}>
      <Text className="text-stone-900">
        {summary.todayCount} dose{summary.todayCount === 1 ? '' : 's'} today
      </Text>
      <Text className="text-stone-400 text-sm">
        Last given {summary.lastAt ? formatRelative(summary.lastAt) : 'never'}
      </Text>
    </CardShell>
  );
}

export function BehaviorCard({
  summary,
  onPress,
}: {
  summary: DashboardSummary['behavior'];
  onPress: () => void;
}) {
  return (
    <CardShell kind="vomit" title="Behavior" onPress={onPress}>
      <Text className="text-stone-900">
        {summary.todayCount === 0
          ? 'No issues today'
          : `${summary.todayCount} event${summary.todayCount === 1 ? '' : 's'} today`}
      </Text>
      {summary.lastAt && summary.todayCount === 0 && (
        <Text className="text-stone-400 text-sm">Last event {formatRelative(summary.lastAt)}</Text>
      )}
    </CardShell>
  );
}

const VACCINE_STATUS_STYLE: Record<VaccineStatus, string> = {
  up_to_date: 'text-stone-500',
  expired: 'text-red-600',
  no_expiry: 'text-stone-400',
};

function vaccineStatusText(v: DashboardSummary['vet']['vaccines'][number]): string {
  if (v.status === 'no_expiry') return `Given ${formatDate(v.administeredDate)} · no expiry set`;
  if (v.status === 'expired') return `Expired ${formatDate(v.nextDueDate!)}`;
  return `Up to date · expires ${formatDate(v.nextDueDate!)}`;
}

export function VetCard({
  summary,
  expanded,
  onToggle,
}: {
  summary: DashboardSummary['vet'];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <CardShell kind="vet_appointment" title="Vet" onPress={onToggle}>
      <Text className="text-stone-900">
        Last visit: {summary.lastVisitDate ? formatDate(summary.lastVisitDate) : 'none logged'}
      </Text>
      <Text className="text-stone-400 text-sm">
        Upcoming: {summary.upcomingVisitDate ? formatDate(summary.upcomingVisitDate) : 'none scheduled'}
      </Text>

      {expanded && (
        <View className="mt-2 pt-2 border-t border-stone-100 gap-1.5">
          <Text className="text-stone-500 text-xs uppercase tracking-wide">Vaccines</Text>
          {summary.vaccines.length === 0 ? (
            <Text className="text-stone-400 text-sm">No vaccines logged yet</Text>
          ) : (
            summary.vaccines.map((v) => (
              <View key={v.name} className="flex-row justify-between">
                <Text className="text-stone-900 text-sm">{v.name}</Text>
                <Text className={`text-sm ${VACCINE_STATUS_STYLE[v.status]}`}>
                  {vaccineStatusText(v)}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </CardShell>
  );
}
