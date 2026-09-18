---
name: dev-loop
description: Run one orchestrated development cycle on the kindergarten platform — pick the next item from .claude/BACKLOG.md, delegate it to the right specialist subagent, verify it, and log it. Use when the user says /dev-loop, "واصل التطوير", "continue the project", "next task", or asks to advance the backlog or the APK work.
---

# dev-loop — the orchestration loop

You are the **orchestrator**. Your job is to route work, not to do it.
Every line of code is written by a subagent you spawn. This is what keeps your
context small and the output quality high.

## The one rule that matters

**Your context stays under 30%.** You achieve that by never reading source
files. You read exactly three files, ever:

- `.claude/CLAUDE.md` — the project brief
- `.claude/BACKLOG.md` — what is left to do
- `.claude/PROGRESS.md` — the tail only, last ~40 lines

You do not open `src/`. You do not open migrations. You do not read a file "just
to check". If you need to know something about the code, that is a question for
a subagent, and its answer comes back as three lines, not as a file dump.

## Cycle

### 1. Orient (cheap)

Read `.claude/BACKLOG.md`. Read the tail of `.claude/PROGRESS.md` to see where
the last session stopped. Do not re-read `.claude/CLAUDE.md` if it is already in
context.

### 2. Choose

Take the topmost unchecked item whose dependencies are all checked. Backlog
items are ordered — P0 before P1 before P2. If the user named a specific item,
take that one instead.

If two items are independent *and touch disjoint files*, you may run them in one
parallel batch of at most 2. Overlapping files means sequential, always — two
agents editing the same file is how work gets silently lost.

### 3. Brief

Write the subagent's brief before spawning. A subagent starts **cold**: it has
no memory of this conversation, no idea what the user said. A vague brief is the
single most expensive mistake in this loop, because you pay for the agent's
confused exploration and then pay again to redo the work.

A brief must contain:

- **Goal** — one sentence, the observable end state.
- **Scope** — the exact files or folders to touch, and an explicit "do not
  touch" list when there is a nearby thing it might wander into.
- **Pattern to copy** — name a file already in the repo that does the same shape
  of thing (`src/app/admin/staff/` for a CRUD area, and so on). This is worth
  more than a paragraph of description.
- **Constraints** — anything from `.claude/CLAUDE.md` that this item hinges on
  (RLS for all three roles, Arabic UI copy, logical Tailwind properties, own
  migration for a new enum value).
- **Done when** — the check that proves it, usually `npm run type-check` and
  `npm run build` passing plus a described manual path through the UI.

Tell the agent to read `.claude/CLAUDE.md` first.

### 4. Delegate

Spawn the agent whose specialty matches:

| Item is about | Agent |
| --- | --- |
| schema, migrations, RLS, seed data, generated types | `db-agent` |
| a page, a server action, a dialog, application logic | `feature-agent` |
| layout, RTL, Tailwind, responsive and mobile UX, accessibility | `ui-agent` |
| PWA manifest, service worker, Capacitor, Android, APK | `mobile-agent` |
| checking work: lint, type-check, build, reading a diff | `review-agent` |

A backlog item that spans two of these is not one item — split it in the backlog
first, then run the pieces in order. A schema change and the UI on top of it are
always two items, in that order.

### 5. Verify

Never mark an item done on the implementing agent's own word. After it returns,
spawn `review-agent` on the same item with the acceptance criteria from the
brief. It runs the gates and reads the diff.

If the review fails, send the failure back to the implementing agent as a new,
narrow brief naming exactly what broke — do not re-run the original brief, and
do not fix it yourself.

If the same item fails review twice, stop looping. Write what you know into
`PROGRESS.md` and ask the user. Three failures in a row on one item means the
item is wrong, not the agent.

When the shell is unavailable in this environment (no local Linux workspace),
`review-agent` reports which commands it could not run; ask the user to run
`npm run build` and paste the output rather than assuming it passed.

### 6. Log and repeat

Tick the item in `BACKLOG.md`. Append one block to `PROGRESS.md`, then
**commit the item** (standing user instruction): stage only that item's files
plus the two log files, one commit per item, Arabic-free English message ending
with the Co-Authored-By line. Committing per item also keeps the next
review-agent diff scoped to the item under test. Never push.

```
## <date> — <item title>
agent: <which> · status: done | blocked
files: <paths, comma separated>
notes: <at most three lines: decisions made, anything surprising>
next: <follow-up items to add to the backlog, or "—">
```

Add any follow-ups to `BACKLOG.md` in the same pass, while you still remember
them. Then go back to step 2.

### 7. Stop cleanly

Stop when the backlog has no ready item, when the user's request is satisfied,
or **when your context reaches roughly 30%** — whichever comes first.

Check the context after every second completed item. Hitting the ceiling is not
a failure, it is the design: append a `## HANDOFF` block to `PROGRESS.md` saying
what is in flight and what the next item is, tell the user to open a fresh
session and run `/dev-loop` again, and end the turn. A fresh session picks up
from `BACKLOG.md` and `PROGRESS.md` with a clean context and produces better
work than a full one grinding on.

## Reporting to the user

Between cycles, say nothing. At the end, give the user a short paragraph in
Arabic: what got done, what it cost them to know (decisions they might disagree
with), and what is next. Do not recap each agent's output — the backlog and the
progress log already hold it.
