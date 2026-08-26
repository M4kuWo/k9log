-- Household sharing needs a way for members to see *who else* is in their
-- household. auth.users isn't exposed to the client, so mirror the bit we
-- need (email) into a public table, kept in sync via trigger on signup.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "users can read their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "household members can read each other's profiles"
  on profiles for select
  using (
    exists (
      select 1
      from household_members mine
      join household_members theirs on theirs.household_id = mine.household_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill for accounts created before this migration.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
