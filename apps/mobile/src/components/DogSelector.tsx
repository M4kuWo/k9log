import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Dog } from '@k9log/shared';
import { PALETTE, PALETTE_ORDER, type PaletteColor } from '../constants/palette';
import { DogAvatar } from './DogAvatar';

export function dogColor(index: number): PaletteColor {
  return PALETTE_ORDER[index % PALETTE_ORDER.length];
}

export function DogSelector({
  dogs,
  activeDogId,
  onSelect,
  onEditAvatar,
  onAddDog,
}: {
  dogs: Dog[];
  activeDogId: string | null;
  onSelect: (id: string) => void;
  onEditAvatar?: (dog: Dog, color: PaletteColor) => void;
  onAddDog?: () => void;
}) {
  return (
    <View className="flex-row gap-3 px-4 py-2">
      {dogs.map((dog, i) => {
        const color = dogColor(i);
        const selected = dog.id === activeDogId;
        return (
          <View key={dog.id} className="items-center gap-1" style={{ width: 64 }}>
            <Pressable
              onPress={() => (onEditAvatar ? onEditAvatar(dog, color) : onSelect(dog.id))}
              className="rounded-full"
              style={
                selected
                  ? { padding: 2, borderWidth: 2, borderColor: PALETTE[color] }
                  : { padding: 2 }
              }
            >
              <DogAvatar name={dog.name} photoUrl={dog.photo_url} fallbackColor={color} size={48} />
            </Pressable>
            <Pressable onPress={() => onSelect(dog.id)}>
              <Text
                className={
                  selected
                    ? 'font-semibold text-stone-900 dark:text-stone-100'
                    : 'text-stone-600 dark:text-stone-400'
                }
                numberOfLines={1}
              >
                {dog.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
      {onAddDog && (
        <Pressable onPress={onAddDog} className="items-center gap-1" style={{ width: 64 }}>
          <View className="w-12 h-12 rounded-full border border-dashed border-stone-300 dark:border-stone-600 items-center justify-center">
            <Ionicons name="add" size={22} color="#a8a29e" />
          </View>
          <Text className="text-stone-500 dark:text-stone-400" numberOfLines={1}>
            Add dog
          </Text>
        </Pressable>
      )}
    </View>
  );
}
