-- =============================================================================
-- Kindergarten Management App - initial schema
-- =============================================================================
-- Run this in the Supabase SQL editor, or with the Supabase CLI:
--   supabase db push
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'parent');
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');
create type public.announcement_audience as enum ('all', 'parents', 'classroom');

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'parent',
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- classrooms
-- ---------------------------------------------------------------------------
create table public.classrooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  age_group  text,
  capacity   integer not null default 20,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------
create table public.children (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  date_of_birth date not null,
  classroom_id  uuid references public.classrooms (id) on delete set null,
  allergies     text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index children_classroom_id_idx on public.children (classroom_id);

-- ---------------------------------------------------------------------------
-- guardians  (many:many  children <-> parent profiles)
-- ---------------------------------------------------------------------------
create table public.guardians (
  child_id     uuid not null references public.children (id) on delete cascade,
  parent_id    uuid not null references public.profiles (id) on delete cascade,
  relationship text,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (child_id, parent_id)
);
create index guardians_parent_id_idx on public.guardians (parent_id);

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------
create table public.attendance (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children (id) on delete cascade,
  date          date not null default current_date,
  status        public.attendance_status not null default 'present',
  check_in_at   timestamptz,
  check_out_at  timestamptz,
  recorded_by   uuid references public.profiles (id) on delete set null,
  note          text,
  unique (child_id, date)
);
create index attendance_date_idx on public.attendance (date);

-- ---------------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------------
create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  audience      public.announcement_audience not null default 'all',
  classroom_id  uuid references public.classrooms (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null,
  published_at  timestamptz not null default now()
);
create index announcements_published_at_idx on public.announcements (published_at desc);

-- =========================================================================
-- Helpers
-- =========================================================================

-- Current user's role, used inside RLS policies.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Seed a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger children_touch_updated_at
  before update on public.children
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles      enable row level security;
alter table public.classrooms    enable row level security;
alter table public.children      enable row level security;
alter table public.guardians     enable row level security;
alter table public.attendance    enable row level security;
alter table public.announcements enable row level security;

-- ---- profiles ----------------------------------------------------------
create policy "profiles: read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles: admin manages all"
  on public.profiles for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---- classrooms ------------------------------------------------------
create policy "classrooms: authenticated read"
  on public.classrooms for select
  using (auth.role() = 'authenticated');

create policy "classrooms: admin write"
  on public.classrooms for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---- children ------------------------------------------------------
create policy "children: admin full access"
  on public.children for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "children: guardian read"
  on public.children for select
  using (
    exists (
      select 1 from public.guardians g
      where g.child_id = children.id and g.parent_id = auth.uid()
    )
  );

-- ---- guardians ------------------------------------------------------
create policy "guardians: admin full access"
  on public.guardians for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "guardians: parent read own links"
  on public.guardians for select
  using (parent_id = auth.uid());

-- ---- attendance ------------------------------------------------------
create policy "attendance: admin full access"
  on public.attendance for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "attendance: guardian read"
  on public.attendance for select
  using (
    exists (
      select 1 from public.guardians g
      where g.child_id = attendance.child_id and g.parent_id = auth.uid()
    )
  );

-- ---- announcements -------------------------------------------------
create policy "announcements: admin full access"
  on public.announcements for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "announcements: authenticated read"
  on public.announcements for select
  using (auth.role() = 'authenticated');
