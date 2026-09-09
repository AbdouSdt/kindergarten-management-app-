import type { Metadata } from "next";

import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "استعمال الزمن" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">استعمال الزمن</h1>
        <p className="text-muted-foreground text-sm">
          جدول الحصص الأسبوعي لفصول أطفالك.
        </p>
      </div>
      {children}
    </div>
  );
}

export default async function ParentSchedulePage() {
  const supabase = await createClient();

  // RLS scopes `children` to the current parent's linked kids.
  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id");
  const childIds = (children ?? []).map((c) => c.id);

  if (childrenError) {
    return (
      <Shell>
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      </Shell>
    );
  }

  if (childIds.length === 0) {
    return (
      <Shell>
        <p className="text-muted-foreground text-sm">
          لا يوجد أطفال مرتبطون بحسابك بعد.
        </p>
      </Shell>
    );
  }

  const { data: links } = await supabase
    .from("child_classrooms")
    .select("classroom_id")
    .in("child_id", childIds);

  const classroomIds = [...new Set((links ?? []).map((l) => l.classroom_id))];

  if (classroomIds.length === 0) {
    return (
      <Shell>
        <p className="text-muted-foreground text-sm">
          لا يوجد أطفال مرتبطون بحسابك بعد.
        </p>
      </Shell>
    );
  }

  const [classroomsRes, slotsRes, teachersRes] = await Promise.all([
    supabase.from("classrooms").select("id, name").in("id", classroomIds),
    supabase
      .from("schedule_slots")
      .select(
        "id, classroom_id, weekday, starts_at, ends_at, title, teacher_id",
      )
      .in("classroom_id", classroomIds),
    supabase.from("profiles").select("id, full_name").eq("role", "teacher"),
  ]);

  const loadError = classroomsRes.error ?? slotsRes.error;
  const classrooms = classroomsRes.data ?? [];
  const slots = slotsRes.data ?? [];
  const teacherName = new Map(
    (teachersRes.data ?? []).map((t): [string, string | null] => [
      t.id,
      t.full_name,
    ]),
  );

  if (loadError) {
    return (
      <Shell>
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-8">
        {classrooms.map((room) => {
          const roomSlots = slots
            .filter((s) => s.classroom_id === room.id)
            .map((s) => ({
              id: s.id,
              weekday: s.weekday,
              starts_at: s.starts_at,
              ends_at: s.ends_at,
              title: s.title,
              teacherName: s.teacher_id
                ? (teacherName.get(s.teacher_id) ?? null)
                : null,
            }));

          return (
            <section key={room.id} className="space-y-3">
              <h2 className="text-lg font-medium">{room.name}</h2>
              {roomSlots.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  لم يُضَف جدول لهذا الفصل بعد.
                </p>
              ) : (
                <WeeklySchedule slots={roomSlots} />
              )}
            </section>
          );
        })}
      </div>
    </Shell>
  );
}
