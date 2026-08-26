import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHousehold } from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export function HouseholdSetupScreen() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (householdName: string) =>
      createHousehold(supabase, Crypto.randomUUID(), householdName, session!.user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['households'] }),
  });

  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-900">
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-2xl font-bold text-stone-900 dark:text-stone-100">Name your household</Text>
        <Text className="text-stone-500 dark:text-stone-400">
          Everyone you invite later will see the same shared timeline.
        </Text>
        <TextInput
          className="bg-white dark:bg-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-base shadow-sm"
          placeholder="e.g. The Smiths"
          placeholderTextColor="#a8a29e"
          value={name}
          onChangeText={setName}
        />
        {mutation.isError && (
          <Text className="text-red-600">{(mutation.error as Error).message}</Text>
        )}
        <Pressable
          className="bg-[#E2706A] rounded-xl py-3 items-center"
          style={!name.trim() || mutation.isPending ? { opacity: 0.5 } : undefined}
          disabled={!name.trim() || mutation.isPending}
          onPress={() => mutation.mutate(name.trim())}
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
