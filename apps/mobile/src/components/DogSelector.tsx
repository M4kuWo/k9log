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
              ? 'bg-neutral-900 rounded-full px-4 py-2'
              : 'bg-neutral-100 rounded-full px-4 py-2'
          }
        >
          <Text className={dog.id === activeDogId ? 'text-white' : 'text-neutral-700'}>
            {dog.name}
          </Text>
        </Pressable>
      ))}
      {onAddDog && (
        <Pressable onPress={onAddDog} className="bg-neutral-100 rounded-full px-4 py-2">
          <Text className="text-neutral-700">+ Add dog</Text>
        </Pressable>
      )}
    </View>
  );
}
