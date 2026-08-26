import type { SupabaseClient } from '../supabaseClient';
import {
  HouseholdSchema,
  HouseholdMemberSchema,
  ProfileSchema,
  type Household,
  type HouseholdMemberWithProfile,
} from '../types';

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

// Joins an *existing* household by id — the invite "code" is just the
// household's own uuid (practically unguessable, no separate invites table
// needed for a household this size). Relies on 0002's insert policy, which
// already allows self-insertion into any household_id.
export async function joinHousehold(
  client: SupabaseClient,
  householdId: string,
  userId: string
): Promise<void> {
  // Plain insert, not upsert: `household_members` has no UPDATE policy, and
  // Postgres's RLS check for INSERT ... ON CONFLICT DO UPDATE (what upsert()
  // compiles to) requires one to exist even when no conflict actually
  // occurs — it fails with "new row violates row-level security policy"
  // rather than falling back to a plain insert. A real conflict here (user
  // already a member) should surface as a clear duplicate-key error anyway,
  // not silently overwrite their existing role.
  const { error } = await client.from('household_members').insert({
    household_id: householdId,
    user_id: userId,
    role: 'member',
    joined_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// profiles has no direct FK to household_members for PostgREST to embed, so
// this is a two-step fetch + client-side merge rather than a single join.
export async function getHouseholdMembers(
  client: SupabaseClient,
  householdId: string
): Promise<HouseholdMemberWithProfile[]> {
  const { data: members, error } = await client
    .from('household_members')
    .select('*')
    .eq('household_id', householdId);
  if (error) throw error;

  const userIds = members.map((m) => m.user_id);
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('*')
    .in('id', userIds);
  if (profilesError) throw profilesError;

  const profileById = new Map(profiles.map((p) => [p.id, ProfileSchema.parse(p)]));
  return members.map((row) => {
    const member = HouseholdMemberSchema.parse(row);
    const profile = profileById.get(member.user_id);
    if (!profile) throw new Error(`Missing profile for household member ${member.user_id}`);
    return { ...member, profile };
  });
}
