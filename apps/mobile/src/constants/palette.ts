// Warm sunset palette (user-provided), used both as Tailwind arbitrary-value
// hex literals in className strings (e.g. "bg-[#316881]") and as raw hex for
// props that need JS values (Ionicons color, Switch trackColor).
//
// Deepened/more saturated from the original pastel set — those failed WCAG
// AA (4.5:1) for white text on top by a wide margin (yellow was 1.53:1).
// These were chosen by computing actual contrast ratios against white, not
// eyeballed; each clears 4.5:1 with room to spare. See PALETTE_SOFT below
// for the separate, still-light tint used behind colored icons instead of
// white text.
export const PALETTE = {
  blue: '#316881',
  yellow: '#906B0E',
  orange: '#9C5316',
  red: '#BD3228',
} as const;

// The pre-v1.8.0 palette, kept around for one specific case: a colored icon
// glyph drawn on PALETTE_SOFT_DARK (dark-mode badge backgrounds) needs a
// *light* color to read clearly against that dark tint — the opposite of
// what PALETTE above is for. Using PALETTE there directly (as LogIcon and
// ReportsScreen do in light mode) works because that pairs a dark icon with
// a near-white tint instead. blue/red nudged a touch brighter than the
// original for contrast margin; yellow/orange are unchanged.
export const PALETTE_VIVID = {
  blue: '#82ACBF',
  yellow: '#F0CD79',
  orange: '#EFAC73',
  red: '#E57D76',
} as const;

// Light tints of each hue, for icon-circle / soft badge backgrounds.
export const PALETTE_SOFT = {
  blue: '#E7EFF3',
  yellow: '#FBF3DE',
  orange: '#FBEADD',
  red: '#FBE3E1',
} as const;

// Dark-mode counterpart of PALETTE_SOFT — the light tints above read as
// washed-out/glary against a dark background, so icon badges use a muted
// dark tint of the same hue instead.
export const PALETTE_SOFT_DARK = {
  blue: '#2A3A42',
  yellow: '#453A22',
  orange: '#453324',
  red: '#452A28',
} as const;

export type PaletteColor = keyof typeof PALETTE;

export const PALETTE_ORDER: PaletteColor[] = ['blue', 'yellow', 'orange', 'red'];
