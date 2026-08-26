-- Activity log: every write to a log table, dogs, or household_members,
-- captured via trigger so it works no matter which client wrote it (the
-- mobile app, going through RLS as `authenticated`, or the Telegram bot's
-- Edge Function, which uses the service role key and shows up as
-- `service_role` — that's what actor_source below is keyed off of).

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_source text not null check (actor_source in ('app', 'telegram')),
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_type text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;

create policy "members can read their household's activity log"
  on activity_log for select
  using (is_household_member(household_id));

create function log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_actor_user_id uuid;
  v_entity_id uuid;
begin
  if TG_TABLE_NAME = 'household_members' then
    v_household_id := coalesce(new.household_id, old.household_id);
    v_actor_user_id := coalesce(new.user_id, old.user_id);
    v_entity_id := null; -- composite primary key, no single id column
  elsif TG_TABLE_NAME = 'dogs' then
    v_household_id := coalesce(new.household_id, old.household_id);
    v_actor_user_id := auth.uid();
    v_entity_id := coalesce(new.id, old.id);
  else
    -- every log table: food_logs, walk_logs, treat_logs, vomit_logs,
    -- medication_logs, vaccine_logs, vet_appointments, reminders
    select household_id into v_household_id from dogs where id = coalesce(new.dog_id, old.dog_id);
    v_actor_user_id := coalesce(new.logged_by_user_id, old.logged_by_user_id);
    v_entity_id := coalesce(new.id, old.id);
  end if;

  insert into activity_log (household_id, actor_user_id, actor_source, action, entity_type, entity_id, detail)
  values (
    v_household_id,
    v_actor_user_id,
    case when auth.role() = 'service_role' then 'telegram' else 'app' end,
    lower(TG_OP),
    TG_TABLE_NAME,
    v_entity_id,
    to_jsonb(coalesce(new, old))
  );

  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'food_logs', 'walk_logs', 'treat_logs', 'vomit_logs',
    'medication_logs', 'vaccine_logs', 'vet_appointments', 'reminders',
    'dogs', 'household_members'
  ]
  loop
    execute format(
      'create trigger log_activity_trigger after insert or update or delete on %I for each row execute function log_activity()',
      t
    );
  end loop;
end $$;

-- ── Telegram bot linking & session state ────────────────────────────────
-- The bot runs as a Supabase Edge Function (supabase/functions/telegram-
-- webhook) using the service role key, so it bypasses RLS entirely and
-- does its own authorization checks in code. These tables only need
-- policies for what the *app* reads/writes on a user's behalf.

create table telegram_link_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table telegram_link_codes enable row level security;

create policy "users can create their own link code"
  on telegram_link_codes for insert
  with check (user_id = auth.uid());

create policy "users can read their own link code"
  on telegram_link_codes for select
  using (user_id = auth.uid());

create table telegram_links (
  chat_id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  linked_at timestamptz not null default now()
);

alter table telegram_links enable row level security;

create policy "users can read their own telegram link"
  on telegram_links for select
  using (user_id = auth.uid());

create policy "users can remove their own telegram link"
  on telegram_links for delete
  using (user_id = auth.uid());

-- Conversation state between one webhook call and the next (e.g. "waiting
-- for the walk duration"). No app-facing policy — only the bot touches it.
create table telegram_sessions (
  chat_id bigint primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table telegram_sessions enable row level security;
