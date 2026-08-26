import type { TimelineEntry } from '@k9log/shared';

export function entryTitle(entry: TimelineEntry): string {
  switch (entry.kind) {
    case 'food':
      return `Fed ${entry.log.food_name}`;
    case 'walk':
      return entry.log.duration_seconds
        ? `Walked ${Math.round(entry.log.duration_seconds / 60)} min`
        : 'Walk';
    case 'treat':
      return `Treat: ${entry.log.treat_name}`;
    case 'vomit':
      return `Vomit (${entry.log.consistency ?? 'unspecified'})`;
    case 'medication':
      return `Medication: ${entry.log.medication_name}`;
    case 'vaccine':
      return `Vaccine: ${entry.log.vaccine_name}`;
    case 'vet_appointment':
      return `Vet: ${entry.log.reason ?? entry.log.status}`;
  }
}
