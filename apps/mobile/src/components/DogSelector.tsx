import { View, Text, Pressable } from 'react-native';
import type { Dog } from '@k9log/shared';
import { PALETTE, PALETTE_ORDER } from '../constants/palette';

export function DogSelector({
  dogs,
  activeDogId,
  onSelect,
  onAddDog,
}: {
  dogs: Dog[];
  activeDogId: string | null;
  onSelect: (id: string) => void;
  onAddDog?: () => void;
}) {
  return (
    <View className="flex-row gap-2 px-4 py-2">
      {dogs.map((dog, i) => {
        const color = PALETTE[PALETTE_ORDER[i % PALETTE_ORDER.length]];
        const selected = dog.id === activeDogId;
        return (
          <Pressable
            key={dog.id}
            onPress={() => onSelect(dog.id)}
            className="rounded-full px-4 py-2"
            style={
              selected
                ? { backgroundColor: color }
                : { backgroundColor: 'white', borderWidth: 1, borderColor: color }
            }
          >
            {/* Pastel fills read poorly with white text, so use dark text
                throughout and let the color come through fill/border. */}
            <Text className="font-medium text-stone-900">{dog.name}</Text>
          </Pressable>
        );
      })}
      {onAddDog && (
        <Pressable
          onPress={onAddDog}
          className="border border-dashed border-stone-300 rounded-full px-4 py-2"
        >
          <Text className="text-stone-500">+ Add dog</Text>
        </Pressable>
      )}
    </View>
  );
}
