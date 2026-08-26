import type { SupabaseClient } from '../supabaseClient';
import {
  LOG_TABLES,
  FoodLogSchema,
  WalkLogSchema,
  TreatLogSchema,
  VomitLogSchema,
  MedicationLogSchema,
  VaccineLogSchema,
  VetAppointmentSchema,
  type FoodLog,
  type WalkLog,
  type TreatLog,
  type VomitLog,
  type MedicationLog,
  type VaccineLog,
  type VetAppointment,
  type TimelineEntry,
  type LogKind,
} from '../types';

// `id` is required and must be generated on the device (see
// ARCHITECTURE.md §9): it gives an offline-created row a stable identity up
// front, so replaying a queued write later is an idempotent upsert rather
// than a plain insert that could double up on retry.
type NewLog<T> = Omit<T, 'created_at' | 'deleted_at' | 'occurred_at'> & {
  occurred_at?: string;
};

async function insert<T>(
  client: SupabaseClient,
  table: string,
  input: NewLog<T>,
  schema: { parse: (v: unknown) => T }
): Promise<T> {
  const { data, error } = await client.from(table).upsert(input).select().single();
  if (error) throw error;
  return schema.parse(data);
}

export const insertFoodLog = (client: SupabaseClient, input: NewLog<FoodLog>) =>
  insert(client, LOG_TABLES.food, input, FoodLogSchema);

export const insertWalkLog = (client: SupabaseClient, input: NewLog<WalkLog>) =>
  insert(client, LOG_TABLES.walk, input, WalkLogSchema);

export const insertTreatLog = (client: SupabaseClient, input: NewLog<TreatLog>) =>
  insert(client, LOG_TABLES.treat, input, TreatLogSchema);

export const insertVomitLog = (client: SupabaseClient, input: NewLog<VomitLog>) =>
  insert(client, LOG_TABLES.vomit, input, VomitLogSchema);

export const insertMedicationLog = (client: SupabaseClient, input: NewLog<MedicationLog>) =>
  insert(client, LOG_TABLES.medication, input, MedicationLogSchema);

export const insertVaccineLog = (client: SupabaseClient, input: NewLog<VaccineLog>) =>
  insert(client, LOG_TABLES.vaccine, input, VaccineLogSchema);

export const insertVetAppointment = (client: SupabaseClient, input: NewLog<VetAppointment>) =>
  insert(client, LOG_TABLES.vet_appointment, input, VetAppointmentSchema);

// Soft delete (see ARCHITECTURE.md §2's deleted_at column) rather than a
// hard DELETE, so a mistaken removal is still recoverable and offline
// deletes replay the same way other mutations do.
export async function softDeleteLog(
  client: SupabaseClient,
  kind: LogKind,
  id: string
): Promise<void> {
  const { error } = await client
    .from(LOG_TABLES[kind])
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Application-level merge across log tables — see ARCHITECTURE.md §2.
// Fine at household-pet scale; revisit with a UNION ALL view if this ever
// needs to page through years of dense history.
export async function getTimeline(
  client: SupabaseClient,
  dogId: string,
  limit = 50
): Promise<TimelineEntry[]> {
  const queries = [
    { kind: 'food' as const, table: LOG_TABLES.food, schema: FoodLogSchema },
    { kind: 'walk' as const, table: LOG_TABLES.walk, schema: WalkLogSchema },
    { kind: 'treat' as const, table: LOG_TABLES.treat, schema: TreatLogSchema },
    { kind: 'vomit' as const, table: LOG_TABLES.vomit, schema: VomitLogSchema },
    { kind: 'medication' as const, table: LOG_TABLES.medication, schema: MedicationLogSchema },
    { kind: 'vaccine' as const, table: LOG_TABLES.vaccine, schema: VaccineLogSchema },
    {
      kind: 'vet_appointment' as const,
      table: LOG_TABLES.vet_appointment,
      schema: VetAppointmentSchema,
    },
  ];

  const results = await Promise.all(
    queries.map(async ({ kind, table, schema }) => {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('dog_id', dogId)
        .is('deleted_at', null)
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data.map((row) => ({ kind, log: schema.parse(row) }) as TimelineEntry);
    })
  );

  return results
    .flat()
    .sort((a, b) => new Date(b.log.occurred_at).getTime() - new Date(a.log.occurred_at).getTime())
    .slice(0, limit);
}
