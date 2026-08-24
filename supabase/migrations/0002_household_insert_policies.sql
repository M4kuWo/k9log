-- 0001_init.sql only granted SELECT on households/household_members, so
-- creating a household (HouseholdSetupScreen -> createHousehold) was
-- rejected by RLS with 42501 on every attempt.

create policy "authenticated users can create households"
  on households for insert
  to authenticated
  with check (true);

create policy "users can add themselves as a household member"
  on household_members for insert
  with check (user_id = auth.uid());
