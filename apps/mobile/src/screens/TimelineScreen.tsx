import { useState } from 'react';
import { View, Text, FlatList, Pressable, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listDogs, getTimeline, type LogKind, type TimelineEntry } from '@k9log/shared';
import { supabase } from '../lib/supabase';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Timeline'>;

const LOG_KIND_LABELS: Record<LogKind, string> = {
  food: 'Food',
  walk: 'Walk',
  treat: 'Treat',
  vomit: 'Vomit / illness',
  medication: 'Medication',
  vaccine: 'Vaccine',
  vet_appointment: 'Vet appointment',
};

function entryTitle(entry: TimelineEntry): string {
  switch (entry.kind) {
    case 'food':
      return `Fed ${entry.log.food_name}`;
    case 'walk':
      return entry.log.duration_seconds
        ? `Walked ${Math.round(entry.log.duration_seconds / 60)} min`
        : 'Walk';
    case 'treat':
      return `Treat: ${entry.log.treat_name}`;
    case 'vomit':
      return `Vomit (${entry.log.consistency ?? 'unspecified'})`;
    case 'medication':
      return `Medication: ${entry.log.medication_name}`;
    case 'vaccine':
      return `Vaccine: ${entry.log.vaccine_name}`;
    case 'vet_appointment':
      return `Vet: ${entry.log.reason ?? entry.log.status}`;
  }
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function TimelineScreen({ route, navigation }: Props) {
  const { householdId } = route.params;
  const [pickerVisible, setPickerVisible] = useState(false);

  const dogsQuery = useQuery({
    queryKey: ['dogs', householdId],
    queryFn: () => listDogs(supabase, householdId),
  });
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const dogs = dogsQuery.data ?? [];
  const activeDogId = selectedDogId ?? dogs[0]?.id ?? null;

  const timelineQuery = useQuery({
    queryKey: ['timeline', activeDogId],
    queryFn: () => getTimeline(supabase, activeDogId!),
    enabled: !!activeDogId,
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row gap-2 px-4 py-2">
        {dogs.map((dog) => (
          <Pressable
            key={dog.id}
            onPress={() => setSelectedDogId(dog.id)}
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
        <Pressable
          onPress={() => navigation.navigate('AddDog')}
          className="bg-neutral-100 rounded-full px-4 py-2"
        >
          <Text className="text-neutral-700">+ Add dog</Text>
        </Pressable>
      </View>

      {timelineQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={timelineQuery.data ?? []}
          keyExtractor={(item) => item.log.id}
          contentContainerClassName="px-4 gap-2 py-2"
          ListEmptyComponent={
            <Text className="text-neutral-400 text-center mt-12">
              No entries yet — tap + to log something.
            </Text>
          }
          renderItem={({ item }) => (
            <View className="border border-neutral-200 rounded-lg px-4 py-3">
              <Text className="text-base font-medium text-neutral-900">{entryTitle(item)}</Text>
              <Text className="text-neutral-400 text-sm mt-1">
                {formatWhen(item.log.occurred_at)}
                {item.log.notes ? ` · ${item.log.notes}` : ''}
              </Text>
            </View>
          )}
        />
      )}

      <Pressable
        className="absolute bottom-6 right-6 bg-neutral-900 w-14 h-14 rounded-full items-center justify-center"
        onPress={() => setPickerVisible(true)}
        disabled={!activeDogId}
      >
        <Text className="text-white text-3xl leading-8">+</Text>
      </Pressable>

      <Modal visible={pickerVisible} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/30" onPress={() => setPickerVisible(false)}>
          <View className="mt-auto bg-white rounded-t-2xl px-4 pt-4 pb-8 gap-1">
            {(Object.keys(LOG_KIND_LABELS) as LogKind[]).map((kind) => (
              <Pressable
                key={kind}
                className="py-3 border-b border-neutral-100"
                onPress={() => {
                  setPickerVisible(false);
                  if (activeDogId) navigation.navigate('AddLog', { dogId: activeDogId, kind });
                }}
              >
                <Text className="text-base text-neutral-900">{LOG_KIND_LABELS[kind]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
