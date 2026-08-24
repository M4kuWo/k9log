import { View, Pressable, Text } from 'react-native';

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-neutral-500 text-sm">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              className={
                selected
                  ? 'bg-neutral-900 rounded-full px-4 py-2'
                  : 'bg-neutral-100 rounded-full px-4 py-2'
              }
            >
              <Text className={selected ? 'text-white' : 'text-neutral-700'}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
