import { z } from 'zod';

// Mirrors supabase/migrations/0001_init.sql. Keep in sync by hand for now —
// there's no codegen step wiring SQL to zod.

export const HouseholdSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  created_at: z.string(),
});
export type Household = z.infer<typeof HouseholdSchema>;

export const HouseholdMemberSchema = z.object({
  household_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'member']),
  invited_at: z.string(),
  joined_at: z.string().nullable(),
});
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  created_at: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const HouseholdMemberWithProfileSchema = HouseholdMemberSchema.extend({
  profile: ProfileSchema,
});
export type HouseholdMemberWithProfile = z.infer<typeof HouseholdMemberWithProfileSchema>;

export const DogSchema = z.object({
  id: z.string().uuid(),
  household_id: z.string().uuid(),
  name: z.string().min(1),
  breed: z.string().nullable(),
  sex: z.enum(['male', 'female', 'unknown']).nullable(),
  birthdate: z.string().nullable(),
  weight: z.number().nullable(),
  photo_url: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
});
export type Dog = z.infer<typeof DogSchema>;

const logBase = {
  id: z.string().uuid(),
  dog_id: z.string().uuid(),
  logged_by_user_id: z.string().uuid(),
  occurred_at: z.string(),
  created_at: z.string(),
  notes: z.string().nullable(),
  deleted_at: z.string().nullable(),
};

export const FoodLogSchema = z.object({
  ...logBase,
  food_name: z.string().min(1),
  food_type: z.enum(['dry', 'wet', 'raw', 'other']).nullable(),
  amount: z.number().nullable(),
  unit: z.enum(['g', 'cups', 'oz']).nullable(),
});
export type FoodLog = z.infer<typeof FoodLogSchema>;

export const WalkLogSchema = z.object({
  ...logBase,
  start_time: z.string(),
  end_time: z.string().nullable(),
  duration_seconds: z.number().int().nullable(),
  distance_meters: z.number().nullable(),
  route: z.unknown().nullable(),
  source: z.enum(['timer', 'manual']),
});
export type WalkLog = z.infer<typeof WalkLogSchema>;

export const TreatLogSchema = z.object({
  ...logBase,
  treat_name: z.string().min(1),
  quantity: z.number().nullable(),
});
export type TreatLog = z.infer<typeof TreatLogSchema>;

export const VomitLogSchema = z.object({
  ...logBase,
  consistency: z.enum(['liquid', 'chunky', 'foamy', 'bile', 'other']).nullable(),
  color: z.string().nullable(),
  texture: z.string().nullable(),
  suspected_cause: z.string().nullable(),
  photo_url: z.string().nullable(),
});
export type VomitLog = z.infer<typeof VomitLogSchema>;

export const MedicationLogSchema = z.object({
  ...logBase,
  medication_name: z.string().min(1),
  dose: z.string().nullable(),
  unit: z.string().nullable(),
  is_recurring: z.boolean(),
  recurrence_rule: z.string().nullable(),
});
export type MedicationLog = z.infer<typeof MedicationLogSchema>;

export const VaccineLogSchema = z.object({
  ...logBase,
  vaccine_name: z.string().min(1),
  administered_date: z.string(),
  next_due_date: z.string().nullable(),
  clinic_name: z.string().nullable(),
  document_url: z.string().nullable(),
});
export type VaccineLog = z.infer<typeof VaccineLogSchema>;

export const VetAppointmentSchema = z.object({
  ...logBase,
  scheduled_date: z.string(),
  reason: z.string().nullable(),
  status: z.enum(['upcoming', 'completed', 'cancelled']),
  clinic_name: z.string().nullable(),
  summary_notes: z.string().nullable(),
  cost: z.number().nullable(),
  follow_up_date: z.string().nullable(),
});
export type VetAppointment = z.infer<typeof VetAppointmentSchema>;

export const LOG_TABLES = {
  food: 'food_logs',
  walk: 'walk_logs',
  treat: 'treat_logs',
  vomit: 'vomit_logs',
  medication: 'medication_logs',
  vaccine: 'vaccine_logs',
  vet_appointment: 'vet_appointments',
} as const;

export type LogKind = keyof typeof LOG_TABLES;

export type TimelineEntry =
  | { kind: 'food'; log: FoodLog }
  | { kind: 'walk'; log: WalkLog }
  | { kind: 'treat'; log: TreatLog }
  | { kind: 'vomit'; log: VomitLog }
  | { kind: 'medication'; log: MedicationLog }
  | { kind: 'vaccine'; log: VaccineLog }
  | { kind: 'vet_appointment'; log: VetAppointment };
