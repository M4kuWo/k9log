import { View, Pressable, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getMyHouseholds, listDogs, type Household } from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { useColorScheme } from '../theme/ThemeProvider';
import { SignInScreen } from '../screens/SignInScreen';
import { HouseholdSetupScreen } from '../screens/HouseholdSetupScreen';
import { DogSetupScreen } from '../screens/DogSetupScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { AddLogScreen } from '../screens/AddLogScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { AvatarPickerScreen } from '../screens/AvatarPickerScreen';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HouseholdScreen } from '../screens/HouseholdScreen';
import { UserAvatar } from '../components/UserAvatar';
import type { MainStackParamList } from './types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<MainStackParamList>();

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-stone-50 dark:bg-stone-900">
      <ActivityIndicator color="#E2706A" />
    </View>
  );
}

function HeaderDataButton({
  navigation,
}: {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Timeline'>;
}) {
  return (
    <Pressable onPress={() => navigation.navigate('Reports')} hitSlop={8}>
      <Ionicons name="stats-chart-outline" size={22} color="#E2706A" />
    </Pressable>
  );
}

function HeaderUserButton({
  navigation,
}: {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Timeline'>;
}) {
  const { session } = useAuth();
  return (
    <Pressable onPress={() => navigation.navigate('Household')} hitSlop={8}>
      <UserAvatar email={session?.user.email ?? '?'} size={28} />
    </Pressable>
  );
}

function HouseholdGate({ household }: { household: Household }) {
  const householdId = household.id;
  const dogsQuery = useQuery({
    queryKey: ['dogs', householdId],
    queryFn: () => listDogs(supabase, householdId),
  });
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (dogsQuery.isLoading) return <LoadingScreen />;
  if (!dogsQuery.data || dogsQuery.data.length === 0) {
    return <DogSetupScreen householdId={householdId} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: '#E2706A',
          headerStyle: { backgroundColor: isDark ? '#1c1917' : '#FAFAF9' },
          headerTitleStyle: { color: isDark ? '#FAFAF9' : '#1c1917' },
          contentStyle: { backgroundColor: isDark ? '#1c1917' : '#FAFAF9' },
        }}
      >
        <Stack.Screen
          name="Timeline"
          component={TimelineScreen}
          initialParams={{ householdId }}
          options={({ navigation }) => ({
            title: 'K9log',
            headerLeft: () => (
              <View className="flex-row items-center gap-4">
                <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={8}>
                  <Ionicons name="settings-outline" size={22} color="#E2706A" />
                </Pressable>
                <HeaderDataButton navigation={navigation} />
              </View>
            ),
            headerRight: () => <HeaderUserButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="AddLog"
          component={AddLogScreen}
          options={({ route }) => ({ title: route.params.log ? 'Edit entry' : 'New entry' })}
        />
        <Stack.Screen name="AddDog" options={{ title: 'Add a dog' }}>
          {({ navigation }) => (
            <DogSetupScreen householdId={householdId} onSuccess={() => navigation.goBack()} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Reports" options={{ title: 'Data' }}>
          {() => <ReportsScreen householdId={householdId} />}
        </Stack.Screen>
        <Stack.Screen name="AvatarPicker" options={{ title: 'Choose avatar' }}>
          {({ route, navigation }) => (
            <AvatarPickerScreen
              {...route.params}
              householdId={householdId}
              onDone={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="CategoryDetail"
          options={({ route }) => ({ title: route.params.title })}
        >
          {({ route, navigation }) => (
            <CategoryDetailScreen
              dogId={route.params.dogId}
              kind={route.params.kind}
              onSelectEntry={(entry) =>
                navigation.navigate('AddLog', {
                  dogId: entry.log.dog_id,
                  kind: entry.kind,
                  log: entry.log,
                })
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Household" options={{ title: 'Household' }}>
          {() => <HouseholdScreen household={household} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AuthenticatedGate() {
  const householdsQuery = useQuery({
    queryKey: ['households'],
    queryFn: () => getMyHouseholds(supabase),
  });

  if (householdsQuery.isLoading) return <LoadingScreen />;
  if (!householdsQuery.data || householdsQuery.data.length === 0) {
    return <HouseholdSetupScreen />;
  }

  // v1: one household per user (see ARCHITECTURE.md §5).
  return <HouseholdGate household={householdsQuery.data[0]} />;
}

export function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!session) return <SignInScreen />;
  return <AuthenticatedGate />;
}
