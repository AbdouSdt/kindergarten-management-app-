"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

function revalidateSchedule() {
  revalidatePath("/admin/schedule");
  revalidatePath("/parent/schedule");
  revalidatePath("/teacher/schedule");
}

type ParsedSlot = {
  classroom_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  title: string;
  teacher_id: string | null;
};

function parseSlot(formData: FormData): { error: string } | ParsedSlot {
  const classroom_id = String(formData.get("classroom_id") ?? "").trim();
  const weekdayRaw = String(formData.get("weekday") ?? "").trim();
  const starts_at = String(formData.get("starts_at") ?? "").trim();
  const ends_at = String(formData.get("ends_at") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const teacher_id = String(formData.get("teacher_id") ?? "").trim() || null;

  if (!classroom_id) return { error: "الفصل مطلوب." };

  const weekday = Number(weekdayRaw);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { error: "اليوم غير صالح." };
  }

  if (!starts_at || !ends_at) {
    return { error: "وقت البداية ووقت النهاية مطلوبان." };
  }
  if (!title) return { error: "العنوان مطلوب." };

  if (ends_at <= starts_at) {
    return { error: "وقت النهاية يجب أن يكون بعد وقت البداية." };
  }

  return { classroom_id, weekday, starts_at, ends_at, title, teacher_id };
}

export async function createSlot(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const parsed = parseSlot(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_slots").insert(parsed);
  if (error) return { error: error.message };

  revalidateSchedule();
  return { ok: true };
}

export async function updateSlot(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "معرّف الحصة مفقود." };

  const parsed = parseSlot(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_slots")
    .update(parsed)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateSchedule();
  return { ok: true };
}

export async function deleteSlot(
  id: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  if (!id) return { error: "معرّف الحصة مفقود." };

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_slots").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateSchedule();
  return { ok: true };
}
