import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listDogs, getLogsSince, buildDashboardSummary, type LogKind } from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { DogSelector } from '../components/DogSelector';
import { LogIcon } from '../components/LogIcon';
import { useWalkTimer } from '../walkTimer/WalkTimerProvider';
import { formatElapsed } from '../walkTimer/format';
import {
  WalkCard,
  FoodCard,
  TreatCard,
  MedicationCard,
  BehaviorCard,
  VetCard,
} from './dashboard/DashboardCards';
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

const EPOCH = new Date(0).toISOString();

function useElapsedSeconds(startedAtISO?: string): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAtISO) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAtISO).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAtISO]);
  return elapsed;
}

export function TimelineScreen({ route, navigation }: Props) {
  const { householdId } = route.params;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [vetExpanded, setVetExpanded] = useState(false);

  const dogsQuery = useQuery({
    queryKey: ['dogs', householdId],
    queryFn: () => listDogs(supabase, householdId),
  });
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const dogs = dogsQuery.data ?? [];
  const activeDogId = selectedDogId ?? dogs[0]?.id ?? null;

  const logsQuery = useQuery({
    queryKey: ['timeline', activeDogId],
    queryFn: () => getLogsSince(supabase, activeDogId!, EPOCH),
    enabled: !!activeDogId,
  });
  const summary = logsQuery.data ? buildDashboardSummary(logsQuery.data) : null;

  const { activeTimers } = useWalkTimer();
  const activeWalkStartedAt = activeDogId ? activeTimers[activeDogId] : undefined;
  const activeWalkElapsed = useElapsedSeconds(activeWalkStartedAt);

  function openCategory(kind: LogKind, title: string) {
    if (activeDogId) navigation.navigate('CategoryDetail', { dogId: activeDogId, kind, title });
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <DogSelector
        dogs={dogs}
        activeDogId={activeDogId}
        onSelect={setSelectedDogId}
        onEditAvatar={(dog, color) =>
          navigation.navigate('AvatarPicker', {
            dogId: dog.id,
            dogName: dog.name,
            currentPhotoUrl: dog.photo_url,
            fallbackColor: color,
          })
        }
        onAddDog={() => navigation.navigate('AddDog')}
      />

      {activeWalkStartedAt && activeDogId && (
        <Pressable
          className="mx-4 mb-2 bg-[#E2706A] rounded-xl px-4 py-3 flex-row items-center justify-between shadow-sm"
          onPress={() => navigation.navigate('AddLog', { dogId: activeDogId, kind: 'walk' })}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="walk-outline" size={18} color="white" />
            <Text className="text-white font-medium">Walk in progress — tap to review</Text>
          </View>
          <Text className="text-white font-mono text-base">
            {formatElapsed(activeWalkElapsed)}
          </Text>
        </Pressable>
      )}

      {logsQuery.isLoading || !summary ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E2706A" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-4 gap-2 py-2">
          <WalkCard summary={summary.walk} onPress={() => openCategory('walk', 'Walks')} />
          <FoodCard summary={summary.food} onPress={() => openCategory('food', 'Food')} />
          <TreatCard summary={summary.treat} onPress={() => openCategory('treat', 'Treats')} />
          <MedicationCard
            summary={summary.medication}
            onPress={() => openCategory('medication', 'Medication')}
          />
          <BehaviorCard
            summary={summary.behavior}
            onPress={() => openCategory('vomit', 'Behavior')}
          />
          <VetCard
            summary={summary.vet}
            expanded={vetExpanded}
            onToggle={() => setVetExpanded((v) => !v)}
          />
        </ScrollView>
      )}

      <Pressable
        className="absolute bottom-6 right-6 bg-[#E2706A] w-14 h-14 rounded-full items-center justify-center shadow-sm"
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
                className="py-3 border-b border-stone-100 flex-row items-center gap-3"
                onPress={() => {
                  setPickerVisible(false);
                  if (activeDogId) navigation.navigate('AddLog', { dogId: activeDogId, kind });
                }}
              >
                <LogIcon kind={kind} size={18} />
                <Text className="text-base text-stone-900">{LOG_KIND_LABELS[kind]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
