import { useState, type ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export function LogFormShell({
  title,
  occurredAt,
  onChangeOccurredAt,
  notes,
  onChangeNotes,
  onSubmit,
  submitLabel = 'Save',
  isSubmitting,
  error,
  onDelete,
  isDeleting,
  children,
}: {
  title: string;
  occurredAt: Date;
  onChangeOccurredAt: (date: Date) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting: boolean;
  error: string | null;
  onDelete?: () => void;
  isDeleting?: boolean;
  children: ReactNode;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView className="flex-1 px-6" contentContainerClassName="gap-4 py-4">
        <Text className="text-2xl font-bold text-stone-900">{title}</Text>

        <Pressable
          className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm"
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-stone-500 text-sm">When</Text>
          <Text className="text-base text-stone-900">{occurredAt.toLocaleString()}</Text>
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
          <Text className="text-stone-500 text-sm">Notes (optional)</Text>
          <TextInput
            className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-base shadow-sm"
            placeholder="Anything else worth noting"
            value={notes}
            onChangeText={onChangeNotes}
            multiline
          />
        </View>

        {error && <Text className="text-red-600">{error}</Text>}

        <Pressable
          className="bg-[#E2706A] rounded-xl py-3 items-center"
          style={isSubmitting ? { opacity: 0.6 } : undefined}
          disabled={isSubmitting}
          onPress={onSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">{submitLabel}</Text>
          )}
        </Pressable>

        {onDelete && (
          <Pressable
            className="py-3 items-center"
            disabled={isDeleting}
            onPress={() =>
              Alert.alert('Delete this entry?', 'This cannot be undone from the app.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ])
            }
          >
            {isDeleting ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <Text className="text-red-600 font-medium">Delete entry</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
