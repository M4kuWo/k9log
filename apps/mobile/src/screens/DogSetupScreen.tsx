import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDog } from '@k9log/shared';
import { supabase } from '../lib/supabase';

export function DogSetupScreen({
  householdId,
  onSuccess,
}: {
  householdId: string;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createDog(supabase, {
        id: Crypto.randomUUID(),
        household_id: householdId,
        name: name.trim(),
        breed: breed.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs', householdId] });
      onSuccess?.();
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-2xl font-bold text-stone-900">Add your dog</Text>
        <TextInput
          className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-base shadow-sm"
          placeholder="Name"
          placeholderTextColor="#a8a29e"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-base shadow-sm"
          placeholder="Breed (optional)"
          placeholderTextColor="#a8a29e"
          value={breed}
          onChangeText={setBreed}
        />
        {mutation.isError && (
          <Text className="text-red-600">{(mutation.error as Error).message}</Text>
        )}
        <Pressable
          className={
            !name.trim() || mutation.isPending
              ? 'bg-orange-300 rounded-xl py-3 items-center'
              : 'bg-orange-600 rounded-xl py-3 items-center'
          }
          disabled={!name.trim() || mutation.isPending}
          onPress={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Continue</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
