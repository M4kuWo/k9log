import type { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { LogKind } from '@k9log/shared';
import type { PaletteColor } from './palette';

export type IconSpec =
  | { family: 'ionicons'; name: keyof typeof Ionicons.glyphMap }
  | { family: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };

// `walk` uses a dog silhouette (MaterialCommunityIcons "dog-side") rather
// than Ionicons' generic walking-person figure — reads unmistakably as a
// dog walk rather than a person's.
export const LOG_KIND_ICON: Record<LogKind, IconSpec> = {
  food: { family: 'ionicons', name: 'restaurant-outline' },
  walk: { family: 'mci', name: 'dog-side' },
  treat: { family: 'ionicons', name: 'gift-outline' },
  vomit: { family: 'ionicons', name: 'medkit-outline' },
  medication: { family: 'ionicons', name: 'medical-outline' },
  vaccine: { family: 'ionicons', name: 'shield-checkmark-outline' },
  vet_appointment: { family: 'ionicons', name: 'calendar-outline' },
};

export const LOG_KIND_COLORS: Record<LogKind, PaletteColor> = {
  food: 'yellow',
  walk: 'blue',
  treat: 'orange',
  vomit: 'red',
  medication: 'red',
  vaccine: 'blue',
  vet_appointment: 'orange',
};
