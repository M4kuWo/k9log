import { View, Text, TextInput, type TextInputProps } from 'react-native';

export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: string } & TextInputProps) {
  return (
    <View className="gap-2">
      <Text className="text-stone-500 text-sm">{label}</Text>
      <TextInput
        className={
          error
            ? 'bg-white border border-red-400 rounded-xl px-4 py-3 text-base shadow-sm'
            : 'bg-white border border-stone-200 rounded-xl px-4 py-3 text-base shadow-sm'
        }
        placeholderTextColor="#a8a29e"
        {...props}
      />
      {error && <Text className="text-red-600 text-sm">{error}</Text>}
    </View>
  );
}
