import type { Metadata } from "next";
import Link from "next/link";

import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import { AttendanceBoard } from "./attendance-board";

export const metadata: Metadata = { title: "الحضور اليومي" };

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: classrooms, error: loadError } = await supabase
    .from("classrooms")
    .select("id, name")
    .order("name");

  const list = classrooms ?? [];
  const date = sp.date || todayISO();
  const selectedClassroom =
    sp.classroom && list.some((c) => c.id === sp.classroom)
      ? sp.classroom
      : (list[0]?.id ?? null);

  let childrenList: { id: string; first_name: string; last_name: string }[] = [];
  const initial: Record<string, AttendanceStatus> = {};

  if (selectedClassroom) {
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
      const { data: rows } = await supabase
        .from("attendance")
        .select("child_id, status")
        .eq("date", date)
        .in(
          "child_id",
          childrenList.map((c) => c.id),
        );
      for (const r of rows ?? []) initial[r.child_id] = r.status;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">الحضور اليومي</h1>
          <p className="text-muted-foreground text-sm">
            اختر الفصل والتاريخ، علّم حالة كل طفل، ثم احفظ.
          </p>
        </div>
        <Link
          href="/admin/attendance/history"
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          سجل الحضور
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
        <AttendanceBoard
          key={`${selectedClassroom}-${date}`}
          classrooms={list}
          selectedClassroom={selectedClassroom}
          date={date}
          childrenList={childrenList}
          initial={initial}
        />
      )}
    </div>
  );
}
