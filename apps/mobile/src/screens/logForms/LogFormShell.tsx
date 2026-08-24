import { useState, type ReactNode } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export function LogFormShell({
  title,
  occurredAt,
  onChangeOccurredAt,
  notes,
  onChangeNotes,
  onSubmit,
  isSubmitting,
  error,
  canSubmit,
  children,
}: {
  title: string;
  occurredAt: Date;
  onChangeOccurredAt: (date: Date) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  canSubmit: boolean;
  children: ReactNode;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" contentContainerClassName="gap-4 py-4">
        <Text className="text-2xl font-bold text-neutral-900">{title}</Text>

        <Pressable
          className="border border-neutral-300 rounded-lg px-4 py-3"
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-neutral-500 text-sm">When</Text>
          <Text className="text-base text-neutral-900">{occurredAt.toLocaleString()}</Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={occurredAt}
            mode="datetime"
            onChange={(_event, date) => {
              setShowPicker(false);
              if (date) onChangeOccurredAt(date);
            }}
          />
        )}

        {children}

        <View className="gap-2">
          <Text className="text-neutral-500 text-sm">Notes (optional)</Text>
          <TextInput
            className="border border-neutral-300 rounded-lg px-4 py-3 text-base"
            placeholder="Anything else worth noting"
            value={notes}
            onChangeText={onChangeNotes}
            multiline
          />
        </View>

        {error && <Text className="text-red-600">{error}</Text>}

        <Pressable
          className="bg-neutral-900 rounded-lg py-3 items-center"
          disabled={!canSubmit || isSubmitting}
          onPress={onSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
