# Project brief — منصة تسيير روضة الأطفال

Read this file, never re-explore the repo to rediscover it. It is the shared,
compact map every agent in this project starts from. Keep it under ~150 lines:
when something here goes stale, fix the line, don't append a new section.

## Stack

- Next.js 15 App Router (Server Components + Server Actions), TypeScript
- Tailwind CSS 3 with CSS-variable theming
- Supabase: Postgres + Auth + Row Level Security + Storage, via `@supabase/ssr`
- Arabic-first, `dir="rtl"`, Cairo font. UI copy is Arabic; code and comments English.

## Roles

`admin` (everything) · `teacher` (only assigned classrooms) · `parent` (only own children).
No self-service signup — the admin creates parent and teacher accounts server-side
with the service-role key. RLS is the real enforcement; route guards are convenience.

## Map (only what you need to find things)

```
src/middleware.ts                 session refresh + guards /admin /teacher /parent
src/lib/supabase/{client,server,middleware}.ts   server.ts also exports createAdminClient
src/lib/auth.ts                   getProfile, requireRole, assertAdmin, assertStaff,
                                  getTeacherClassroomIds, homePathForRole
src/lib/storage.ts                uploadChildPhoto -> child-photos bucket
src/lib/forms.ts                  FormState type for useActionState
src/types/database.types.ts       generated Supabase types
src/components/ui/                button card field modal avatar status-badge
src/components/nav/               app-shell.tsx (shell) sidebar-nav.tsx
src/app/admin/<area>/             page.tsx + actions.ts + *-dialog.tsx per area
src/app/teacher/                  page children attendance schedule
src/app/parent/                   page children attendance schedule subscription announcements
supabase/migrations/000N_*.sql    numbered, applied in order
supabase/seed-test-users.mjs      run BEFORE seed-run.mjs
supabase/seed-run.mjs             Arabic sample data via the API, safe to re-run
```

## Conventions — follow these, do not invent new ones

- One area = one folder under `src/app/<role>/<area>/` holding `page.tsx`
  (Server Component, does the query), `actions.ts` (`"use server"` mutations),
  and dialog/form Client Components.
- Every server action starts with an auth assertion (`assertAdmin`, `assertStaff`)
  and returns `FormState`. Never trust the client for role or ownership.
- Forms use `useActionState` + the `FormState` shape in `src/lib/forms.ts`.
- After a mutation call `revalidatePath` for the affected route.
- Styling uses Tailwind **logical** properties (`ms-`, `me-`, `border-e`,
  `text-start`) so RTL mirrors correctly. Email/password inputs stay `dir="ltr"`.
- New tables need: the migration, RLS policies for all three roles, and
  regenerated `src/types/database.types.ts`.
- A new enum value must be added in its **own** migration — Postgres refuses to
  use it in the transaction that created it.

## Commands

```
npm run dev          dev server
npm run build        production build   <- the real gate
npm run lint         eslint
npm run type-check   tsc --noEmit
```

## Environment

`.env.local` holds `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server only, never import into a Client Component),
`NEXT_PUBLIC_SITE_URL`. Never print these values into chat, logs, or commits.

## Mobile direction (decided)

PWA first, then wrap it as an Android APK. The app keeps its Next.js server —
Server Actions and cookie auth rule out a static export — so the APK is a shell
around the deployed PWA, not an offline rewrite. Order: PWA foundation →
installability and mobile UX → Capacitor Android shell → signed APK.

## Working agreement for agents

- Change only what your brief names. Leave unrelated files alone.
- Prefer editing an existing pattern over introducing a new abstraction.
- Do not add a dependency unless the brief says to.
- Commit after every reviewed, passing item (standing user instruction, one
  commit per item, message ends with the Co-Authored-By line). Agents do not
  commit — the orchestrator does after review passes. Never push or run
  destructive git commands unless asked.
- Finish by reporting: files touched, decisions, follow-ups. Nothing else.
