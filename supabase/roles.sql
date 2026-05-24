-- The Mortals — editor roles
-- Adds a `profiles` table mapping each Supabase auth user → role
-- ('chief' or 'editor'), a trigger that auto-creates a profile on
-- signup, and RLS so editors can only read profiles while chief can
-- read all and update roles.

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'editor' check (role in ('chief', 'editor')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- Trigger: when a new auth user is created, insert a profile row.
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the calling user the chief?
create or replace function public.is_chief() returns boolean
  language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'chief'
  )
$$;

alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "chief reads all profiles" on public.profiles;
create policy "chief reads all profiles" on public.profiles for select
  using (public.is_chief());

drop policy if exists "chief updates profile roles" on public.profiles;
create policy "chief updates profile roles" on public.profiles for update
  using (public.is_chief()) with check (public.is_chief());

drop policy if exists "chief deletes profiles" on public.profiles;
create policy "chief deletes profiles" on public.profiles for delete
  using (public.is_chief());

-- Backfill profiles for any users that already exist
insert into public.profiles (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

-- Seed shingchoyip@gmail.com as the chief
update public.profiles
   set role = 'chief'
 where email = 'shingchoyip@gmail.com';
