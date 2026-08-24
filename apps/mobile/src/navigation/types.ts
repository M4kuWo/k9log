import type { LogKind } from '@k9log/shared';

export type MainStackParamList = {
  Timeline: { householdId: string };
  AddLog: { dogId: string; kind: LogKind };
  AddDog: undefined;
  Reports: undefined;
};
