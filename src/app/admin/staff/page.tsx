import type { Metadata } from "next";

import {
  EmptyState,
  LOAD_ERROR_HINT,
  LOAD_ERROR_TITLE,
} from "@/components/ui/empty-state";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { createAdminClient, createClient } from "@/lib/supabase/server";

import { AddTeacherDialog } from "./add-teacher-dialog";
import {
  DeleteTeacherButton,
  EditTeacherDialog,
} from "./edit-teacher-dialog";
import { ManageClassroomsDialog } from "./manage-classrooms-dialog";

export const metadata: Metadata = { title: "الطاقم" };

export default async function AdminStaffPage() {
  const supabase = await createClient();

  const [teachersRes, classroomsRes, assignmentsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("role", "teacher")
      .order("full_name"),
    supabase.from("classrooms").select("id, name").order("name"),
    supabase
      .from("classroom_teachers")
      .select("teacher_id, classroom_id"),
  ]);

  const loadError = teachersRes.error;
  const teachers = teachersRes.data ?? [];
  const classrooms = classroomsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  // Emails live in auth.users — read them with the service-role client (best effort).
  const emailById = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email);
    }
  } catch {
    // Service role key missing/invalid — emails fall back to "—".
  }

  const classroomName = new Map(classrooms.map((c) => [c.id, c.name]));
  const assignedByTeacher = new Map<string, { id: string; name: string }[]>();
  for (const a of assignments) {
    assignedByTeacher.set(a.teacher_id, [
      ...(assignedByTeacher.get(a.teacher_id) ?? []),
      { id: a.classroom_id, name: classroomName.get(a.classroom_id) ?? "" },
    ]);
  }

  const allClassrooms = classrooms.map((c) => ({ id: c.id, name: c.name }));

  const assignedFor = (teacherId: string) =>
    (assignedByTeacher.get(teacherId) ?? []).filter((c) => c.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">الطاقم</h1>
          <p className="text-muted-foreground text-sm">
            {teachers.length} أستاذ. أنشئ الحسابات وأسندها إلى الفصول.
          </p>
        </div>
        <AddTeacherDialog classrooms={allClassrooms} />
      </div>

      {loadError ? (
        <EmptyState
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={LOAD_ERROR_HINT}
        />
      ) : teachers.length === 0 ? (
        <EmptyState
          title="لا يوجد أساتذة بعد"
          description="اضغط «إضافة أستاذ» لإنشاء أول حساب."
        />
      ) : (
        <ResponsiveTable
          rows={teachers}
          rowKey={(t) => t.id}
          columns={[
            {
              key: "name",
              header: "الاسم",
              cell: (t) => (
                <span className="font-medium">{t.full_name ?? "—"}</span>
              ),
            },
            {
              key: "email",
              header: "البريد الإلكتروني",
              cell: (t) => <span dir="ltr">{emailById.get(t.id) ?? "—"}</span>,
            },
            {
              key: "phone",
              header: "الهاتف",
              cell: (t) => <span dir="ltr">{t.phone ?? "—"}</span>,
            },
            {
              key: "classrooms",
              header: "الفصول المسندة",
              cell: (t) => {
                const assigned = assignedFor(t.id);
                return assigned.length ? (
                  <span>{assigned.map((c) => c.name).join("، ")}</span>
                ) : (
                  <span className="text-muted-foreground">لا يوجد</span>
                );
              },
            },
            {
              key: "actions",
              header: "إجراءات",
              labelled: false,
              cell: (t) => (
                <span className="flex flex-wrap items-center gap-3">
                  <ManageClassroomsDialog
                    teacher={{ id: t.id, name: t.full_name ?? "الأستاذ" }}
                    assigned={assignedFor(t.id)}
                    allClassrooms={allClassrooms}
                  />
                  <EditTeacherDialog
                    teacher={{
                      id: t.id,
                      name: t.full_name ?? "",
                      email: emailById.get(t.id) ?? "",
                      phone: t.phone ?? "",
                    }}
                  />
                  <DeleteTeacherButton
                    id={t.id}
                    name={t.full_name ?? "الأستاذ"}
                  />
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
