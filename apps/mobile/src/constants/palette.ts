// Warm sunset palette (user-provided), used both as Tailwind arbitrary-value
// hex literals in className strings (e.g. "bg-[#E2706A]") and as raw hex for
// props that need JS values (Ionicons color, Switch trackColor).

export const PALETTE = {
  blue: '#6B99B0',
  yellow: '#F0CD79',
  orange: '#EFAC73',
  red: '#E2706A',
} as const;

// Light tints of each hue, for icon-circle / soft badge backgrounds.
export const PALETTE_SOFT = {
  blue: '#E7EFF3',
  yellow: '#FBF3DE',
  orange: '#FBEADD',
  red: '#FBE3E1',
} as const;

export type PaletteColor = keyof typeof PALETTE;

export const PALETTE_ORDER: PaletteColor[] = ['blue', 'yellow', 'orange', 'red'];
