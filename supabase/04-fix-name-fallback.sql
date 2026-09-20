-- Better display-name fallback for invited members (2026-09-19).
-- Safe to re-run; replaces the function the trigger already calls.
--
-- Dashboard invites carry no name, so the trigger falls back to the email's
-- local part. That produced "chris", "kelly" and "k_yager" as display names on
-- the first three real accounts. The proper fix is the member import supplying
-- first_name and last_name as user metadata — this only has to be decent for
-- accounts created by hand.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback text;
begin
  -- "k_yager" -> "K Yager", "chris" -> "Chris". Separators become spaces and
  -- each word is capitalised; initcap alone would leave the underscore in.
  fallback := initcap(regexp_replace(split_part(new.email, '@', 1), '[._-]+', ' ', 'g'));

  insert into members (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), fallback),
    nullif(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (id) do nothing;

  insert into member_private (member_id) values (new.id) on conflict do nothing;
  insert into member_preferences (member_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

-- Tidy up the three accounts already created with the old fallback.
update members
set first_name = initcap(regexp_replace(split_part(email, '@', 1), '[._-]+', ' ', 'g'))
where first_name = split_part(email, '@', 1);

select email, first_name from members order by email;
