import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Run `supabase gen types typescript --linked > src/database.types.ts` once the
// project is linked, then swap this for `createClient<Database>(...)`.
export function createSupabaseClient(url: string, anonKey: string) {
  return createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
