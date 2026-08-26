import { View, Text } from 'react-native';
import type { ChartBucket } from '@k9log/shared';

// Hand-rolled with plain Views rather than a charting dependency — keeps
// this Expo-Go compatible (no native module to rebuild for) and the data
// here is simple enough not to need one.
export function BarChart({ data, unit }: { data: ChartBucket[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.minutes));

  return (
    <View className="gap-1">
      <View className="flex-row items-end gap-1" style={{ height: 96 }}>
        {data.map((bucket, i) => (
          <View key={i} className="flex-1 items-center justify-end" style={{ height: '100%' }}>
            <View
              className="w-full bg-[#E2706A] rounded-t"
              style={{ height: `${Math.max(2, (bucket.minutes / max) * 100)}%`, minHeight: 2 }}
            />
          </View>
        ))}
      </View>
      <View className="flex-row gap-1">
        {data.map((bucket, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-stone-400 text-xs" numberOfLines={1}>
              {bucket.label}
            </Text>
          </View>
        ))}
      </View>
      <Text className="text-stone-400 text-xs text-center mt-1">{unit}</Text>
    </View>
  );
}
