import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemePreference, type ThemePreference } from '../theme/ThemeProvider';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'Match device', icon: 'phone-portrait-outline' },
];

export function SettingsScreen() {
  const { preference, setPreference } = useThemePreference();

  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-900">
      <View className="px-6 py-4 gap-2">
        <Text className="text-stone-500 dark:text-stone-400 text-sm">Appearance</Text>
        <View className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          {THEME_OPTIONS.map((option, i) => {
            const selected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setPreference(option.value)}
                className={
                  i > 0
                    ? 'flex-row items-center gap-3 px-4 py-3 border-t border-stone-100 dark:border-stone-700'
                    : 'flex-row items-center gap-3 px-4 py-3'
                }
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selected ? '#E2706A' : '#a8a29e'}
                />
                <Text
                  className={
                    selected
                      ? 'flex-1 text-[#E2706A] font-medium'
                      : 'flex-1 text-stone-900 dark:text-stone-100'
                  }
                >
                  {option.label}
                </Text>
                {selected && <Ionicons name="checkmark" size={20} color="#E2706A" />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
