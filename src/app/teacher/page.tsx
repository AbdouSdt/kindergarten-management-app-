import type { Metadata } from "next";

import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { getProfile, getTeacherClassroomIds } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "لوحة الأستاذ" };

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const profile = await getProfile();
  const classroomIds = profile ? await getTeacherClassroomIds(profile.id) : [];

  if (classroomIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">لوحة الأستاذ</h1>
          <p className="text-muted-foreground text-sm">
            نظرة عامة على فصولك المسندة.
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          لم تُسنَد إليك فصول بعد. تواصل مع الإدارة.
        </p>
      </div>
    );
  }

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("id, name")
    .in("id", classroomIds)
    .order("name");

  const { data: enrollments } = await supabase
    .from("child_classrooms")
    .select("child_id")
    .in("classroom_id", classroomIds);
  const childIds = [...new Set((enrollments ?? []).map((r) => r.child_id))];

  let presentToday = 0;
  if (childIds.length) {
    const { count } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "present")
      .in("child_id", childIds);
    presentToday = count ?? 0;
  }

  const stats = [
    { title: "عدد فصولي", value: classroomIds.length },
    { title: "عدد الأطفال في فصولي", value: childIds.length },
    { title: "الحاضرون اليوم", value: presentToday },
  ];

  const classroomNames = (classrooms ?? []).map((c) => c.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">لوحة الأستاذ</h1>
        <p className="text-muted-foreground text-sm">
          نظرة عامة على فصولك المسندة.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardTitle>{s.title}</CardTitle>
            <CardValue>{s.value}</CardValue>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">فصولي</h2>
        <div className="flex flex-wrap gap-2">
          {classroomNames.map((name) => (
            <span
              key={name}
              className="border-border rounded-full border px-3 py-1.5 text-sm"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
