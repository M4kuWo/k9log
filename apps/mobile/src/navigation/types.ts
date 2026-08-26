import type { LogKind, TimelineEntry } from '@k9log/shared';
import type { PaletteColor } from '../constants/palette';

export type MainStackParamList = {
  Timeline: { householdId: string };
  // `log` is present when editing an existing entry (tapped from the
  // Timeline); absent when logging a brand new one from the + picker.
  AddLog: { dogId: string; kind: LogKind; log?: TimelineEntry['log'] };
  AddDog: undefined;
  Reports: undefined;
  AvatarPicker: {
    dogId: string;
    dogName: string;
    currentPhotoUrl: string | null;
    fallbackColor: PaletteColor;
  };
  CategoryDetail: { dogId: string; kind: LogKind; title: string };
};
