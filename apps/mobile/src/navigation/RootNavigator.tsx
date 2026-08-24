import { View, ActivityIndicator } from 'react-native';
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
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator />
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
      <Stack.Navigator>
        <Stack.Screen
          name="Timeline"
          component={TimelineScreen}
          initialParams={{ householdId }}
          options={{ title: 'K9log' }}
        />
        <Stack.Screen name="AddLog" component={AddLogScreen} options={{ title: 'New entry' }} />
        <Stack.Screen name="AddDog" options={{ title: 'Add a dog' }}>
          {({ navigation }) => (
            <DogSetupScreen householdId={householdId} onSuccess={() => navigation.goBack()} />
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
