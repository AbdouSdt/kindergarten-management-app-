# BACKLOG — منصة تسيير روضة الأطفال

Ordered. The loop takes the topmost unchecked item whose dependencies are met.
One item = one agent = one review. If an item needs two different agents, split
it before running it.

Format: `- [ ] **id** — title · _agent_ · deps: id, id`

---

## P0 — finish the platform

- [x] **P0-1** — Classrooms CRUD: `/admin/classrooms` is still a
  `PlaceholderPage`. Build create / edit / delete with name, capacity, and the
  count of enrolled children; block deleting a classroom that still has children
  or an assigned teacher. Pattern: `src/app/admin/staff/`. · _feature-agent_

- [x] **P0-2** — Empty and error states across all areas: every table and list
  needs an Arabic empty state and a visible error state instead of a blank
  panel. Also confirm every `useActionState` form surfaces its error.
  · _ui-agent_ · deps: P0-1

- [x] **P0-3** — Delete and edit coverage audit: list every entity (child,
  parent, teacher, classroom, subscription, announcement, schedule slot) and
  check each has working edit + delete with a confirmation. Report the gaps as
  new backlog items rather than fixing them all in one pass. · _review-agent_
  → done 2026-09-08; gaps filed as P0-7..P0-11 below.

- [x] **P0-7** — Parent edit + delete: admin can create a parent but cannot
  correct name/phone/email, reset the password, or delete a departed family's
  account (which keeps RLS access to child data). Add `updateParent` /
  `deleteParent` in `src/app/admin/parents/actions.ts` (delete via
  `admin.auth.admin.deleteUser`), an edit dialog, and a confirmed delete
  button. Pattern: `src/app/admin/classrooms/`. · _feature-agent_ · deps: P0-3

- [x] **P0-8** — Teacher edit + delete: no way to fix a teacher's profile or
  deactivate one who left — `classroom_teachers` rows and teacher-role access
  stay live. Add `updateTeacher` / `deleteTeacher` in
  `src/app/admin/staff/actions.ts` with an edit dialog and confirmed delete.
  · _feature-agent_ · deps: P0-3

- [x] **P0-9** — Child delete: a child who leaves can only be edited, never
  removed. Add `deleteChild` in `src/app/admin/children/actions.ts` —
  `assertAdmin` first, `FormState` return, Arabic guard for dependents
  (`guardians`, `child_classrooms`, `subscriptions`, attendance) instead of a
  raw FK error — plus a `window.confirm` delete button on the page.
  · _feature-agent_ · deps: P0-3

- [x] **P0-10** — Announcement edit: fixing a typo currently means delete +
  recreate, resetting `published_at` and feed order. Add `updateAnnouncement`
  in `src/app/admin/announcements/actions.ts` and an edit mode in
  `announcement-form.tsx`. · _feature-agent_ · deps: P0-3

- [x] **P0-11** — Child edit polish: `EditChildDialog` / `updateChild` can
  replace a photo but cannot clear `photo_url`; add a "remove photo" field and
  the matching action branch. · _ui-agent_ · deps: P0-9 ✓

- [x] **P0-12** — Reliable password-reset handoff: `parent-dialog.tsx` (and the
  same pattern in `add-parent-dialog.tsx` / `edit-teacher-dialog.tsx`) reads the
  generated password from an uncontrolled input inside a post-`state.ok` effect;
  React 19 may reset the form before the effect runs, so the admin can reset a
  password and never see it. Return the new password in the action's `FormState`
  result instead of reading it back from the DOM. · _feature-agent_ · deps: P0-7

- [x] **P0-13** — Orphaned child photos: `src/lib/storage.ts` exposes only
  `uploadChildPhoto`, so `deleteChild` and photo-replace leave the old file in
  the `child-photos` bucket forever. Add a `deleteChildPhoto` helper and call it
  from `deleteChild` (best-effort) and from the `updateChild` photo-replace
  branch. · _feature-agent_ · deps: P0-9

- [x] **P0-4** — Attendance history for admin: a date-range view per classroom
  with per-child totals, so the admin can answer "how often was this child
  absent". Pattern: `src/app/admin/attendance/`. · _feature-agent_

- [x] **P0-5** — Classroom delete: add a third Arabic guard for
  `schedule_slots` rows (currently fails on the raw FK), and confirm
  `/admin/classrooms` is linked in `src/components/nav/sidebar-nav.tsx`.
  · _feature-agent_ · deps: P0-1

- [x] **P0-6** — Dashboard + secondary-query error surfacing: `admin/page` and
  `teacher/page` stat tiles show `0` on a failed count query with no error
  hint; several list pages still swallow secondary lookup errors
  (classroom-name / guardian / email maps). Surface these, and normalise the
  four pages still using an inline `<p>`/`<td>` zero-rows state to `EmptyState`
  (children, subscriptions, parent/children, parent/page). · _ui-agent_ ·
  deps: P0-2

- [x] **P0-14** — Teacher dashboard derived tile: when the `child_classrooms`
  query fails, `src/app/teacher/page.tsx`'s "الحاضرون اليوم" tile silently shows
  `0` (attendance query is skipped because `childIds` is empty). Propagate the
  enrollments error to that tile's hint too. · _ui-agent_ · deps: P0-6

- [x] **P0-15** — Currency is wrong: subscription/payment amounts display
  **MAD** (Moroccan dirham) but must display **DZD** (Algerian dinar) — found
  live in production by the user. · _feature-agent_

- [x] **P0-16** — Vestigial currency field: the `subscriptions.currency` DB
  column and the admin dialog's free-text currency input are no longer read by
  any display path (P0-15 hardcoded «د.ج» everywhere) — keep the column (no
  migration, app is single-currency, not worth the churn) but remove the
  free-text input from `subscription-dialog.tsx`; `createSubscription` /
  `updateSubscription` in `src/app/admin/subscriptions/actions.ts` should write
  `currency: 'DZD'` server-side instead of trusting a client field.
  · _feature-agent_ · deps: P0-15

## P1 — PWA

- [x] **P1-1** — PWA foundation: `src/app/manifest.ts`, maskable icons
  (192/512), theme + background colour from `globals.css`, `display: standalone`,
  `lang: ar`, `dir: rtl`. · _mobile-agent_

- [x] **P1-2** — Service worker: app shell + fonts + static assets cached,
  navigations network-first with an Arabic offline fallback page. No caching of
  Supabase responses or anything carrying auth. · _mobile-agent_ · deps: P1-1

- [x] **P1-3** — Install prompt: capture `beforeinstallprompt`, show an Arabic
  «ثبّت التطبيق» button in the shell, hide it once installed.
  · _feature-agent_ · deps: P1-1

- [x] **P1-5** — Reference the manifest + `apple-touch-icon` + `<meta
  name="theme-color">` from the root layout; replace the four placeholder icon
  PNGs in `public/icons/` with real branded artwork (full-bleed 512 maskable,
  optional monochrome). · _mobile-agent_ · deps: P1-1

- [x] **P1-6** — Install-prompt polish: wrap `installEvent.prompt()` in the
  click handler of `src/components/pwa/install-prompt-button.tsx` in try/catch so
  a rejected prompt still clears the stale button; decide whether the
  «ثبّت التطبيق» button also needs a desktop/sidebar mount (currently `md:hidden`
  only). · _feature-agent_ · deps: P1-3

- [x] **P1-4** — Mobile pass over every screen: tables to cards on narrow
  widths, 44px touch targets, bottom-sheet modals, safe-area insets, no
  horizontal overflow. · _ui-agent_ · deps: P0-2
  → shared mechanism done 2026-09-08: safe-area shell + overflow guard,
  bottom-sheet `Modal`, 44px `Button`/`Field`/nav, new `ResponsiveTable`, and
  `/admin/staff` as the reference conversion. Per-page work filed as P1-7, P1-8.

- [x] **P1-7** — Table→card sweep: apply the `ResponsiveTable` pattern from
  `src/app/admin/staff/page.tsx` to the remaining list pages — `admin/children`,
  `admin/parents`, `admin/classrooms`, `admin/subscriptions`,
  `admin/attendance/history`, `teacher/children`. Presentation only, keep each
  Server Component query. · _ui-agent_ · deps: P1-4

- [x] **P1-8** — Schedule + attendance grid mobile: the wide grid views need a
  scroll affordance or stacking on narrow widths —
  `admin/schedule/schedule-editor.tsx`, `teacher/schedule`, `parent/schedule`,
  `admin/attendance`, `teacher/attendance`, `parent/attendance`. · _ui-agent_ ·
  deps: P1-4

## P2 — Android APK

- [x] **P2-1** — Deploy the app and record the production URL in an env var.
  Needs the user: hosting choice and the deployed URL. Hosting = **Vercel**.
  Production URL: `https://kindergarten-management-app.vercel.app/` — confirmed
  live by the user 2026-09-17. · _mobile-agent_ · deps: P1-2

- [x] **P2-2** — Capacitor Android shell: `capacitor.config.ts` pointing at the
  deployed URL over https, `npx cap add android`, `@capacitor/app` for the
  hardware back button, Arabic app label, adaptive icon and splash, `.gitignore`
  entries for the Gradle build output. · _mobile-agent_ · deps: P2-1
  → done 2026-09-18; appId `dz.creche.app`, server URL overridable via
  `CAPACITOR_SERVER_URL` at `cap sync` time.

- [ ] **P2-3** — Debug APK: `./gradlew assembleDebug`, install on a device,
  walk the three roles end to end. Also verify the splash
  `windowSplashScreenBackground` style and adaptive icon render, and rename the
  template test packages `com.getcapacitor.myapp` → `dz.creche.app`.
  · _mobile-agent_ · deps: P2-2
  → agent side done 2026-09-18 (APK builds/installs, packages renamed, splash +
  icon verified); only the user's on-device three-role walkthrough remains.

- [x] **P2-5** — Parent home «أطفالي» fails to load: found on device during the P2-3
  walkthrough — `/parent` shows the error state «تعذّر تحميل قائمة الأطفال» while
  announcements load fine, so the children query itself errors (not an empty
  list). Find the root cause (app query vs RLS on children/guardians) and fix it;
  say whether it also reproduces on the web. · _feature-agent_ (hand to
  _db-agent_ if the cause is RLS/schema) · blocks P2-3 tick
  → done 2026-09-18; cause was PGRST201 (ambiguous children↔classrooms embed
  after migration 0003), fixed with `classrooms!children_classroom_id_fkey(name)`.

- [x] **P2-6** — Same ambiguous embed on the admin side: `src/app/admin/parents/page.tsx:28`
  uses `children` → `classrooms(name)` and fails with PGRST201 like P2-5 did.
  Use `classrooms!children_classroom_id_fkey(name)`; verify the admin parents page
  lists each parent's children. · _feature-agent_ · deps: P2-5
  → done 2026-09-18; live check as admin: old select PGRST201, new returns rows.

- [ ] **P2-4** — Release APK: `docs/android-release.md` with the keystore and
  signing steps for the user to run. Never handle the keystore password here.
  Also set `android:allowBackup="false"` in `AndroidManifest.xml` (WebView holds
  cookie auth) and fix the `.gitignore` comment that already points at this doc.
  · _mobile-agent_ · deps: P2-3

## P3 — later

- [ ] **P3-1** — Push notifications for announcements (Capacitor + FCM).
  · _mobile-agent_ · deps: P2-3
- [ ] **P3-2** — Attendance and revenue export to PDF/Excel. · _feature-agent_
- [ ] **P3-3** — Multi-kindergarten tenancy, if the platform is ever sold to a
  second crèche. Big schema change — do not start casually. · _db-agent_

---

## Done

_(the loop moves items here with their date)_
