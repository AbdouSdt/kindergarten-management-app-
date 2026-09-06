"use server";

import { revalidatePath } from "next/cache";

import { assertStaff, getTeacherClassroomIds } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

export async function saveAttendance(input: {
  date: string;
  entries: { childId: string; status: AttendanceStatus }[];
}): Promise<{ error?: string; ok?: boolean; count?: number }> {
  let profile;
  try {
    profile = await assertStaff();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  if (!input.date || input.entries.length === 0) {
    return { error: "لا توجد بيانات للحفظ." };
  }

  const supabase = await createClient();
  const childIds = input.entries.map((e) => e.childId);

  // Admins may record attendance anywhere; teachers only for their own classrooms.
  if (profile.role !== "admin") {
    const classroomIds = await getTeacherClassroomIds(profile.id);
    if (classroomIds.length === 0) {
      return { error: "لم تُسنَد إليك فصول بعد." };
    }

    const { data: links } = await supabase
      .from("child_classrooms")
      .select("child_id, classroom_id")
      .in("child_id", childIds)
      .in("classroom_id", classroomIds);

    const allowed = new Set((links ?? []).map((l) => l.child_id));
    if (childIds.some((id) => !allowed.has(id))) {
      return { error: "لا يمكنك تسجيل حضور أطفال خارج فصولك." };
    }
  }

  const rows = input.entries.map((e) => ({
    child_id: e.childId,
    date: input.date,
    status: e.status,
    recorded_by: profile.id,
  }));

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "child_id,date" });

  if (error) return { error: error.message };

  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher");
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/parent/attendance");
  return { ok: true, count: rows.length };
}
