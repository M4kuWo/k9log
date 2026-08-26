import type { TimelineEntry, VaccineLog } from '../types';

export type VaccineStatus = 'up_to_date' | 'expired' | 'no_expiry';

export type VaccineSummary = {
  name: string;
  administeredDate: string;
  nextDueDate: string | null;
  status: VaccineStatus;
};

export type DashboardSummary = {
  walk: { todayCount: number; todayDurationSeconds: number; lastAt: string | null };
  food: { todayCount: number; lastAt: string | null; lastFoodName: string | null };
  treat: { todayCount: number; lastAt: string | null };
  medication: { todayCount: number; lastAt: string | null };
  behavior: { todayCount: number; lastAt: string | null };
  vet: {
    lastVisitDate: string | null;
    upcomingVisitDate: string | null;
    vaccines: VaccineSummary[];
  };
};

function isToday(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function latestVaccinePerName(entries: TimelineEntry[]): VaccineLog[] {
  const byName = new Map<string, VaccineLog>();
  for (const entry of entries) {
    if (entry.kind !== 'vaccine') continue;
    const existing = byName.get(entry.log.vaccine_name);
    if (!existing || entry.log.administered_date > existing.administered_date) {
      byName.set(entry.log.vaccine_name, entry.log);
    }
  }
  return Array.from(byName.values());
}

// Builds the dashboard's per-category summaries from a dog's full log
// history (see getLogsSince in reports.ts — pass a very early sinceISO to
// get everything). Entries within each kind don't need to be pre-sorted;
// this scans all of them.
export function buildDashboardSummary(entries: TimelineEntry[], now = new Date()): DashboardSummary {
  const summary: DashboardSummary = {
    walk: { todayCount: 0, todayDurationSeconds: 0, lastAt: null },
    food: { todayCount: 0, lastAt: null, lastFoodName: null },
    treat: { todayCount: 0, lastAt: null },
    medication: { todayCount: 0, lastAt: null },
    behavior: { todayCount: 0, lastAt: null },
    vet: { lastVisitDate: null, upcomingVisitDate: null, vaccines: [] },
  };

  const isNewer = (a: string | null, b: string) => !a || b > a;

  for (const entry of entries) {
    switch (entry.kind) {
      case 'walk':
        if (isToday(entry.log.occurred_at, now)) {
          summary.walk.todayCount += 1;
          summary.walk.todayDurationSeconds += entry.log.duration_seconds ?? 0;
        }
        if (isNewer(summary.walk.lastAt, entry.log.occurred_at)) summary.walk.lastAt = entry.log.occurred_at;
        break;
      case 'food':
        if (isToday(entry.log.occurred_at, now)) summary.food.todayCount += 1;
        if (isNewer(summary.food.lastAt, entry.log.occurred_at)) {
          summary.food.lastAt = entry.log.occurred_at;
          summary.food.lastFoodName = entry.log.food_name;
        }
        break;
      case 'treat':
        if (isToday(entry.log.occurred_at, now)) summary.treat.todayCount += 1;
        if (isNewer(summary.treat.lastAt, entry.log.occurred_at)) summary.treat.lastAt = entry.log.occurred_at;
        break;
      case 'medication':
        if (isToday(entry.log.occurred_at, now)) summary.medication.todayCount += 1;
        if (isNewer(summary.medication.lastAt, entry.log.occurred_at))
          summary.medication.lastAt = entry.log.occurred_at;
        break;
      case 'vomit':
        if (isToday(entry.log.occurred_at, now)) summary.behavior.todayCount += 1;
        if (isNewer(summary.behavior.lastAt, entry.log.occurred_at))
          summary.behavior.lastAt = entry.log.occurred_at;
        break;
      case 'vet_appointment': {
        if (entry.log.status === 'cancelled') break;
        const isFuture = entry.log.scheduled_date > now.toISOString();
        if (isFuture) {
          if (!summary.vet.upcomingVisitDate || entry.log.scheduled_date < summary.vet.upcomingVisitDate) {
            summary.vet.upcomingVisitDate = entry.log.scheduled_date;
          }
        } else if (
          !summary.vet.lastVisitDate ||
          entry.log.scheduled_date > summary.vet.lastVisitDate
        ) {
          summary.vet.lastVisitDate = entry.log.scheduled_date;
        }
        break;
      }
    }
  }

  const nowDateOnly = now.toISOString().slice(0, 10);
  summary.vet.vaccines = latestVaccinePerName(entries)
    .map((v) => ({
      name: v.vaccine_name,
      administeredDate: v.administered_date,
      nextDueDate: v.next_due_date,
      status: (!v.next_due_date
        ? 'no_expiry'
        : v.next_due_date >= nowDateOnly
          ? 'up_to_date'
          : 'expired') as VaccineStatus,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return summary;
}
