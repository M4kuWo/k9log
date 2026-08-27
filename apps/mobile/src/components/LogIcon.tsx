import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import type { LogKind } from '@k9log/shared';
import { LOG_KIND_COLORS } from '../constants/logIcons';
import { PALETTE, PALETTE_VIVID, PALETTE_SOFT, PALETTE_SOFT_DARK } from '../constants/palette';
import { LogGlyph } from './LogGlyph';

export function LogIcon({ kind, size = 20 }: { kind: LogKind; size?: number }) {
  const color = LOG_KIND_COLORS[kind];
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const soft = isDark ? PALETTE_SOFT_DARK : PALETTE_SOFT;
  // The dark-tint badge background needs a light icon color to read clearly
  // — the opposite of PALETTE, which is tuned for dark fills. See palette.ts.
  const iconColor = isDark ? PALETTE_VIVID[color] : PALETTE[color];
  return (
    <View
      className="w-9 h-9 rounded-full items-center justify-center"
      style={{ backgroundColor: soft[color] }}
    >
      <LogGlyph kind={kind} size={size} color={iconColor} />
    </View>
  );
}
