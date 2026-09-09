import type { Metadata } from "next";
import Link from "next/link";

import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = { title: "سجل الحضور" };

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

type Tally = Record<AttendanceStatus, number> & { total: number };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartISO() {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

function emptyTally(): Tally {
  return { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
}

export default async function AdminAttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: classrooms, error: loadError } = await supabase
    .from("classrooms")
    .select("id, name")
    .order("name");

  const list = classrooms ?? [];

  // Validate the range params up front — a malformed URL gets the error state,
  // it does not silently fall back.
  const from = sp.from || monthStartISO();
  const to = sp.to || todayISO();
  const badRange =
    (sp.from !== undefined && !DATE_RE.test(sp.from)) ||
    (sp.to !== undefined && !DATE_RE.test(sp.to)) ||
    from > to;

  const selectedClassroom =
    sp.classroom && list.some((c) => c.id === sp.classroom)
      ? sp.classroom
      : (list[0]?.id ?? null);

  let childrenList: { id: string; first_name: string; last_name: string }[] = [];
  let attError: unknown = null;
  const tally = new Map<string, Tally>();
  const schoolDays = new Set<string>();

  if (selectedClassroom && !badRange) {
    // A child may be enrolled in several classrooms — read the junction table.
    const { data: enrolled } = await supabase
      .from("child_classrooms")
      .select("child_id")
      .eq("classroom_id", selectedClassroom);
    const enrolledIds = (enrolled ?? []).map((r) => r.child_id);

    const { data: kids } = enrolledIds.length
      ? await supabase
          .from("children")
          .select("id, first_name, last_name")
          .in("id", enrolledIds)
          .order("first_name")
      : { data: [] as { id: string; first_name: string; last_name: string }[] };
    childrenList = kids ?? [];

    if (childrenList.length) {
      const { data: rows, error } = await supabase
        .from("attendance")
        .select("child_id, status, date")
        .gte("date", from)
        .lte("date", to)
        .in(
          "child_id",
          childrenList.map((c) => c.id),
        );
      attError = error;

      // Aggregate server-side; the client only ever sees the per-child totals.
      for (const r of rows ?? []) {
        schoolDays.add(r.date);
        const t = tally.get(r.child_id) ?? emptyTally();
        t[r.status] += 1;
        t.total += 1;
        tally.set(r.child_id, t);
      }
    }
  }

  const totalRecords = [...tally.values()].reduce((n, t) => n + t.total, 0);
  const linkClass =
    "inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">سجل الحضور</h1>
          <p className="text-muted-foreground text-sm">
            اطّلع على حضور فصل خلال فترة محددة، مع إجمالي أيام الحضور والغياب لكل
            طفل.
          </p>
        </div>
        <Link href="/admin/attendance" className={linkClass}>
          الحضور اليومي
        </Link>
      </div>

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : list.length === 0 ? (
        <EmptyState
          title="لا توجد فصول بعد"
          description="أضف فصلاً أولاً من صفحة الفصول."
        />
      ) : (
        <>
          <form
            className="border-border flex flex-wrap items-end gap-4 rounded-lg border p-4"
          >
            <div className="min-w-[12rem] flex-1">
              <Field label="الفصل" htmlFor="classroom">
                <select
                  id="classroom"
                  name="classroom"
                  defaultValue={selectedClassroom ?? undefined}
                  className={controlClass}
                >
                  {list.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="من" htmlFor="from">
              <input
                id="from"
                name="from"
                type="date"
                dir="ltr"
                defaultValue={from}
                className={controlClass}
              />
            </Field>
            <Field label="إلى" htmlFor="to">
              <input
                id="to"
                name="to"
                type="date"
                dir="ltr"
                defaultValue={to}
                className={controlClass}
              />
            </Field>
            <Button type="submit">عرض</Button>
          </form>

          {badRange ? (
            <EmptyState
              tone="error"
              title="نطاق تاريخ غير صالح"
              description="تأكد من صيغة التاريخ (سنة-شهر-يوم) وأن تاريخ البداية لا يتجاوز تاريخ النهاية."
            />
          ) : attError ? (
            <EmptyState
              tone="error"
              title={LOAD_ERROR_TITLE}
              description={LOAD_ERROR_HINT}
            />
          ) : childrenList.length === 0 ? (
            <EmptyState
              title="لا يوجد أطفال مسجّلون في هذا الفصل"
              description="سجّل أطفالاً في الفصل من صفحة الأطفال."
            />
          ) : totalRecords === 0 ? (
            <EmptyState
              title="لا توجد سجلات حضور في هذه الفترة"
              description="جرّب توسيع نطاق التاريخ أو اختيار فصل آخر."
            />
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                أيام الدراسة المسجّلة في الفترة: {schoolDays.size}
              </p>
              <div className="border-border overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted text-muted-foreground text-start">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">الطفل</th>
                      <th className="px-4 py-2.5 font-medium">
                        <StatusBadge status="present" />
                      </th>
                      <th className="px-4 py-2.5 font-medium">
                        <StatusBadge status="absent" />
                      </th>
                      <th className="px-4 py-2.5 font-medium">
                        <StatusBadge status="late" />
                      </th>
                      <th className="px-4 py-2.5 font-medium">
                        <StatusBadge status="excused" />
                      </th>
                      <th className="px-4 py-2.5 font-medium">أيام مسجّلة</th>
                      <th className="px-4 py-2.5 font-medium">نسبة الغياب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childrenList.map((child) => {
                      const t = tally.get(child.id) ?? emptyTally();
                      const absenceRate = t.total
                        ? `${Math.round((t.absent / t.total) * 100)}%`
                        : "—";
                      return (
                        <tr
                          key={child.id}
                          className="border-border border-t align-top"
                        >
                          <td className="px-4 py-3 font-medium">
                            {child.first_name} {child.last_name}
                          </td>
                          <td className="px-4 py-3">{t.present}</td>
                          <td className="px-4 py-3">{t.absent}</td>
                          <td className="px-4 py-3">{t.late}</td>
                          <td className="px-4 py-3">{t.excused}</td>
                          <td className="px-4 py-3">{t.total}</td>
                          <td className="px-4 py-3">{absenceRate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
