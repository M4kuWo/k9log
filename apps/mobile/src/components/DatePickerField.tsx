import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export function DatePickerField({
  label,
  value,
  onChange,
  clearable,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  clearable?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View className="gap-2">
      <Text className="text-stone-500 text-sm">{label}</Text>
      <View className="flex-row gap-2">
        <Pressable
          className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm"
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-base text-stone-900">
            {value ? value.toLocaleDateString() : 'Not set'}
          </Text>
        </Pressable>
        {clearable && value && (
          <Pressable className="justify-center px-3" onPress={() => onChange(null)}>
            <Text className="text-[#E2706A] font-medium">Clear</Text>
          </Pressable>
        )}
      </View>
      {showPicker && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          onChange={(_event, date) => {
            setShowPicker(false);
            if (date) onChange(date);
          }}
        />
      )}
    </View>
  );
}
