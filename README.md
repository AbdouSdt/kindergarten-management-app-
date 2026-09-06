# Kindergarten Management App

A role-based kindergarten management app built with **Next.js (App Router)**,
**Tailwind CSS**, and **Supabase** (Postgres + Auth + Row Level Security).

Three roles:

| Role        | Can do                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| **Admin**   | Everything: children (+ photos, multi-classroom), parents, staff, classrooms, attendance, weekly schedule, subscriptions, announcements |
| **Teacher** | Only their assigned classrooms: view children, record attendance, view the weekly schedule               |
| **Parent**  | Their own children only: profile, attendance history, weekly schedule, subscription status, announcements |

Accounts are **created by an admin** (parents and teachers via the dashboard). There is no self-service signup.

### Features

- Children: profile, **photo** (Supabase Storage), **enrolment in multiple classrooms**, allergy notes, guardian links
- Attendance: daily per-classroom checklist (present / absent / late / excused), history for parents & teachers
- **Weekly schedule** ("استعمال الزمن"): per-classroom timetable, editable by admin, read-only for parents & teachers
- **Subscriptions**: per-child monthly / termly / annual plans with status, plus an estimated monthly-revenue tile; parents see their child's status
- Announcements: all / parents / single-classroom audiences
- Staff: admin creates teacher accounts and assigns them to classrooms
- Arabic-first, fully RTL, responsive (sidebar ↔ mobile top bar, bottom-sheet modals)

---

## Tech stack

- [Next.js 15](https://nextjs.org/) – App Router, Server Components, Route Handlers
- [Tailwind CSS 3](https://tailwindcss.com/) – utility-first styling with CSS-variable theming
- [Supabase](https://supabase.com/) – Postgres database, Auth, and Row Level Security
- [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) – cookie-based auth across Server / Client Components and middleware
- TypeScript

---

## Project structure

```
.
├── supabase/
│   ├── config.toml
│   ├── seed.sql                   # Arabic sample data (SQL)
│   ├── seed-run.mjs               # Same data via the Supabase API (no psql)
│   ├── seed-test-users.mjs        # admin + parent + teacher test accounts
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       ├── 0002_add_teacher_role.sql
│       └── 0003_platform_expansion.sql   # photos, multi-classroom, subs, schedule, teacher RLS, storage
│
└── src/
    ├── middleware.ts             # Session refresh + guards /admin /teacher /parent
    ├── app/
    │   ├── layout.tsx            # Root layout (dir="rtl" lang="ar") + Cairo font
    │   ├── page.tsx  globals.css  not-found.tsx
    │   ├── (auth)/login/page.tsx # Login only — no self-signup
    │   ├── auth/sign-out/route.ts
    │   │
    │   ├── admin/                # Admin-only (requireRole in layout)
    │   │   ├── page.tsx          # Dashboard: children / present / absent / classrooms
    │   │   ├── children/         # table + add/edit dialog (photo upload, multi-classroom)
    │   │   ├── parents/          # table + add-parent + manage-children link dialog
    │   │   ├── staff/            # teachers: add + assign classrooms
    │   │   ├── classrooms/
    │   │   ├── attendance/       # daily checklist per classroom
    │   │   ├── schedule/         # weekly timetable editor per classroom
    │   │   ├── subscriptions/    # per-child subscriptions CRUD + revenue
    │   │   └── announcements/
    │   │
    │   ├── teacher/              # Teacher-only, scoped to assigned classrooms
    │   │   ├── page.tsx  children/  attendance/  schedule/
    │   │
    │   └── parent/               # Parent-only, own children
    │       ├── page.tsx  children/  attendance/  schedule/  subscription/  announcements/
    │
    ├── components/
    │   ├── ui/                   # button, card, field, modal, avatar, status-badge
    │   ├── schedule/             # weekly-schedule grid
    │   ├── nav/                  # AppShell + SidebarNav
    │   └── placeholder-page.tsx
    │
    ├── lib/
    │   ├── supabase/{client,server,middleware}.ts   # server.ts also exports createAdminClient
    │   ├── auth.ts               # getProfile, requireRole, assertAdmin, assertStaff,
    │   │                         #   getTeacherClassroomIds, homePathForRole
    │   ├── storage.ts            # uploadChildPhoto (child-photos bucket)
    │   ├── forms.ts              # FormState type for useActionState
    │   └── utils.ts              # cn(), formatDate()
    │
    └── types/database.types.ts
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [database.new](https://database.new) and create a project.
2. In **Project Settings → API**, copy the Project URL and the `anon` and
   `service_role` keys.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable                        | Where to find it                    |
| ------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` key  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Project Settings → API → `service_role` key (server only) |
| `NEXT_PUBLIC_SITE_URL`          | `http://localhost:3000` in dev      |

### 4. Apply the database schema

Run the migrations **in order** — paste each into the Supabase **SQL Editor**
and run it, or use the CLI (`npx supabase link --project-ref <ref>` then
`npx supabase db push`):

1. `supabase/migrations/0001_initial_schema.sql` — core tables, enums, RLS
2. `supabase/migrations/0002_add_teacher_role.sql` — adds the `teacher` role
3. `supabase/migrations/0003_platform_expansion.sql` — child photos, multi-classroom
   enrolment (`child_classrooms`), `classroom_teachers`, `subscriptions`,
   `schedule_slots`, teacher RLS, and the public `child-photos` storage bucket

> `0002` must be its own step — Postgres won't let the new enum value be used in
> the same transaction that adds it.

### 5. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>.

### 6. (Optional) Load Arabic test data

```bash
# 1. Test users — admin + parent + teacher (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
node --env-file=.env.local supabase/seed-test-users.mjs
#   admin@creche.test   / Passw0rd!
#   parent@creche.test  / Passw0rd!
#   teacher@creche.test / Passw0rd!  (assigned to صف الزهور)

# 2. Sample data — classrooms, children (+ multi-classroom), attendance,
#    announcements, subscriptions, weekly schedule, guardian links.
#    Uses the API (no psql needed); safe to re-run.
node --env-file=.env.local supabase/seed-run.mjs
```

Run `seed-test-users.mjs` **before** `seed-run.mjs` so the guardian links attach
to a real parent account and the teacher gets a classroom. `supabase/seed.sql`
is the same data as a plain SQL script for `supabase db reset` / the SQL Editor.

---

## Internationalization / RTL

The app is **Arabic-first and right-to-left**. `src/app/layout.tsx` sets
`<html lang="ar" dir="rtl">` and loads the `Cairo` Google font. Components use
Tailwind's logical properties (`border-e`, `text-start`, …) so layout mirrors
correctly; email / password inputs are pinned to `dir="ltr"`.

---

## Roles & accounts

- **No self-service signup.** The admin creates parent and teacher accounts from
  the dashboard (`/admin/parents` → «إضافة ولي أمر», `/admin/staff` → «إضافة
  أستاذ»). These call `supabase.auth.admin.createUser` server-side with the
  service-role key; the `handle_new_user()` trigger seeds the `profiles` row.
- The **first admin** must be promoted manually after creating the user in the
  Supabase dashboard:

  ```sql
  update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'you@example.com');
  ```

- Teachers are scoped to classrooms via `classroom_teachers`. Assign them in
  `/admin/staff` → «إدارة الفصول».
- Route protection is layered:
  - `src/middleware.ts` – bounces unauthenticated users to `/login?redirectTo=…`
    for any `/admin`, `/teacher` or `/parent` path.
  - `src/app/{admin,teacher,parent}/layout.tsx` – call `requireRole()`; a user
    hitting the wrong area is redirected to their own home
    (`homePathForRole` in `src/lib/auth.ts`).
  - **Row Level Security** is the real enforcement: parents see only rows for
    children they guard (`guardians`); teachers see only children/attendance in
    their assigned classrooms (`classroom_teachers` + `child_classrooms`).

---

## Scripts

| Command             | Description                        |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Production build                  |
| `npm run start`     | Serve the production build        |
| `npm run lint`      | ESLint (`next lint`)              |
| `npm run type-check`| `tsc --noEmit`                    |

---

## Regenerating database types

After changing the schema:

```bash
npx supabase gen types typescript --project-id <your-project-ref> --schema public > src/types/database.types.ts
```
