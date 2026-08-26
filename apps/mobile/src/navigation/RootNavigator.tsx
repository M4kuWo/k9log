import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { getMyHouseholds, listDogs } from '@k9log/shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { SignInScreen } from '../screens/SignInScreen';
import { HouseholdSetupScreen } from '../screens/HouseholdSetupScreen';
import { DogSetupScreen } from '../screens/DogSetupScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { AddLogScreen } from '../screens/AddLogScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { AvatarPickerScreen } from '../screens/AvatarPickerScreen';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-stone-50">
      <ActivityIndicator color="#E2706A" />
    </View>
  );
}

function HouseholdGate({ householdId }: { householdId: string }) {
  const dogsQuery = useQuery({
    queryKey: ['dogs', householdId],
    queryFn: () => listDogs(supabase, householdId),
  });

  if (dogsQuery.isLoading) return <LoadingScreen />;
  if (!dogsQuery.data || dogsQuery.data.length === 0) {
    return <DogSetupScreen householdId={householdId} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: '#E2706A',
          headerStyle: { backgroundColor: '#FAFAF9' },
          headerTitleStyle: { color: '#1c1917' },
          contentStyle: { backgroundColor: '#FAFAF9' },
        }}
      >
        <Stack.Screen
          name="Timeline"
          component={TimelineScreen}
          initialParams={{ householdId }}
          options={({ navigation }) => ({
            title: 'K9log',
            headerRight: () => (
              <Pressable onPress={() => navigation.navigate('Reports')} hitSlop={8}>
                <Text className="text-[#E2706A] font-medium">Data</Text>
              </Pressable>
            ),
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
  return <HouseholdGate householdId={householdsQuery.data[0].id} />;
}

export function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!session) return <SignInScreen />;
  return <AuthenticatedGate />;
}
