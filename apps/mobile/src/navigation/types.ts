import type { LogKind, TimelineEntry } from '@k9log/shared';

export type MainStackParamList = {
  Timeline: { householdId: string };
  // `log` is present when editing an existing entry (tapped from the
  // Timeline); absent when logging a brand new one from the + picker.
  AddLog: { dogId: string; kind: LogKind; log?: TimelineEntry['log'] };
  AddDog: undefined;
  Reports: undefined;
};
