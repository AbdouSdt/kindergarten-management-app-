# Kindergarten Management App

A role-based kindergarten management app built with **Next.js (App Router)**,
**Tailwind CSS**, and **Supabase** (Postgres + Auth + Row Level Security).

Two roles:

| Role       | Can do                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| **Admin**  | Manage children, parents, classrooms, attendance and announcements           |
| **Parent** | View their own children, attendance history and announcements                |

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
├── next.config.mjs
├── tailwind.config.ts             # Tailwind theme (colors, radius, fonts)
├── postcss.config.mjs
├── .env.example                   # Copy to .env.local and fill in
│
├── supabase/
│   ├── config.toml                # Supabase CLI config (local dev)
│   ├── seed.sql                   # Arabic seed data (classrooms, children, attendance, announcements)
│   ├── seed-test-users.mjs        # Creates admin + parent test users via the Admin API
│   └── migrations/
│       └── 0001_initial_schema.sql  # Tables, enums, triggers, RLS policies
│
└── src/
    ├── middleware.ts             # Refreshes the auth session, guards protected routes
    ├── app/
    │   ├── layout.tsx             # Root layout (dir="rtl" lang="ar") + Cairo font
    │   ├── page.tsx               # Landing page (redirects logged-in users)
    │   ├── globals.css            # Tailwind directives + theme variables
    │   ├── not-found.tsx
    │   │
    │   ├── (auth)/                # Route group – shared auth shell
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   │
    │   ├── auth/
    │   │   ├── callback/route.ts  # OAuth / email confirmation exchange
    │   │   └── sign-out/route.ts  # POST to end the session
    │   │
    │   ├── admin/                 # Admin-only area (role checked in layout.tsx)
    │   │   ├── layout.tsx
    │   │   ├── page.tsx           # Dashboard with live counts
    │   │   ├── children/page.tsx
    │   │   ├── parents/page.tsx
    │   │   ├── classrooms/page.tsx
    │   │   ├── attendance/page.tsx
    │   │   └── announcements/page.tsx
    │   │
    │   └── parent/                # Parent-only area (role checked in layout.tsx)
    │       ├── layout.tsx
    │       ├── page.tsx
    │       ├── children/page.tsx
    │       ├── attendance/page.tsx
    │       └── announcements/page.tsx
    │
    ├── components/
    │   ├── ui/                    # Small presentational primitives (Button, Card)
    │   ├── nav/                   # AppShell + SidebarNav
    │   ├── auth/                  # SignOutButton
    │   └── placeholder-page.tsx
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts          # Browser client (Client Components)
    │   │   ├── server.ts          # Server client + admin (service-role) client
    │   │   └── middleware.ts      # Session refresh + route protection
    │   ├── auth.ts                # getProfile / requireUser / requireRole helpers
    │   └── utils.ts               # cn(), formatDate()
    │
    └── types/
        └── database.types.ts      # DB types (regenerate with `supabase gen types`)
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

Either paste `supabase/migrations/0001_initial_schema.sql` into the
Supabase **SQL Editor**, or use the CLI:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 5. Add the auth redirect URL

In **Authentication → URL Configuration**, add:

```
http://localhost:3000/auth/callback
```

### 6. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>.

### 7. (Optional) Load Arabic test data

```bash
# Seed classrooms / children / attendance / announcements
#   local:  supabase db reset          (re-runs migrations + supabase/seed.sql)
#   hosted: paste supabase/seed.sql into the SQL Editor and Run
#           (or: psql "<connection-string>" -f supabase/seed.sql)

# Create an admin + a parent test user (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
node --env-file=.env.local supabase/seed-test-users.mjs
#   admin@creche.test  / Passw0rd!
#   parent@creche.test / Passw0rd!
```

The guardian-link section of `seed.sql` looks up the first existing `parent`
profile, so run `seed-test-users.mjs` **before** (re-)running the seed if you
want the parent portal to show linked children.

---

## Internationalization / RTL

The app is **Arabic-first and right-to-left**. `src/app/layout.tsx` sets
`<html lang="ar" dir="rtl">` and loads the `Cairo` Google font. Components use
Tailwind's logical properties (`border-e`, `text-start`, …) so layout mirrors
correctly; email / password inputs are pinned to `dir="ltr"`.

---

## Roles

- New sign-ups through `/signup` are always created as **`parent`**
  (the `handle_new_user()` trigger reads `role` from the sign-up metadata and
  defaults to `parent`).
- To make an **admin**, run this in the Supabase SQL editor after the user has
  signed up:

  ```sql
  update public.profiles set role = 'admin' where id = '<auth-user-id>';
  ```

- Route protection is layered:
  - `src/middleware.ts` – bounces unauthenticated users to `/login?redirectTo=…`
    for any `/admin` or `/parent` path, and sends logged-in users away from the
    auth pages.
  - `src/app/admin/layout.tsx` / `src/app/parent/layout.tsx` – call `requireRole()`
    so a parent hitting `/admin` is redirected to `/parent` and vice-versa.
  - **Row Level Security** in Postgres is the real enforcement: parents can only
    read rows for children they are linked to via the `guardians` table.

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
