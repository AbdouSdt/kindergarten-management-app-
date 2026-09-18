import type { Metadata } from "next";

import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import {
  ATTENDANCE_STATUS_LABEL,
  StatusBadge,
} from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = { title: "الحضور" };

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
type AttendanceRow = {
  id: string;
  child_id: string;
  date: string;
  status: AttendanceStatus;
  check_in_at: string | null;
  check_out_at: string | null;
  note: string | null;
};

const STATUS_ORDER: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
];

function timeOf(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("ar-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function ParentAttendancePage() {
  const supabase = await createClient();

  // RLS limits this to the signed-in parent's own children.
  const { data: childrenData, error: loadError } = await supabase
    .from("children")
    .select(
      "id, first_name, last_name, classrooms!children_classroom_id_fkey(name)",
    )
    .order("first_name");

  const children = childrenData ?? [];
  const childIds = children.map((c) => c.id);

  const { data: recordsData } = childIds.length
    ? await supabase
        .from("attendance")
        .select("id, child_id, date, status, check_in_at, check_out_at, note")
        .in("child_id", childIds)
        .order("date", { ascending: false })
        .limit(365)
    : { data: [] as AttendanceRow[] };

  const records = (recordsData ?? []) as AttendanceRow[];

  const recordsByChild = new Map<string, AttendanceRow[]>();
  for (const row of records) {
    recordsByChild.set(row.child_id, [
      ...(recordsByChild.get(row.child_id) ?? []),
      row,
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">الحضور</h1>
        <p className="text-muted-foreground text-sm">
          سجلّ الحضور والانصراف لأطفالك.
        </p>
      </div>

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : children.length === 0 ? (
        <EmptyState
          title="لا يوجد أطفال مرتبطون بحسابك بعد"
          description="يُرجى التواصل مع إدارة الحضانة."
        />
      ) : null}

      <div className="space-y-6">
        {children.map((child) => {
          const childRecords = recordsByChild.get(child.id) ?? [];
          const counts = STATUS_ORDER.map((status) => ({
            status,
            count: childRecords.filter((r) => r.status === status).length,
          }));

          return (
            <section
              key={child.id}
              className="border-border bg-card overflow-hidden rounded-lg border"
            >
              <header className="border-border flex flex-wrap items-center justify-between gap-2 border-b p-4">
                <div>
                  <h2 className="font-medium">
                    {child.first_name} {child.last_name}
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    {child.classrooms?.name ?? "غير محدد"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {counts.map(({ status, count }) => (
                    <span
                      key={status}
                      className="text-muted-foreground rounded-full border border-border px-2 py-0.5"
                    >
                      {ATTENDANCE_STATUS_LABEL[status]}: {count}
                    </span>
                  ))}
                </div>
              </header>

              {childRecords.length === 0 ? (
                <p className="text-muted-foreground p-4 text-sm">
                  لا توجد سجلّات حضور بعد.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {childRecords.map((row) => {
                    const checkIn = timeOf(row.check_in_at);
                    const checkOut = timeOf(row.check_out_at);
                    return (
                      <li
                        key={row.id}
                        className="flex flex-col gap-1.5 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <StatusBadge status={row.status} />
                          <span className="text-sm">{formatDate(row.date)}</span>
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          {checkIn && <span>الدخول: {checkIn}</span>}
                          {checkOut && <span>الخروج: {checkOut}</span>}
                          {row.note && (
                            <span className="text-foreground">{row.note}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
