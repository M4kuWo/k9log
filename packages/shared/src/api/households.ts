import type { SupabaseClient } from '../supabaseClient';
import { HouseholdSchema, type Household } from '../types';

export async function createHousehold(
  client: SupabaseClient,
  id: string,
  name: string,
  ownerUserId: string
): Promise<Household> {
  // `id` is client-generated (see ARCHITECTURE.md §9) so this upsert is
  // safe to retry from an offline mutation queue.
  //
  // The household row isn't selectable via RLS until the caller's
  // membership row exists (households' SELECT policy requires
  // membership), and Postgres enforces that SELECT policy against
  // RETURNING rows too — so we can't chain `.select()` off this insert.
  // Create the membership first, then fetch the household separately.
  const { error } = await client.from('households').upsert({ id, name });
  if (error) throw error;

  const { error: memberError } = await client.from('household_members').upsert({
    household_id: id,
    user_id: ownerUserId,
    role: 'owner',
    joined_at: new Date().toISOString(),
  });
  if (memberError) throw memberError;

  const { data: household, error: fetchError } = await client
    .from('households')
    .select()
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  return HouseholdSchema.parse(household);
}

export async function getMyHouseholds(client: SupabaseClient): Promise<Household[]> {
  const { data, error } = await client.from('households').select('*');
  if (error) throw error;
  return data.map((row) => HouseholdSchema.parse(row));
}
