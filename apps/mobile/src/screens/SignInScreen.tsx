import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { PasswordInput } from '../components/PasswordInput';

function describeError(message: string): string {
  if (/failed to fetch|network request failed/i.test(message)) {
    return "Can't reach the server — check your internet connection or the Supabase URL/key in .env.";
  }
  return message;
}

export function SignInScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMismatch =
    mode === 'sign-up' && confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit() {
    if (mode === 'sign-up' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const { error: authError } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setIsSubmitting(false);
    if (authError) setError(describeError(authError.message));
  }

  function switchMode() {
    setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
    setConfirmPassword('');
    setError(null);
  }

  const canSubmit =
    !isSubmitting && !!email && !!password && (mode === 'sign-in' || !passwordsMismatch);

  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-900">
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-3xl font-bold text-[#E2706A] mb-2">K9log</Text>
        <Text className="text-stone-500 dark:text-stone-400 mb-4">
          {mode === 'sign-in' ? 'Sign in to your household' : 'Create your account'}
        </Text>

        <TextInput
          className="bg-white dark:bg-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-base shadow-sm"
          placeholder="Email"
          placeholderTextColor="#a8a29e"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PasswordInput placeholder="Password" value={password} onChangeText={setPassword} />
        {mode === 'sign-up' && (
          <>
            <PasswordInput
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {passwordsMismatch && (
              <Text className="text-red-600 text-sm -mt-2">Passwords do not match.</Text>
            )}
          </>
        )}

        {error && <Text className="text-red-600">{error}</Text>}

        <Pressable
          className="bg-[#E2706A] rounded-xl py-3 items-center"
          style={!canSubmit ? { opacity: 0.5 } : undefined}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={switchMode}>
          <Text className="text-stone-500 dark:text-stone-400 text-center">
            {mode === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
            <Text className="text-[#E2706A] font-medium">
              {mode === 'sign-in' ? 'Create one' : 'Sign in'}
            </Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
