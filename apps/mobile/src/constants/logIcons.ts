import type { Ionicons } from '@expo/vector-icons';
import type { LogKind } from '@k9log/shared';
import type { PaletteColor } from './palette';

export const LOG_KIND_ICONS: Record<LogKind, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant-outline',
  walk: 'walk-outline',
  treat: 'gift-outline',
  vomit: 'medkit-outline',
  medication: 'medical-outline',
  vaccine: 'shield-checkmark-outline',
  vet_appointment: 'calendar-outline',
};

// Color-codes each category so the timeline/reports/picker read at a glance
// instead of relying on icon shape + text alone.
export const LOG_KIND_COLORS: Record<LogKind, PaletteColor> = {
  food: 'yellow',
  walk: 'blue',
  treat: 'orange',
  vomit: 'red',
  medication: 'red',
  vaccine: 'blue',
  vet_appointment: 'orange',
};
