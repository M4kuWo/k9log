import { View, Text, Pressable } from 'react-native';
import type { Dog } from '@k9log/shared';

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
      {dogs.map((dog) => (
        <Pressable
          key={dog.id}
          onPress={() => onSelect(dog.id)}
          className={
            dog.id === activeDogId
              ? 'bg-orange-600 rounded-full px-4 py-2'
              : 'bg-white border border-stone-200 rounded-full px-4 py-2'
          }
        >
          <Text className={dog.id === activeDogId ? 'text-white font-medium' : 'text-stone-700'}>
            {dog.name}
          </Text>
        </Pressable>
      ))}
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
