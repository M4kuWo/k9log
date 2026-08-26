import { View, Text, TextInput, type TextInputProps } from 'react-native';

export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: string } & TextInputProps) {
  return (
    <View className="gap-2">
      <Text className="text-neutral-500 text-sm">{label}</Text>
      <TextInput
        className={
          error
            ? 'border border-red-400 rounded-lg px-4 py-3 text-base'
            : 'border border-neutral-300 rounded-lg px-4 py-3 text-base'
        }
        {...props}
      />
      {error && <Text className="text-red-600 text-sm">{error}</Text>}
    </View>
  );
}
