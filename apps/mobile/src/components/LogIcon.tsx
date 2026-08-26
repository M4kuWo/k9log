import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LogKind } from '@k9log/shared';
import { LOG_KIND_ICONS, LOG_KIND_COLORS } from '../constants/logIcons';
import { PALETTE, PALETTE_SOFT } from '../constants/palette';

export function LogIcon({ kind, size = 20 }: { kind: LogKind; size?: number }) {
  const color = LOG_KIND_COLORS[kind];
  return (
    <View
      className="w-9 h-9 rounded-full items-center justify-center"
      style={{ backgroundColor: PALETTE_SOFT[color] }}
    >
      <Ionicons name={LOG_KIND_ICONS[kind]} size={size} color={PALETTE[color]} />
    </View>
  );
}
