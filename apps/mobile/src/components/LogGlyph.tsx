import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { LogKind } from '@k9log/shared';
import { LOG_KIND_ICON } from '../constants/logIcons';

export function LogGlyph({
  kind,
  size,
  color,
}: {
  kind: LogKind;
  size: number;
  color: string;
}) {
  const spec = LOG_KIND_ICON[kind];
  if (spec.family === 'mci') {
    return <MaterialCommunityIcons name={spec.name} size={size} color={color} />;
  }
  return <Ionicons name={spec.name} size={size} color={color} />;
}
