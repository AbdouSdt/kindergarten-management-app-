"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

export async function saveAttendance(input: {
  date: string;
  entries: { childId: string; status: AttendanceStatus }[];
}): Promise<{ error?: string; ok?: boolean; count?: number }> {
  let recordedBy: string;
  try {
    recordedBy = (await assertAdmin()).id;
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  if (!input.date || input.entries.length === 0) {
    return { error: "لا توجد بيانات للحفظ." };
  }

  const supabase = await createClient();

  const rows = input.entries.map((e) => ({
    child_id: e.childId,
    date: input.date,
    status: e.status,
    recorded_by: recordedBy,
  }));

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "child_id,date" });

  if (error) return { error: error.message };

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/parent/attendance");
  return { ok: true, count: rows.length };
}
