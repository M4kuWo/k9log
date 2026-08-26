import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getLogsSince, type LogKind, type TimelineEntry } from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { LogIcon } from '../components/LogIcon';
import { entryTitle } from '../utils/entryTitle';
import { formatRelative } from '../utils/format';

const EPOCH = new Date(0).toISOString();

export function CategoryDetailScreen({
  dogId,
  kind,
  onSelectEntry,
}: {
  dogId: string;
  kind: LogKind;
  onSelectEntry: (entry: TimelineEntry) => void;
}) {
  // Shares the 'timeline' cache key with the dashboard so this doesn't
  // trigger a second network fetch — just reads the same full-history data
  // and filters it down to this one category.
  const logsQuery = useQuery({
    queryKey: ['timeline', dogId],
    queryFn: () => getLogsSince(supabase, dogId, EPOCH),
  });

  const entries = (logsQuery.data ?? [])
    .filter((e) => e.kind === kind)
    .sort((a, b) => new Date(b.log.occurred_at).getTime() - new Date(a.log.occurred_at).getTime());

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <FlatList
        data={entries}
        keyExtractor={(item) => item.log.id}
        contentContainerClassName="px-4 gap-2 py-4"
        ListEmptyComponent={
          <Text className="text-stone-400 text-center mt-12">No entries yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm flex-row items-center gap-3"
            onPress={() => onSelectEntry(item)}
          >
            <LogIcon kind={item.kind} />
            <View className="flex-1">
              <Text className="text-base font-medium text-stone-900">{entryTitle(item)}</Text>
              <Text className="text-stone-400 text-sm mt-0.5">
                {formatRelative(item.log.occurred_at)}
                {item.log.notes ? ` · ${item.log.notes}` : ''}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
