import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, PALETTE_ORDER, type PaletteColor } from '../constants/palette';

const PRESET_PREFIX = 'preset:';

export function isPresetAvatar(photoUrl: string | null): boolean {
  return !!photoUrl && photoUrl.startsWith(PRESET_PREFIX);
}

export function presetAvatarUri(color: PaletteColor): string {
  return `${PRESET_PREFIX}${color}`;
}

function presetColorFrom(photoUrl: string): PaletteColor {
  const key = photoUrl.slice(PRESET_PREFIX.length);
  return (PALETTE_ORDER as string[]).includes(key) ? (key as PaletteColor) : 'blue';
}

export function DogAvatar({
  name,
  photoUrl,
  fallbackColor,
  size = 56,
}: {
  name: string;
  photoUrl: string | null;
  fallbackColor: PaletteColor;
  size?: number;
}) {
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl && !isPresetAvatar(photoUrl)) {
    return <Image source={{ uri: photoUrl }} style={style} />;
  }

  const color = photoUrl ? presetColorFrom(photoUrl) : fallbackColor;

  return (
    <View
      className="items-center justify-center"
      style={[style, { backgroundColor: PALETTE[color] }]}
    >
      {photoUrl ? (
        <Ionicons name="paw" size={size * 0.5} color="white" />
      ) : (
        <Text className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
