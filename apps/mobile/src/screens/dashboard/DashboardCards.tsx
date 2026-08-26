import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DashboardSummary, LogKind, VaccineStatus } from '@k9log/shared';
import { LOG_KIND_COLORS } from '../../constants/logIcons';
import { PALETTE } from '../../constants/palette';
import { formatDuration, formatRelative, formatDate } from '../../utils/format';
import { LogGlyph } from '../../components/LogGlyph';

function QuickAddButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      className="w-8 h-8 rounded-full bg-white/25 items-center justify-center"
    >
      <Ionicons name="add" size={20} color="white" />
    </Pressable>
  );
}

function CardShell({
  kind,
  title,
  onPress,
  onQuickAdd,
  children,
}: {
  kind: LogKind;
  title: string;
  onPress?: () => void;
  onQuickAdd?: () => void;
  children: React.ReactNode;
}) {
  const color = PALETTE[LOG_KIND_COLORS[kind]];
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl px-4 py-4 flex-row items-center gap-3"
      style={{ backgroundColor: color }}
    >
      <LogGlyph kind={kind} size={38} color="rgba(255,255,255,0.85)" />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-bold text-lg">{title}</Text>
          {onQuickAdd && <QuickAddButton onPress={onQuickAdd} />}
        </View>
        {children}
      </View>
    </Pressable>
  );
}

export function WalkCard({
  summary,
  onPress,
  onQuickAdd,
}: {
  summary: DashboardSummary['walk'];
  onPress: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <CardShell kind="walk" title="Walks" onPress={onPress} onQuickAdd={onQuickAdd}>
      <Text className="text-white">
        {summary.todayCount > 0
          ? `Walked ${formatDuration(summary.todayDurationSeconds)} today`
          : 'No walks yet today'}
      </Text>
      <Text className="text-white/80 text-sm">
        {summary.todayCount} walk{summary.todayCount === 1 ? '' : 's'} today · Last walk{' '}
        {summary.lastAt ? formatRelative(summary.lastAt) : 'never'}
      </Text>
    </CardShell>
  );
}

export function FoodCard({
  summary,
  onPress,
  onQuickAdd,
}: {
  summary: DashboardSummary['food'];
  onPress: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <CardShell kind="food" title="Food" onPress={onPress} onQuickAdd={onQuickAdd}>
      <Text className="text-white">
        {summary.lastAt ? `Fed ${summary.lastFoodName} ${formatRelative(summary.lastAt)}` : 'Not fed yet'}
      </Text>
      <Text className="text-white/80 text-sm">
        {summary.todayCount} meal{summary.todayCount === 1 ? '' : 's'} today
      </Text>
    </CardShell>
  );
}

export function TreatCard({
  summary,
  onPress,
  onQuickAdd,
}: {
  summary: DashboardSummary['treat'];
  onPress: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <CardShell kind="treat" title="Treats" onPress={onPress} onQuickAdd={onQuickAdd}>
      <Text className="text-white">
        {summary.todayCount} treat{summary.todayCount === 1 ? '' : 's'} today
      </Text>
      <Text className="text-white/80 text-sm">
        Last treat {summary.lastAt ? formatRelative(summary.lastAt) : 'never'}
      </Text>
    </CardShell>
  );
}

export function MedicationCard({
  summary,
  onPress,
  onQuickAdd,
}: {
  summary: DashboardSummary['medication'];
  onPress: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <CardShell kind="medication" title="Medication" onPress={onPress} onQuickAdd={onQuickAdd}>
      <Text className="text-white">
        {summary.todayCount} dose{summary.todayCount === 1 ? '' : 's'} today
      </Text>
      <Text className="text-white/80 text-sm">
        Last given {summary.lastAt ? formatRelative(summary.lastAt) : 'never'}
      </Text>
    </CardShell>
  );
}

export function BehaviorCard({
  summary,
  onPress,
  onQuickAdd,
}: {
  summary: DashboardSummary['behavior'];
  onPress: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <CardShell kind="vomit" title="Behavior" onPress={onPress} onQuickAdd={onQuickAdd}>
      <Text className="text-white">
        {summary.todayCount === 0
          ? 'No issues today'
          : `${summary.todayCount} event${summary.todayCount === 1 ? '' : 's'} today`}
      </Text>
      {summary.lastAt && summary.todayCount === 0 && (
        <Text className="text-white/80 text-sm">Last event {formatRelative(summary.lastAt)}</Text>
      )}
    </CardShell>
  );
}

function vaccineStatusText(v: DashboardSummary['vet']['vaccines'][number]): string {
  if (v.status === 'no_expiry') return `Given ${formatDate(v.administeredDate)} · no expiry set`;
  if (v.status === 'expired') return `Expired ${formatDate(v.nextDueDate!)}`;
  return `Up to date · expires ${formatDate(v.nextDueDate!)}`;
}

const VACCINE_STATUS_WEIGHT: Record<VaccineStatus, string> = {
  up_to_date: 'text-white/80',
  expired: 'text-white font-semibold',
  no_expiry: 'text-white/70',
};

export function VetCard({
  summary,
  expanded,
  onToggle,
  onQuickAdd,
}: {
  summary: DashboardSummary['vet'];
  expanded: boolean;
  onToggle: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <CardShell kind="vet_appointment" title="Vet" onPress={onToggle} onQuickAdd={onQuickAdd}>
      <Text className="text-white">
        Last visit: {summary.lastVisitDate ? formatDate(summary.lastVisitDate) : 'none logged'}
      </Text>
      <Text className="text-white/80 text-sm">
        Upcoming: {summary.upcomingVisitDate ? formatDate(summary.upcomingVisitDate) : 'none scheduled'}
      </Text>

      {expanded && (
        <View className="mt-2 pt-2 border-t border-white/25 gap-1.5">
          <Text className="text-white/70 text-xs uppercase tracking-wide">Vaccines</Text>
          {summary.vaccines.length === 0 ? (
            <Text className="text-white/80 text-sm">No vaccines logged yet</Text>
          ) : (
            summary.vaccines.map((v) => (
              <View key={v.name} className="flex-row justify-between">
                <Text className="text-white text-sm">{v.name}</Text>
                <Text className={`text-sm ${VACCINE_STATUS_WEIGHT[v.status]}`}>
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
