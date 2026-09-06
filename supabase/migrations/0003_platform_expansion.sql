-- =============================================================================
-- توسعة المنصّة:
--   • صور الأطفال (Supabase Storage)
--   • ربط الطفل بأكثر من فصل (child_classrooms)
--   • إسناد الأساتذة إلى الفصول (classroom_teachers)
--   • الاشتراكات الشهرية/الفصلية لكل طفل (subscriptions)
--   • استعمال الزمن الأسبوعي (schedule_slots)
--   • سياسات RLS لدور الأستاذ وللجداول الجديدة
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) صورة الطفل
-- ---------------------------------------------------------------------------
alter table public.children
  add column if not exists photo_url text;

-- ---------------------------------------------------------------------------
-- 2) ربط الطفل بعدّة فصول  (many-to-many)
--    children.classroom_id يبقى للتوافق ويمثّل "الفصل الأساسي".
-- ---------------------------------------------------------------------------
create table if not exists public.child_classrooms (
  child_id     uuid not null references public.children (id) on delete cascade,
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (child_id, classroom_id)
);
create index if not exists child_classrooms_classroom_idx
  on public.child_classrooms (classroom_id);

-- نقل البيانات الحالية
insert into public.child_classrooms (child_id, classroom_id, is_primary)
select id, classroom_id, true
from public.children
where classroom_id is not null
on conflict (child_id, classroom_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3) إسناد الأساتذة إلى الفصول
-- ---------------------------------------------------------------------------
create table if not exists public.classroom_teachers (
  teacher_id   uuid not null references public.profiles (id) on delete cascade,
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (teacher_id, classroom_id)
);
create index if not exists classroom_teachers_classroom_idx
  on public.classroom_teachers (classroom_id);

-- ---------------------------------------------------------------------------
-- 4) الاشتراكات
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.subscription_cycle as enum ('monthly', 'termly', 'annual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('active', 'overdue', 'paused', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children (id) on delete cascade,
  plan_name   text not null,
  amount      numeric(10, 2) not null default 0,
  currency    text not null default 'MAD',
  cycle       public.subscription_cycle not null default 'monthly',
  status      public.subscription_status not null default 'active',
  start_date  date not null default current_date,
  end_date    date,
  notes       text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists subscriptions_child_idx on public.subscriptions (child_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5) استعمال الزمن  (weekday: 0 = الاثنين ... 6 = الأحد)
-- ---------------------------------------------------------------------------
create table if not exists public.schedule_slots (
  id           uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),
  starts_at    time not null,
  ends_at      time not null,
  title        text not null,
  teacher_id   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists schedule_slots_classroom_idx
  on public.schedule_slots (classroom_id, weekday);

-- =========================================================================
-- Helpers
-- =========================================================================
create or replace function public.teaches_classroom(p_classroom uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classroom_teachers ct
    where ct.classroom_id = p_classroom and ct.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_guardian_of(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.guardians g
    where g.child_id = p_child and g.parent_id = auth.uid()
  );
$$;

create or replace function public.teaches_child(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.child_classrooms cc
    join public.classroom_teachers ct on ct.classroom_id = cc.classroom_id
    where cc.child_id = p_child and ct.teacher_id = auth.uid()
  );
$$;

-- =========================================================================
-- RLS — الجداول الجديدة
-- =========================================================================
alter table public.child_classrooms  enable row level security;
alter table public.classroom_teachers enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.schedule_slots     enable row level security;

-- child_classrooms
drop policy if exists "child_classrooms admin" on public.child_classrooms;
create policy "child_classrooms admin" on public.child_classrooms for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "child_classrooms teacher read" on public.child_classrooms;
create policy "child_classrooms teacher read" on public.child_classrooms for select
  using (public.teaches_classroom(classroom_id));

drop policy if exists "child_classrooms guardian read" on public.child_classrooms;
create policy "child_classrooms guardian read" on public.child_classrooms for select
  using (public.is_guardian_of(child_id));

-- classroom_teachers
drop policy if exists "classroom_teachers admin" on public.classroom_teachers;
create policy "classroom_teachers admin" on public.classroom_teachers for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "classroom_teachers self read" on public.classroom_teachers;
create policy "classroom_teachers self read" on public.classroom_teachers for select
  using (teacher_id = auth.uid());

-- subscriptions
drop policy if exists "subscriptions admin" on public.subscriptions;
create policy "subscriptions admin" on public.subscriptions for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "subscriptions guardian read" on public.subscriptions;
create policy "subscriptions guardian read" on public.subscriptions for select
  using (public.is_guardian_of(child_id));

-- schedule_slots
drop policy if exists "schedule_slots admin" on public.schedule_slots;
create policy "schedule_slots admin" on public.schedule_slots for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "schedule_slots teacher manage" on public.schedule_slots;
create policy "schedule_slots teacher manage" on public.schedule_slots for all
  using (public.teaches_classroom(classroom_id))
  with check (public.teaches_classroom(classroom_id));

drop policy if exists "schedule_slots authenticated read" on public.schedule_slots;
create policy "schedule_slots authenticated read" on public.schedule_slots for select
  using (auth.role() = 'authenticated');

-- =========================================================================
-- RLS — وصول الأستاذ إلى الجداول القائمة
-- =========================================================================
drop policy if exists "children teacher read" on public.children;
create policy "children teacher read" on public.children for select
  using (public.teaches_child(id));

drop policy if exists "attendance teacher manage" on public.attendance;
create policy "attendance teacher manage" on public.attendance for all
  using (public.teaches_child(child_id))
  with check (public.teaches_child(child_id));

drop policy if exists "guardians teacher read" on public.guardians;
create policy "guardians teacher read" on public.guardians for select
  using (public.teaches_child(child_id));

drop policy if exists "profiles teacher read guardians" on public.profiles;
create policy "profiles teacher read guardians" on public.profiles for select
  using (
    exists (
      select 1 from public.guardians g
      where g.parent_id = profiles.id and public.teaches_child(g.child_id)
    )
  );

-- =========================================================================
-- Storage — دلو صور الأطفال
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('child-photos', 'child-photos', true)
on conflict (id) do nothing;

drop policy if exists "child-photos admin manage" on storage.objects;
create policy "child-photos admin manage" on storage.objects for all to authenticated
  using (bucket_id = 'child-photos' and public.current_user_role() = 'admin')
  with check (bucket_id = 'child-photos' and public.current_user_role() = 'admin');
