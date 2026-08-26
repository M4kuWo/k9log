import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholdMembers,
  createTelegramLinkCode,
  getMyTelegramLink,
  unlinkTelegram,
  type Household,
} from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { UserAvatar } from '../components/UserAvatar';

export function HouseholdScreen({ household }: { household: Household }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const membersQuery = useQuery({
    queryKey: ['household-members', household.id],
    queryFn: () => getHouseholdMembers(supabase, household.id),
  });

  const telegramLinkQuery = useQuery({
    queryKey: ['telegram-link'],
    queryFn: () => getMyTelegramLink(supabase),
  });

  const linkCodeMutation = useMutation({
    mutationFn: () => createTelegramLinkCode(supabase, session!.user.id, household.id),
  });

  const unlinkMutation = useMutation({
    mutationFn: (chatId: number) => unlinkTelegram(supabase, chatId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['telegram-link'] }),
  });

  async function copyInviteCode() {
    await Clipboard.setStringAsync(household.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-900">
      <View className="px-6 py-4 gap-6">
        <View className="items-center gap-2">
          <UserAvatar email={session?.user.email ?? '?'} size={64} />
          <Text className="text-stone-900 dark:text-stone-100 font-semibold text-base">
            {session?.user.email}
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-stone-500 dark:text-stone-400 text-sm">
            {household.name}
          </Text>
          <View className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            {membersQuery.isLoading ? (
              <View className="p-4 items-center">
                <ActivityIndicator color="#E2706A" />
              </View>
            ) : (
              membersQuery.data?.map((member, i) => (
                <View
                  key={member.user_id}
                  className={
                    i > 0
                      ? 'flex-row items-center gap-3 px-4 py-3 border-t border-stone-100 dark:border-stone-700'
                      : 'flex-row items-center gap-3 px-4 py-3'
                  }
                >
                  <UserAvatar email={member.profile.email} size={36} />
                  <View className="flex-1">
                    <Text className="text-stone-900 dark:text-stone-100">
                      {member.profile.email}
                    </Text>
                    <Text className="text-stone-400 dark:text-stone-500 text-xs capitalize">
                      {member.role}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-stone-500 dark:text-stone-400 text-sm">Invite someone</Text>
          <Text className="text-stone-400 dark:text-stone-500 text-xs">
            Share this code — they can enter it when setting up their account to join this
            household instead of starting a new one.
          </Text>
          <Pressable
            onPress={copyInviteCode}
            className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 px-4 py-3 flex-row items-center justify-between"
          >
            <Text
              className="text-stone-900 dark:text-stone-100 flex-1"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {household.id}
            </Text>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={18}
              color={copied ? '#E2706A' : '#a8a29e'}
            />
          </Pressable>
          {copied && <Text className="text-[#E2706A] text-xs">Copied</Text>}
        </View>

        <View className="gap-2">
          <Text className="text-stone-500 dark:text-stone-400 text-sm">Telegram bot</Text>

          {telegramLinkQuery.isLoading ? (
            <ActivityIndicator color="#E2706A" />
          ) : telegramLinkQuery.data ? (
            <View className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 px-4 py-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={18} color="#E2706A" />
                <Text className="text-stone-900 dark:text-stone-100">Linked</Text>
              </View>
              <Pressable
                onPress={() => unlinkMutation.mutate(telegramLinkQuery.data!.chat_id)}
                disabled={unlinkMutation.isPending}
              >
                <Text className="text-red-600 text-sm">Unlink</Text>
              </Pressable>
            </View>
          ) : linkCodeMutation.data ? (
            <View className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 px-4 py-3 gap-1">
              <Text className="text-stone-900 dark:text-stone-100 text-2xl font-bold tracking-widest text-center">
                {linkCodeMutation.data.code}
              </Text>
              <Text className="text-stone-400 dark:text-stone-500 text-xs text-center">
                Message the bot with /link {linkCodeMutation.data.code} — expires in 10 minutes
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => linkCodeMutation.mutate()}
              disabled={linkCodeMutation.isPending}
              className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 px-4 py-3 items-center"
            >
              {linkCodeMutation.isPending ? (
                <ActivityIndicator color="#E2706A" />
              ) : (
                <Text className="text-[#E2706A] font-medium">Generate a link code</Text>
              )}
            </Pressable>
          )}
          {linkCodeMutation.isError && (
            <Text className="text-red-600 text-xs">{(linkCodeMutation.error as Error).message}</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
