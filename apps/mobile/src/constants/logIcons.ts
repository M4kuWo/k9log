import type { Ionicons } from '@expo/vector-icons';
import type { LogKind } from '@k9log/shared';

export const LOG_KIND_ICONS: Record<LogKind, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant-outline',
  walk: 'walk-outline',
  treat: 'gift-outline',
  vomit: 'medkit-outline',
  medication: 'medical-outline',
  vaccine: 'shield-checkmark-outline',
  vet_appointment: 'calendar-outline',
};
