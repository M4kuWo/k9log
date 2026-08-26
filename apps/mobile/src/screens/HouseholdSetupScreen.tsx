import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHousehold, joinHousehold } from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export function HouseholdSetupScreen() {
  const { session } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (householdName: string) =>
      createHousehold(supabase, Crypto.randomUUID(), householdName, session!.user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['households'] }),
  });

  const joinMutation = useMutation({
    mutationFn: async (householdId: string) => {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(householdId)) {
        throw new Error("That doesn't look like a valid invite code.");
      }
      return joinHousehold(supabase, householdId, session!.user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['households'] }),
  });

  const mutation = mode === 'create' ? createMutation : joinMutation;

  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-900">
      <View className="flex-1 justify-center px-6 gap-4">
        <View className="flex-row bg-stone-200 dark:bg-stone-800 rounded-xl p-1 self-start">
          <Pressable
            onPress={() => setMode('create')}
            className={mode === 'create' ? 'bg-white dark:bg-stone-700 rounded-lg px-4 py-2' : 'px-4 py-2'}
          >
            <Text
              className={
                mode === 'create'
                  ? 'text-stone-900 dark:text-stone-100 font-medium'
                  : 'text-stone-500 dark:text-stone-400'
              }
            >
              Create
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('join')}
            className={mode === 'join' ? 'bg-white dark:bg-stone-700 rounded-lg px-4 py-2' : 'px-4 py-2'}
          >
            <Text
              className={
                mode === 'join'
                  ? 'text-stone-900 dark:text-stone-100 font-medium'
                  : 'text-stone-500 dark:text-stone-400'
              }
            >
              Join
            </Text>
          </Pressable>
        </View>

        {mode === 'create' ? (
          <>
            <Text className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              Name your household
            </Text>
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
          </>
        ) : (
          <>
            <Text className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              Join a household
            </Text>
            <Text className="text-stone-500 dark:text-stone-400">
              Enter the invite code shared with you — you'll see the same dogs and timeline as
              everyone else in that household.
            </Text>
            <TextInput
              className="bg-white dark:bg-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-base shadow-sm"
              placeholder="Invite code"
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
              autoCorrect={false}
              value={inviteCode}
              onChangeText={setInviteCode}
            />
          </>
        )}

        {mutation.isError && <Text className="text-red-600">{(mutation.error as Error).message}</Text>}

        <Pressable
          className="bg-[#E2706A] rounded-xl py-3 items-center"
          style={
            mode === 'create'
              ? !name.trim() || mutation.isPending
                ? { opacity: 0.5 }
                : undefined
              : !inviteCode.trim() || mutation.isPending
                ? { opacity: 0.5 }
                : undefined
          }
          disabled={mode === 'create' ? !name.trim() || mutation.isPending : !inviteCode.trim() || mutation.isPending}
          onPress={() =>
            mode === 'create' ? createMutation.mutate(name.trim()) : joinMutation.mutate(inviteCode.trim())
          }
        >
          {mutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              {mode === 'create' ? 'Continue' : 'Join household'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
