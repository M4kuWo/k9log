import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import type { LogKind } from '@k9log/shared';
import { LOG_KIND_COLORS } from '../constants/logIcons';
import { PALETTE, PALETTE_SOFT, PALETTE_SOFT_DARK } from '../constants/palette';
import { LogGlyph } from './LogGlyph';

export function LogIcon({ kind, size = 20 }: { kind: LogKind; size?: number }) {
  const color = LOG_KIND_COLORS[kind];
  const { colorScheme } = useColorScheme();
  const soft = colorScheme === 'dark' ? PALETTE_SOFT_DARK : PALETTE_SOFT;
  return (
    <View
      className="w-9 h-9 rounded-full items-center justify-center"
      style={{ backgroundColor: soft[color] }}
    >
      <LogGlyph kind={kind} size={size} color={PALETTE[color]} />
    </View>
  );
}
