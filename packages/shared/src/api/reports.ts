import type { SupabaseClient } from '../supabaseClient';
import {
  LOG_TABLES,
  FoodLogSchema,
  WalkLogSchema,
  TreatLogSchema,
  VomitLogSchema,
  MedicationLogSchema,
  VaccineLogSchema,
  VetAppointmentSchema,
  type TimelineEntry,
} from '../types';

export type ReportRange = 'day' | 'week' | 'month' | 'year';

const RANGE_DAYS: Record<ReportRange, number> = { day: 1, week: 7, month: 30, year: 365 };

export function rangeStartISO(range: ReportRange, now = new Date()): string {
  const start = new Date(now);
  start.setDate(start.getDate() - (RANGE_DAYS[range] - 1));
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

// Same per-table fan-out as getTimeline, filtered by a start date instead of
// a row limit. Feeds the simple summary cards today; a future chart view can
// reuse this same raw data instead of adding new queries.
export async function getLogsSince(
  client: SupabaseClient,
  dogId: string,
  sinceISO: string
): Promise<TimelineEntry[]> {
  const queries = [
    { kind: 'food' as const, table: LOG_TABLES.food, schema: FoodLogSchema },
    { kind: 'walk' as const, table: LOG_TABLES.walk, schema: WalkLogSchema },
    { kind: 'treat' as const, table: LOG_TABLES.treat, schema: TreatLogSchema },
    { kind: 'vomit' as const, table: LOG_TABLES.vomit, schema: VomitLogSchema },
    { kind: 'medication' as const, table: LOG_TABLES.medication, schema: MedicationLogSchema },
    { kind: 'vaccine' as const, table: LOG_TABLES.vaccine, schema: VaccineLogSchema },
    {
      kind: 'vet_appointment' as const,
      table: LOG_TABLES.vet_appointment,
      schema: VetAppointmentSchema,
    },
  ];

  const results = await Promise.all(
    queries.map(async ({ kind, table, schema }) => {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('dog_id', dogId)
        .is('deleted_at', null)
        .gte('occurred_at', sinceISO)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return data.map((row) => ({ kind, log: schema.parse(row) }) as TimelineEntry);
    })
  );

  return results.flat();
}

export type ReportSummary = {
  food: { count: number; amountByUnit: Record<string, number> };
  walk: { count: number; totalDurationSeconds: number };
  treat: { count: number; totalQuantity: number | null };
  vomit: { count: number };
  medication: { count: number };
  vaccine: { count: number };
  vet_appointment: { count: number };
};

export type ChartBucket = { label: string; minutes: number };

// Buckets walk duration into a small number of points suitable for a bar
// chart: daily buckets for day/week/month (day just has the one), monthly
// buckets for year (365 daily bars would be unreadable).
export function bucketWalkMinutes(
  entries: TimelineEntry[],
  range: ReportRange,
  now = new Date()
): ChartBucket[] {
  const walks = entries.filter((e): e is Extract<TimelineEntry, { kind: 'walk' }> => e.kind === 'walk');

  if (range === 'year') {
    const buckets: ChartBucket[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), minutes: 0 });
    }
    for (const { log } of walks) {
      const d = new Date(log.occurred_at);
      const monthsAgo =
        (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthsAgo >= 0 && monthsAgo < 12) {
        buckets[11 - monthsAgo].minutes += (log.duration_seconds ?? 0) / 60;
      }
    }
    return buckets.map((b) => ({ ...b, minutes: Math.round(b.minutes) }));
  }

  const days = range === 'month' ? 30 : range === 'week' ? 7 : 1;
  const buckets: ChartBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.push({
      label: days === 1 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      minutes: 0,
    });
  }
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  for (const { log } of walks) {
    const d = new Date(log.occurred_at);
    d.setHours(0, 0, 0, 0);
    const daysAgo = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo < days) {
      buckets[days - 1 - daysAgo].minutes += (log.duration_seconds ?? 0) / 60;
    }
  }
  return buckets.map((b) => ({ ...b, minutes: Math.round(b.minutes) }));
}

// Food amounts are summed per-unit rather than blindly added together, since
// a household can log the same dog in grams one day and cups another.
export function summarize(entries: TimelineEntry[]): ReportSummary {
  const summary: ReportSummary = {
    food: { count: 0, amountByUnit: {} },
    walk: { count: 0, totalDurationSeconds: 0 },
    treat: { count: 0, totalQuantity: null },
    vomit: { count: 0 },
    medication: { count: 0 },
    vaccine: { count: 0 },
    vet_appointment: { count: 0 },
  };

  for (const entry of entries) {
    switch (entry.kind) {
      case 'food':
        summary.food.count += 1;
        if (entry.log.amount != null && entry.log.unit) {
          summary.food.amountByUnit[entry.log.unit] =
            (summary.food.amountByUnit[entry.log.unit] ?? 0) + entry.log.amount;
        }
        break;
      case 'walk':
        summary.walk.count += 1;
        summary.walk.totalDurationSeconds += entry.log.duration_seconds ?? 0;
        break;
      case 'treat':
        summary.treat.count += 1;
        if (entry.log.quantity != null) {
          summary.treat.totalQuantity = (summary.treat.totalQuantity ?? 0) + entry.log.quantity;
        }
        break;
      case 'vomit':
        summary.vomit.count += 1;
        break;
      case 'medication':
        summary.medication.count += 1;
        break;
      case 'vaccine':
        summary.vaccine.count += 1;
        break;
      case 'vet_appointment':
        summary.vet_appointment.count += 1;
        break;
    }
  }

  return summary;
}
