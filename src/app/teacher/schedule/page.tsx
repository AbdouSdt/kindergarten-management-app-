import type { Metadata } from "next";

import { WeeklySchedule } from "@/components/schedule/weekly-schedule";
import { getProfile, getTeacherClassroomIds } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "استعمال الزمن" };

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">استعمال الزمن</h1>
      <p className="text-muted-foreground text-sm">
        جدول الحصص الأسبوعي لفصولك. للتعديل تواصل مع الإدارة.
      </p>
    </div>
  );
}

export default async function TeacherSchedulePage() {
  const profile = await getProfile();
  const classroomIds = profile
    ? await getTeacherClassroomIds(profile.id)
    : [];

  if (classroomIds.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <p className="text-muted-foreground text-sm">
          لم تُسنَد إليك فصول بعد.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

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

  const classrooms = classroomsRes.data ?? [];
  const slots = slotsRes.data ?? [];
  const teacherName = new Map(
    (teachersRes.data ?? []).map((t): [string, string | null] => [
      t.id,
      t.full_name,
    ]),
  );

  return (
    <div className="space-y-6">
      <Header />
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
    </div>
  );
}
