import type { Metadata } from "next";

import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

import {
  ClassroomDialog,
  DeleteClassroomButton,
} from "./classroom-dialog";

export const metadata: Metadata = { title: "الفصول" };

export default async function AdminClassroomsPage() {
  const supabase = await createClient();

  const [classroomsRes, enrollRes, teachersRes] = await Promise.all([
    supabase
      .from("classrooms")
      .select("id, name, capacity")
      .order("name"),
    supabase.from("child_classrooms").select("classroom_id"),
    supabase.from("classroom_teachers").select("classroom_id"),
  ]);

  const loadError = classroomsRes.error;
  const classrooms = classroomsRes.data ?? [];

  const enrolledCount = new Map<string, number>();
  for (const row of enrollRes.data ?? []) {
    enrolledCount.set(
      row.classroom_id,
      (enrolledCount.get(row.classroom_id) ?? 0) + 1,
    );
  }

  const hasTeacher = new Set(
    (teachersRes.data ?? []).map((row) => row.classroom_id),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">الفصول</h1>
          <p className="text-muted-foreground text-sm">
            {classrooms.length} فصل. أنشئ الفصول وحدّد سعتها.
          </p>
        </div>
        <ClassroomDialog />
      </div>

      {loadError && (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      )}

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted text-muted-foreground text-start">
            <tr>
              <th className="px-4 py-2.5 font-medium">الاسم</th>
              <th className="px-4 py-2.5 font-medium">السعة</th>
              <th className="px-4 py-2.5 font-medium">الأطفال المسجّلون</th>
              <th className="px-4 py-2.5 font-medium">أستاذ مسند</th>
              <th className="px-4 py-2.5 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map((c) => {
              const enrolled = enrolledCount.get(c.id) ?? 0;
              return (
                <tr key={c.id} className="border-border border-t align-top">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.capacity}</td>
                  <td className="px-4 py-3">
                    {enrolled}
                    {enrolled > c.capacity && (
                      <span className="text-red-600"> (تجاوز السعة)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {hasTeacher.has(c.id) ? (
                      "نعم"
                    ) : (
                      <span className="text-muted-foreground">لا</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <ClassroomDialog
                        classroom={{
                          id: c.id,
                          name: c.name,
                          capacity: c.capacity,
                        }}
                      />
                      <DeleteClassroomButton id={c.id} name={c.name} />
                    </span>
                  </td>
                </tr>
              );
            })}
            {classrooms.length === 0 && !loadError && (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground px-4 py-10 text-center"
                >
                  لا توجد فصول بعد. اضغط «إضافة فصل» للبدء.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
