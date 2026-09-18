# PROGRESS

Append-only run log. Newest at the bottom. The orchestrator reads only the tail,
so keep each entry to the block below and resist writing essays here.

```
## <date> — <item title>
agent: <which> · status: done | blocked
files: <paths>
notes: <at most three lines>
next: <follow-ups added to the backlog, or —>
```

---

## 2026-09-08 — loop set up

agent: — · status: done
files: .claude/CLAUDE.md, .claude/BACKLOG.md, .claude/PROGRESS.md,
.claude/agents/{db,feature,ui,mobile,review}-agent.md,
.claude/skills/dev-loop/SKILL.md
notes: Orchestration scaffolding only, no application code touched. Mobile path
decided as PWA first, then a Capacitor shell around the deployed app — a static
export is impossible while the app uses Server Actions and cookie auth.
next: run `/dev-loop` to start at P0-1 (classrooms CRUD).

## 2026-09-08 — Classrooms CRUD (P0-1)
agent: feature-agent · status: done
files: src/app/admin/classrooms/{page.tsx,actions.ts,classroom-dialog.tsx}
notes: Copied the admin/subscriptions CRUD shape (one dialog for create+edit +
raw-button delete with confirm), not staff. Enrolled count and delete guard use
child_classrooms, not legacy children.classroom_id. capacity column already
existed. Review passed all gates (type-check/lint/build).
next: P0-5 added — schedule_slots delete guard + verify sidebar link.

## 2026-09-08 — Empty and error states (P0-2)
agent: ui-agent · status: done
files: src/components/ui/empty-state.tsx (new); page.tsx across admin/{staff,
classrooms,children,parents,announcements,subscriptions,attendance,schedule},
teacher/{children,schedule,attendance}, parent/{announcements,attendance,
children,schedule,subscription,page}
notes: One shared EmptyState (tone muted|error, dashed card). Every list page now
branches on primary query .error into an Arabic alert panel. All 14 useActionState
forms already surfaced state.error — confirmed, no change. First P0-2 review
falsely blocked on P0-1 classrooms files; re-reviewed with context, passed.
next: P0-6 added — dashboard stat error surfacing + secondary-query errors +
normalise 4 pages still using inline zero-rows state.

## 2026-09-08 — Delete/edit coverage audit (P0-3)
agent: review-agent · status: done
files: — (audit only, no code)
notes: classroom, subscription, schedule slot are complete. Gaps: parent has no
edit AND no delete (RLS access persists after a family leaves); teacher same;
child has no delete; announcement has no edit. All existing delete actions do
assertAdmin + FormState-shaped return correctly.
next: filed as P0-7 (parent edit/delete), P0-8 (teacher edit/delete), P0-9
(child delete), P0-10 (announcement edit), P0-11 (child photo removal).

## 2026-09-08 — Attendance history for admin (P0-4)
agent: feature-agent · status: done
files: src/app/admin/attendance/history/page.tsx (new),
src/app/admin/attendance/page.tsx (header link)
notes: New /history Server Component route (daily page is a client roll-call
board, not extendable inline). GET form: classroom + from/to. Server-side reduce
to per-child present/absent/late/excused + absence rate; no raw rows to client.
Review passed. Nits: form lacks literal method="get" (defaults to GET anyway);
UTC toISOString for default range, matches sibling page.
next: —

## 2026-09-08 — Classroom delete schedule guard (P0-5)
agent: feature-agent · status: done
files: src/app/admin/classrooms/actions.ts
notes: Third guard blocks classroom delete when schedule_slots rows exist
(Arabic msg). Important: schedule_slots.classroom_id is ON DELETE CASCADE, so
without the guard delete silently destroys schedule slots — guard now prevents
that. Sidebar link already exists via src/app/admin/layout.tsx:9, nav file
untouched. Review passed.
next: —

## 2026-09-08 — Teacher edit + delete (P0-8)
agent: feature-agent · status: done
files: src/app/admin/staff/actions.ts, src/app/admin/staff/edit-teacher-dialog.tsx (new),
src/app/admin/staff/page.tsx
notes: Per-row تعديل dialog (name/phone/email) + حذف with Arabic window.confirm.
Both actions re-derive profiles.role==='teacher' server-side before mutating.
classroom_teachers.teacher_id and profiles.id are both ON DELETE CASCADE, so
deleteUser alone suffices — rows still deleted explicitly first as a safeguard.
Review flagged only a false scope violation from P0-7 running in parallel; P0-8
itself passed every criterion (type-check/lint/build all clean).
next: —

## 2026-09-08 — Parent edit + delete (P0-7)
agent: feature-agent · status: done
files: src/app/admin/parents/actions.ts, src/app/admin/parents/parent-dialog.tsx (new),
src/app/admin/parents/page.tsx
notes: Per-row تعديل dialog (name/phone/email + optional new-password reset folded
into updateParent) and حذف with Arabic window.confirm. Delete BLOCKED with Arabic
message while guardians rows exist (mirrors deleteClassroom); admin unlinks children
first. profiles.id and guardians.parent_id both ON DELETE CASCADE, so
admin.auth.admin.deleteUser alone clears profile + guardian links. Review passed.
next: P0-12 added — password-reset handoff reads from the DOM post-submit and can
be lost under React 19 form reset; return the password in FormState instead.

## 2026-09-08 — Announcement edit (P0-10)
agent: feature-agent · status: done
files: src/app/admin/announcements/actions.ts, announcement-form.tsx, page.tsx
notes: New updateAnnouncement writes only title/body/audience/classroom_id — never
published_at/created_at/author_id — so feed order holds. Same AnnouncementForm
reused in a Modal for edit mode (classrooms pattern). Revalidates the same 4 paths
as createAnnouncement. Review passed; only note is page.tsx also carries the
pre-existing P0-2 EmptyState refactor, not a regression.
next: —

## 2026-09-08 — Child delete (P0-9)
agent: feature-agent · status: done
files: src/app/admin/children/actions.ts, src/app/admin/children/page.tsx,
src/app/admin/children/delete-child-button.tsx (new)
notes: deleteChild — assertAdmin, deleteClassroom-shaped return, head:true count
guards on guardians/child_classrooms/subscriptions/attendance (table name is
`attendance`), one aggregated Arabic blocker message, no raw FK path. Photo
cleanup skipped: storage.ts has no delete helper (brief barred adding one).
Review passed (EmptyState bits in page.tsx are the parallel P0-2 rollout).
next: P0-13 added — add a delete helper to src/lib/storage.ts and purge the
child-photos file on deleteChild / photo replace.

## 2026-09-08 — Child photo removal (P0-11)
agent: ui-agent · status: done
files: src/app/admin/children/child-form-fields.tsx, src/app/admin/children/actions.ts
notes: «إزالة الصورة الحالية» checkbox (name=remove_photo), shown only when
defaults.photo_url exists, live-clears the preview. updateChild branches file-first
(upload always wins) then else-if removePhoto sets photo_url:null — no bucket call,
that stays P0-13. 44px touch target, logical classes. Review passed (the deleteChild
bits in the diff are P0-9, separately signed off).
next: —

## 2026-09-08 — Password-reset handoff (P0-12)
agent: feature-agent · status: done
files: src/lib/forms.ts, src/app/admin/parents/{actions.ts,parent-dialog.tsx,add-parent-dialog.tsx}
notes: FormState success shape gains optional password?: string (purely additive).
createParent always returns {ok,password}; updateParent only when the reset branch
ran. Both dialogs now render the credential from state.password — no post-submit
DOM read. Teacher edit has no password field, staff untouched. Review passed.
next: —

## 2026-09-08 — Orphaned child photos (P0-13)
agent: feature-agent · status: done
files: src/lib/storage.ts, src/app/admin/children/actions.ts
notes: New server-only deleteChildPhoto(photoUrl) + childPhotoPathFromUrl helpers;
path parsed from the public URL, all storage ops in a swallow-all try/catch so a
failed cleanup never fails the DB mutation. Wired into deleteChild and both
updateChild photo branches (replace only removes prev when URL differs). Code review
passed; its build-fail was P0-6's subscriptions/page.tsx caught mid-edit, cleared
once P0-6 landed a green build.
next: —

## 2026-09-08 — Dashboard + secondary-query error surfacing (P0-6)
agent: ui-agent · status: done
files: src/app/admin/page.tsx, src/app/teacher/page.tsx, src/app/admin/children/page.tsx,
src/app/admin/subscriptions/page.tsx, src/app/parent/children/page.tsx, src/app/parent/page.tsx
notes: Failed count query → Arabic hint «تعذّر تحميل هذا الرقم» in that tile instead
of 0 (admin x4, teacher x2 + classrooms chip). Failed secondary lookups → tone=error
EmptyState above still-populated tables (admin children/subscriptions, parent/children).
4 pages' inline zero-row text → shared EmptyState. Full build green — also cleared
held P0-13. Review passed.
next: P0-14 added — teacher "الحاضرون اليوم" tile still shows 0 silently if the
enrollments query fails.

## 2026-09-08 — Teacher dashboard derived tile (P0-14)
agent: ui-agent · status: done
files: src/app/teacher/page.tsx
notes: الحاضرون اليوم tile failed flag now presentFailed || Boolean(enrollmentsError)
so a failed child_classrooms query shows «تعذّر تحميل هذا الرقم» not 0. First pass
also made 3 out-of-scope edits (sibling tile flag, invented classrooms banner, h1
reflow); a narrow revert pass stripped them. Re-review passed all gates, diff now
only the الحاضرون اليوم tile.
next: —

## 2026-09-08 — PWA foundation (P1-1)
agent: mobile-agent · status: done
files: src/app/manifest.ts (new), public/icons/{icon-192,icon-512,icon-maskable-192,
icon-maskable-512}.png (new)
notes: manifest.ts default-exports a MetadataRoute.Manifest fn, served at
/manifest.webmanifest. Arabic name/short_name, lang ar / dir rtl / standalone,
theme #2563eb + background #ffffff resolved from globals.css vars to literal hex.
Icons are PLACEHOLDERS — solid #2563eb + white mark, generated via node zlib, no
new dep. Review passed all gates.
next: P1-5 added — wire manifest/apple-touch-icon/theme-color meta into root
layout + swap placeholder icons for real artwork.

## 2026-09-08 — Service worker (P1-2)
agent: mobile-agent · status: done
files: public/sw.js (new), public/offline.html (new),
src/components/pwa/service-worker-register.tsx (new), src/app/layout.tsx
notes: Hand-written SW, no deps. CACHE="roudha-v1"; precache = offline.html +
manifest + 4 icons (NOT "/", it redirects to an authed dashboard). Navigations
under /admin /teacher /parent are network-only → /offline.html on failure, never
cache-read/written — closes the review's authed-HTML-in-cache leak. Other nav is
network-first→cache→offline. fetch bails on cross-origin + supabase host +
Authorization + access_token/code. Static assets cache-first, 200/non-opaque only.
Registrar is prod-only + "serviceWorker" in navigator guarded. Re-review PASS, no
exploitable leak. Minor open note: fix leans on opaqueredirect being rejected by
isCacheable for the /,/login → dashboard hop; fine under standard semantics.
next: —

## 2026-09-08 — Install prompt (P1-3)
agent: feature-agent · status: done
files: src/components/pwa/install-prompt-button.tsx (new), src/components/nav/app-shell.tsx
notes: «ثبّت التطبيق» outline Button, min-h-[44px], mounted once in the md:hidden
mobile header next to SignOutButton. Stashes beforeinstallprompt (preventDefault),
renders null until then; click → prompt() → await userChoice → clear. Hidden when
display-mode:standalone / iOS navigator.standalone / after appinstalled. All
window access in useEffect, listeners cleaned up. Local BeforeInstallPromptEvent
type (not in DOM lib). Review PASS. Minors → P1-6: no try/catch around prompt(),
button is mobile-header-only.
next: P1-6 added (install-prompt polish).

## 2026-09-08 — Mobile pass: primitives + reference page (P1-4)
agent: ui-agent · status: done (shared mechanism; per-page sweep → P1-7/P1-8)
files: src/app/globals.css, src/app/layout.tsx (viewport-fit=cover only),
src/components/nav/{app-shell,sidebar-nav}.tsx, src/components/auth/sign-out-button.tsx,
src/components/ui/{button,field,modal}.tsx, src/components/ui/responsive-table.tsx (new),
src/app/admin/staff/{page.tsx,edit-teacher-dialog.tsx}
notes: Shell gets env(safe-area-inset-*) padding + overflow-x-hidden/min-w-0.
Modal is a slide-up bottom sheet < sm (focus trap/Escape/backdrop/focus-restore
intact, 44px close), centered dialog sm+. Button/Field min-h-[44px]. New generic
<ResponsiveTable> (real table md+, stacked labelled cards below); /admin/staff is
the reference conversion, query untouched. RTL scan clean, no physical direction
classes. Review PASS all gates.
next: P1-7 (table→card sweep, 6 pages), P1-8 (schedule/attendance grids mobile).

## 2026-09-09 — commit + Vercel deploy guide
agent: — (orchestrator) + mobile-agent · status: done
files: docs/deploy-vercel.md (new, uncommitted); commit 6914906 "PWA foundation +
P0 completion" (63 files) — NOT pushed, user's call.
notes: User picked Vercel for hosting. Guide covers import, the 4 env vars
(placeholders only), the NEXT_PUBLIC_SITE_URL chicken/egg, post-deploy checks,
Supabase Auth URL config. P2 stays blocked until the user pushes + deploys +
returns the production URL.
next: P2-2 (Capacitor shell) once the URL exists.

## 2026-09-17 — Deployed to Vercel (P2-1)
agent: — (user, guided by orchestrator) · status: done
files: none (ops only)
notes: Deploy hit 3 issues in sequence, all resolved: (1) NEXT_PUBLIC_* vars set
as Vercel "Sensitive" type aren't inlined at build time → middleware crashed with
"Invalid supabaseUrl"; fixed by re-adding as plain Config vars. (2) Git repo was
connected to Vercel after the initial commit, so no deployment ever triggered —
fixed with an empty commit + push to fire the webhook. (3) trailing
whitespace/quotes risk in copy-pasted Supabase URL — re-copied via Supabase
dashboard. Production URL confirmed working end-to-end by the user.
next: production URL = https://kindergarten-management-app.vercel.app/ — needed
for P2-2 (Capacitor).

## 2026-09-17 — Currency MAD → DZD (P0-15)
agent: feature-agent · status: done
files: src/lib/currency.ts (new), src/app/admin/subscriptions/{page.tsx,
subscription-dialog.tsx,actions.ts}, src/app/parent/subscription/page.tsx
notes: New formatCurrency(amount) renders grouped-number + literal «د.ج»,
ignoring the stored currency column entirely — so existing rows with
currency='MAD' display correctly too, no migration needed. New/edited
subscriptions now default to storing "DZD". Review PASS, zero remaining
MAD/د.م hits in src/. Fix is LOCAL ONLY — not yet pushed/deployed.
next: P0-16 added — subscriptions.currency column + dialog input are now
vestigial, decide keep vs. drop.

## HANDOFF
in flight: nothing — P1-1, P0-14, P1-2, P1-3, P1-4, P2-1, P0-15 done this
session; P0-15 fix is committed... NO — check before assuming, it may still be
uncommitted (verify with `git status` next session).
state: production is live at https://kindergarten-management-app.vercel.app/
but does NOT yet have the P0-15 currency fix (that's local/uncommitted). User
must commit + push + Vercel auto-redeploys before the site shows DZD.
next item: get the currency fix pushed live, then P2-2 (Capacitor Android shell)
now that the production URL exists. Remaining non-blocking: P1-5..P1-8, P0-16.
state: P1 core landed — app is installable (manifest + install button), offline-
capable (SW, no authed HTML cached), and has a mobile shell (safe area, bottom
sheets, 44px targets, ResponsiveTable). Remaining P1 is repetitive per-page
polish: P1-7 (6 list pages → cards), P1-8 (6 schedule/attendance grids), plus
P1-5 (real icons + head tags) and P1-6 (install-prompt try/catch). All are
ui/mobile-agent, no blockers.
P2 (Android APK) is BLOCKED on the user: P2-1 needs a hosting choice + the
deployed production URL before Capacitor can point at it.
Working tree holds every uncommitted change from P0-6 onward + all P1 work —
nothing committed this session (no commit requested).
next item: P1-7 (table→card sweep) — or P2-1 once the user gives hosting + URL.
Start a fresh session and run /dev-loop.

## 2026-09-17 — Currency fix MAD→DZD (P0-15)
agent: feature-agent (already implemented before this session; review-agent verified)
· status: done
files: src/lib/currency.ts (new), src/app/admin/subscriptions/{actions.ts,
page.tsx,subscription-dialog.tsx}, src/app/parent/subscription/page.tsx
notes: Shared formatCurrency() in src/lib/currency.ts (Intl.NumberFormat, no new
dep) renders DZD/«د.ج» everywhere; no per-page reimplementation. Grep confirmed
zero remaining MAD/د.م/درهم in src/. Gates green (type-check/lint/build).
Minor non-blocking nit: subscription-dialog.tsx still has a free-text `currency`
DB field the UI ignores when displaying — not in scope, flagged for later if the
app stays single-currency (candidate: hide/remove that input).
docs/deploy-vercel.md remains untracked from the 2026-09-09 session, unrelated
to this item — still just sitting there, not yet committed or discarded.
next: P0-16 filed — vestigial currency column/input cleanup.

## 2026-09-17 — Vestigial currency field removed (P0-16)
agent: feature-agent · status: done
files: src/app/admin/subscriptions/{subscription-dialog.tsx,actions.ts}
notes: Decision taken without asking the user (low-risk, reversible): kept the
`subscriptions.currency` DB column as-is (no migration — app is single-currency,
not worth the churn), removed the dead free-text currency input from the dialog,
createSubscription/updateSubscription now write currency:'DZD' as a literal
instead of trusting client formData. Review PASS, scope tight (2 files only).
next: —

NOTE for next session: this session found .claude/BACKLOG.md and
.claude/PROGRESS.md had been edited by something else mid-run (a P0-15 log
block + a since-stale HANDOFF appeared between reads, before any commit was
made) — likely another Claude Code session open on this same working
directory. No conflicting code changes resulted this time, but if you see
duplicate/out-of-order entries above, that's why. Worth checking whether
another /dev-loop session is running in parallel before continuing.

## 2026-09-17 — Install-prompt polish (P1-6)
agent: feature-agent · status: done
files: src/components/pwa/install-prompt-button.tsx
notes: try/catch/finally around prompt()/userChoice; finally unconditionally
clears the captured beforeinstallprompt event, so the button disappears after
one click on accept, dismiss, or a rejected/thrown promise. Decided against a
desktop/sidebar mount — desktop Chrome/Edge already show a native install
affordance in the omnibox; button stays md:hidden (mobile-only), confirmed in
app-shell.tsx. Review PASS: type-check/lint/build clean, diff scoped to one
file.
next: —

## 2026-09-17 — Manifest/icon head tags + real icon artwork (P1-5)
agent: mobile-agent · status: done
files: src/app/layout.tsx, public/icons/{icon-192,icon-512,
icon-maskable-192,icon-maskable-512}.png
notes: layout.tsx metadata/viewport exports now emit manifest link,
apple-touch-icon, sized icon links, and theme-color (#2563eb, matches
globals.css/manifest.ts) via Next 15 Metadata API. No brand logo existed in
repo, so new artwork was generated (white graduation-cap glyph on full-bleed
brand-color background; maskable variants scaled down to stay inside
Android's safe zone) via a throwaway script, deleted after use — no new
dependency. manifest.ts icon filenames untouched. Review PASS: verified
prerendered head tags, valid PNG dimensions, type-check/lint/build clean, diff
scoped to the 2 file groups.
next: —

## 2026-09-17 — Schedule + attendance grid mobile (P1-8)
agent: ui-agent · status: done
files: src/app/admin/schedule/schedule-editor.tsx,
src/app/admin/attendance/attendance-board.tsx,
src/app/admin/attendance/page.tsx,
src/app/teacher/attendance/teacher-attendance-board.tsx
notes: weekly-schedule.tsx already stacked per-day below sm (pre-existing from
P1-4), and attendance boards already used wrapped per-child buttons rather
than a true grid, so no restructuring was needed. Real gap was touch-target
size — bumped classroom pills/status buttons/history link to min-h-[44px].
RTL scroll direction confirmed correct via dir="rtl" on <html>. Review PASS:
build/type-check/lint clean, diff scoped, zero overlap with parallel P1-7.
next: optional polish — scroll-shadow affordance for weekly-schedule.tsx's
tablet-portrait horizontal scroll (not blocking, not filed as a new item).

## 2026-09-17 — Table→card sweep (P1-7)
agent: ui-agent · status: done
files: src/app/admin/children/page.tsx, src/app/admin/parents/page.tsx,
src/app/admin/classrooms/page.tsx, src/app/admin/subscriptions/page.tsx,
src/app/admin/attendance/history/page.tsx, src/app/teacher/children/page.tsx
notes: Mechanical <table> -> ResponsiveTable conversion on all 6 pages,
columns/actions/empty/error states preserved. classrooms page's error+empty
render was a pre-existing non-exclusive bug, now a single error/empty/table
ternary. attendance/history header badges became plain text
(ATTENDANCE_STATUS_LABEL) because ResponsiveColumn.header has no render hook
— cosmetic only, cell data untouched.
Review initially reported a "blocker" (currency field removal / hardcoded
DZD / new currency.ts as unauthorized scope creep on subscriptions/actions.ts
+ subscription-dialog.tsx + parent/subscription/page.tsx) — this was a
misattribution: those are small pre-existing diffs from the earlier P0-15/
P0-16 session (already reviewed PASS, logged above), not new work by this
agent. Confirmed via `git diff --stat`: this agent's own file
(subscriptions/page.tsx) has a 144-line table-rewrite diff; actions.ts (7
lines) and subscription-dialog.tsx (35 lines) match P0-16's already-logged
scope exactly. Root cause: nothing has been committed all session, so a
review agent's git diff aggregates every prior session's uncommitted work
together and can misattribute it to whichever item it's reviewing.
next: recommend to the user that reviewed/passed items get committed
periodically, so future review-agent diffs stay scoped to just the item under
test instead of the whole accumulated working tree.

## HANDOFF
in flight: nothing — P1-5, P1-6, P1-7, P1-8 all done this session. P1 (PWA)
section is now fully complete.
state: app is installable, offline-capable, has real branded icons + proper
head tags, install-prompt is hardened, and every list/table page plus every
schedule/attendance grid is mobile-usable (cards or 44px touch targets, no
horizontal page overflow). Production is live at
https://kindergarten-management-app.vercel.app/ (P2-1 done) but the working
tree still has NOTHING committed all session — every P0/P1 change since
2026-09-08 is uncommitted. Recommend committing the reviewed, passed work
before starting P2, both to ship it and so future review-agent diffs stay
scoped to just the item under review instead of the whole accumulated tree
(this session hit a false-positive review "blocker" for exactly that reason,
see P1-7 entry above).
next item: P2-2 (Capacitor Android shell) — ready, deps (P2-1) met. This is a
meaningfully different phase (native tooling, Gradle, Android SDK) — start it
in a fresh session.
Start a fresh session and run /dev-loop again.

## 2026-09-18 — P2-2 Capacitor Android shell
agent: mobile-agent · status: done
files: capacitor.config.ts, capacitor-www/index.html, package.json, package-lock.json, .gitignore, .env.example, src/components/pwa/native-back-button.tsx, src/app/layout.tsx, android/**
notes: appId dz.creche.app, Arabic label «منصة الروضة». Server URL defaults to the Vercel URL; dedicated CAPACITOR_SERVER_URL override (https-only), not NEXT_PUBLIC_SITE_URL which is localhost in dev. Icons/splash generated from public/icons. Gradle not run yet.
next: P2-3 (verify splash style, rename template test packages); P2-4 (allowBackup=false, gitignore comment)

## 2026-09-18 — P2-3 (partial) Android build fixes + status-bar insets
agent: mobile-agent · status: in progress (awaiting user's three-role walkthrough on device)
files: android/gradle.properties, android/settings.gradle, android/gradle/gradle-daemon-jvm.properties, android/app/src/main/res/values/ic_launcher_background.xml, capacitor.config.ts
notes: Project path contains «é» -> android.overridePathCheck=true. Capacitor needs JDK 21 (JDK 17 too old, Android Studio's JDK 25 too new for Gradle 8.14); build from CLI with JAVA_HOME=C:\Users\sabdo\.jdks\jbr-21.0.11. Status-bar overlap fixed via SystemBars insetsHandling "css" + viewport-fit cover. Debug APK builds and installs via adb on the user's Samsung; login screen renders. Review PASS.
next: user confirms admin/teacher/parent walkthrough + back button, then tick P2-3

## 2026-09-18 — P2-3 (remainder) test package rename + splash/icon check
agent: mobile-agent · status: done (agent-side); item stays open for the device walkthrough
files: android/app/src/test/java/dz/creche/app/ExampleUnitTest.java, android/app/src/androidTest/java/dz/creche/app/ExampleInstrumentedTest.java
notes: Template test packages renamed com.getcapacitor.myapp -> dz.creche.app; instrumented test now asserts the real applicationId. Splash theme and adaptive icon resources verified consistent, no fix needed. assembleDebug + unit/androidTest compile pass. Review PASS.
next: user runs admin/teacher/parent walkthrough + back button on device, then tick P2-3; optional low-priority: AppTheme in styles.xml references undefined colorPrimary/colorPrimaryDark/colorAccent (unused by manifest, resolves from a library)

## 2026-09-18 — P2-5 Parent home children card fails to load
agent: feature-agent · status: done
files: src/app/parent/page.tsx, src/app/parent/attendance/page.tsx
notes: Found on device (APK), reproduces on web too. Root cause PGRST201: children↔classrooms became ambiguous once migration 0003 added child_classrooms; fixed by naming the FK `classrooms!children_classroom_id_fkey(name)`. Not an RLS or APK issue. Review PASS (type-check, lint, build).
next: P2-6 (same embed in src/app/admin/parents/page.tsx:28)

## 2026-09-18 — P2-6 Admin parents page ambiguous embed
agent: feature-agent · status: done
files: src/app/admin/parents/page.tsx
notes: Same PGRST201 fix as P2-5 (`classrooms!children_classroom_id_fkey(name)`). Verified live as the admin test user (old select errors, new returns 10 rows). Sweep of src/ finds no other un-hinted children→classrooms embed. Review PASS.
next: user re-installs the APK (or reloads) and confirms parent home shows children, then finishes the three-role walkthrough to tick P2-3

## 2026-09-18 — P2-7 Mobile navigation drawer
agent: ui-agent · status: done
files: src/components/nav/mobile-nav-drawer.tsx, src/components/nav/app-shell.tsx, src/components/nav/sidebar-nav.tsx, src/app/globals.css
notes: Found on device: below md the sidebar was hidden with no replacement, so admin reached 3 areas and teacher/parent none. Hamburger in the mobile header opens an RTL drawer (all roles, reuses SidebarNav via onNavigate, includes sign-out). Review 1 found a stale-open bug after hardware-back (drawer re-opens on later visit); fixed by render-phase reset; review 2 PASS. Only verified by reading code + gates, not at runtime.
next: user pushes, redeploys, checks the drawer on the phone for all three roles, then P2-3 can be ticked

## 2026-09-18 — P2-3 Debug APK (closed)
agent: user + mobile-agent · status: done
files: —
notes: User confirmed on a Samsung device: back button works, all three roles work after P2-5/P2-6/P2-7 fixes (children embed, admin embed, mobile nav drawer).
next: P2-4
