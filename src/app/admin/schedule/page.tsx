import type { Metadata } from "next";

import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

import { ScheduleEditor } from "./schedule-editor";

export const metadata: Metadata = { title: "استعمال الزمن" };

type SlotRow = {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  title: string;
  teacher_id: string | null;
};

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [classroomsRes, teachersRes] = await Promise.all([
    supabase.from("classrooms").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "teacher")
      .order("full_name"),
  ]);

  const loadError = classroomsRes.error;
  const classrooms = classroomsRes.data ?? [];
  const teachers = teachersRes.data ?? [];

  const selectedClassroom =
    sp.classroom && classrooms.some((c) => c.id === sp.classroom)
      ? sp.classroom
      : (classrooms[0]?.id ?? null);

  let slots: SlotRow[] = [];
  if (selectedClassroom) {
    const { data } = await supabase
      .from("schedule_slots")
      .select("id, weekday, starts_at, ends_at, title, teacher_id")
      .eq("classroom_id", selectedClassroom)
      .order("weekday")
      .order("starts_at");
    slots = data ?? [];
  }

  const teacherName = new Map(
    teachers.map((t): [string, string | null] => [t.id, t.full_name]),
  );

  const slotsWithNames = slots.map((s) => ({
    ...s,
    teacherName: s.teacher_id ? (teacherName.get(s.teacher_id) ?? null) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">استعمال الزمن</h1>
        <p className="text-muted-foreground text-sm">
          جدول الحصص الأسبوعي لكل فصل. أضف الحصص وعدّلها حسب الحاجة.
        </p>
      </div>

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : classrooms.length === 0 ? (
        <EmptyState
          title="لا توجد فصول بعد"
          description="أضف فصلاً أولاً من صفحة الفصول."
        />
      ) : (
        <ScheduleEditor
          key={selectedClassroom ?? "none"}
          classrooms={classrooms}
          teachers={teachers}
          selectedClassroom={selectedClassroom}
          slots={slotsWithNames}
        />
      )}
    </div>
  );
}
