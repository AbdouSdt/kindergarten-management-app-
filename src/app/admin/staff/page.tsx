import type { Metadata } from "next";

import { createAdminClient, createClient } from "@/lib/supabase/server";

import { AddTeacherDialog } from "./add-teacher-dialog";
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

      {teachers.length === 0 ? (
        <p className="text-muted-foreground text-sm">لا يوجد أساتذة بعد.</p>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-muted-foreground text-start">
              <tr>
                <th className="px-4 py-2.5 font-medium">الاسم</th>
                <th className="px-4 py-2.5 font-medium">البريد الإلكتروني</th>
                <th className="px-4 py-2.5 font-medium">الهاتف</th>
                <th className="px-4 py-2.5 font-medium">الفصول المسندة</th>
                <th className="px-4 py-2.5 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const assigned = (assignedByTeacher.get(t.id) ?? []).filter(
                  (c) => c.name,
                );
                return (
                  <tr key={t.id} className="border-border border-t align-top">
                    <td className="px-4 py-3 font-medium">
                      {t.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {emailById.get(t.id) ?? "—"}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {t.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {assigned.length ? (
                        assigned.map((c) => c.name).join("، ")
                      ) : (
                        <span className="text-muted-foreground">لا يوجد</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ManageClassroomsDialog
                        teacher={{ id: t.id, name: t.full_name ?? "الأستاذ" }}
                        assigned={assigned}
                        allClassrooms={allClassrooms}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
