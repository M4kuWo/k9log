import { View, Pressable, Text } from 'react-native';

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
}) {
  return (
    <View className="gap-2">
      <Text className="text-stone-500 text-sm">{label}</Text>
      <View
        className={
          error
            ? 'flex-row flex-wrap gap-2 border border-red-400 rounded-xl p-2'
            : 'flex-row flex-wrap gap-2'
        }
      >
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              className={
                selected
                  ? 'bg-orange-600 rounded-full px-4 py-2'
                  : 'bg-white border border-stone-200 rounded-full px-4 py-2'
              }
            >
              <Text className={selected ? 'text-white font-medium' : 'text-stone-700'}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error && <Text className="text-red-600 text-sm">{error}</Text>}
    </View>
  );
}
