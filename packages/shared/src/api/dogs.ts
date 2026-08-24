import type { SupabaseClient } from '../supabaseClient';
import { DogSchema, type Dog } from '../types';

export type NewDog = Pick<Dog, 'id' | 'household_id' | 'name'> &
  Partial<Pick<Dog, 'breed' | 'sex' | 'birthdate' | 'weight' | 'photo_url' | 'notes'>>;

// `id` is client-generated (see ARCHITECTURE.md §9) so this upsert is safe
// to retry from an offline mutation queue.
export async function createDog(client: SupabaseClient, input: NewDog): Promise<Dog> {
  const { data, error } = await client.from('dogs').upsert(input).select().single();
  if (error) throw error;
  return DogSchema.parse(data);
}

export async function listDogs(client: SupabaseClient, householdId: string): Promise<Dog[]> {
  const { data, error } = await client
    .from('dogs')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map((row) => DogSchema.parse(row));
}
