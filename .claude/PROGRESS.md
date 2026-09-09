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

## HANDOFF
in flight: nothing — P1-1, P0-14, P1-2, P1-3, P1-4 all done and reviewed this
session (5 items).
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
