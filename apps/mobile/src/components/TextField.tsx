import { View, Text, TextInput, type TextInputProps } from 'react-native';

export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: string } & TextInputProps) {
  return (
    <View className="gap-2">
      <Text className="text-stone-500 dark:text-stone-400 text-sm">{label}</Text>
      <TextInput
        className={
          error
            ? 'bg-white dark:bg-stone-800 dark:text-stone-100 border border-red-400 rounded-xl px-4 py-3 text-base shadow-sm'
            : 'bg-white dark:bg-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-base shadow-sm'
        }
        placeholderTextColor="#a8a29e"
        {...props}
      />
      {error && <Text className="text-red-600 text-sm">{error}</Text>}
    </View>
  );
}
