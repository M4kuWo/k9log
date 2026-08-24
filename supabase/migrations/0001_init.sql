-- K9log initial schema: households, dogs, and one table per log type.
-- See ARCHITECTURE.md §2 (data model) and §5 (multi-tenancy) for the reasoning.

create extension if not exists pgcrypto;

-- ── Households & membership ─────────────────────────────────────────────

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  primary key (household_id, user_id)
);

-- Helper used by every RLS policy below: is the current user a member of
-- this household? `security definer` lets it read household_members even
-- though the caller's own row-level policy on that table hasn't been
-- evaluated yet.
create function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

alter table households enable row level security;
alter table household_members enable row level security;

create policy "members can read their households"
  on households for select
  using (is_household_member(id));

create policy "members can read their membership rows"
  on household_members for select
  using (is_household_member(household_id));

-- ── Dogs ─────────────────────────────────────────────────────────────────

create table dogs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  breed text,
  sex text check (sex in ('male', 'female', 'unknown')),
  birthdate date,
  weight numeric,
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table dogs enable row level security;

create policy "members can manage their dogs"
  on dogs for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

-- ── Log tables ───────────────────────────────────────────────────────────
-- Every log table shares: id, dog_id, logged_by_user_id, occurred_at,
-- created_at, notes, deleted_at (soft delete — see ARCHITECTURE.md §9 on
-- offline sync conflicts). RLS is enforced by joining dog_id -> household_id
-- rather than duplicating household_id onto every log row.

create function is_dogs_household_member(target_dog_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select is_household_member(household_id)
  from dogs
  where id = target_dog_id;
$$;

create table food_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  logged_by_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  notes text,
  deleted_at timestamptz,
  food_name text not null,
  food_type text check (food_type in ('dry', 'wet', 'raw', 'other')),
  amount numeric,
  unit text check (unit in ('g', 'cups', 'oz'))
);

create table walk_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  logged_by_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  notes text,
  deleted_at timestamptz,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_seconds integer,
  distance_meters numeric,
  route jsonb,
  source text not null check (source in ('timer', 'manual'))
);

create table treat_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  logged_by_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  notes text,
  deleted_at timestamptz,
  treat_name text not null,
  quantity numeric
);

create table vomit_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  logged_by_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  notes text,
  deleted_at timestamptz,
  consistency text check (consistency in ('liquid', 'chunky', 'foamy', 'bile', 'other')),
  color text,
  texture text,
  suspected_cause text,
  photo_url text
);

create table medication_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  logged_by_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  notes text,
  deleted_at timestamptz,
  medication_name text not null,
  dose text,
  unit text,
  is_recurring boolean not null default false,
  recurrence_rule text
);

create table vaccine_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  logged_by_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  notes text,
  deleted_at timestamptz,
  vaccine_name text not null,
  administered_date date not null,
  next_due_date date,
  clinic_name text,
  document_url text
);

create table vet_appointments (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  logged_by_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  notes text,
  deleted_at timestamptz,
  scheduled_date timestamptz not null,
  reason text,
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  clinic_name text,
  summary_notes text,
  cost numeric,
  follow_up_date date
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  type text not null check (type in ('vaccine_due', 'medication_due', 'vet_appointment')),
  due_at timestamptz not null,
  related_log_id uuid,
  status text not null default 'pending' check (status in ('pending', 'sent', 'dismissed')),
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'food_logs', 'walk_logs', 'treat_logs', 'vomit_logs',
    'medication_logs', 'vaccine_logs', 'vet_appointments', 'reminders'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "members can manage their dog logs" on %I for all using (is_dogs_household_member(dog_id)) with check (is_dogs_household_member(dog_id))',
      t
    );
  end loop;
end $$;
