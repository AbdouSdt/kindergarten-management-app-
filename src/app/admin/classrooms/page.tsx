import type { Metadata } from "next";

import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { ResponsiveTable } from "@/components/ui/responsive-table";
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

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : classrooms.length === 0 ? (
        <EmptyState
          title="لا توجد فصول بعد"
          description="اضغط «إضافة فصل» للبدء."
        />
      ) : (
        <ResponsiveTable
          rows={classrooms}
          rowKey={(c) => c.id}
          columns={[
            {
              key: "name",
              header: "الاسم",
              cell: (c) => <span className="font-medium">{c.name}</span>,
            },
            {
              key: "capacity",
              header: "السعة",
              cell: (c) => c.capacity,
            },
            {
              key: "enrolled",
              header: "الأطفال المسجّلون",
              cell: (c) => {
                const enrolled = enrolledCount.get(c.id) ?? 0;
                return (
                  <>
                    {enrolled}
                    {enrolled > c.capacity && (
                      <span className="text-red-600"> (تجاوز السعة)</span>
                    )}
                  </>
                );
              },
            },
            {
              key: "teacher",
              header: "أستاذ مسند",
              cell: (c) =>
                hasTeacher.has(c.id) ? (
                  "نعم"
                ) : (
                  <span className="text-muted-foreground">لا</span>
                ),
            },
            {
              key: "actions",
              header: "إجراءات",
              labelled: false,
              cell: (c) => (
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
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
