"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

function revalidateClassrooms() {
  revalidatePath("/admin/classrooms");
  revalidatePath("/admin");
  revalidatePath("/admin/staff");
  revalidatePath("/admin/children");
}

type ParsedForm = { name: string; capacity: number };

function parseForm(formData: FormData): ParsedForm | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  if (!name || !capacityRaw) {
    return { error: "الاسم والسعة حقلان مطلوبان." };
  }

  const capacity = Number(capacityRaw);
  if (!Number.isInteger(capacity) || capacity < 1) {
    return { error: "السعة يجب أن تكون عدداً صحيحاً أكبر من صفر." };
  }

  return { name, capacity };
}

export async function createClassroom(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const parsed = parseForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("classrooms").insert({
    name: parsed.name,
    capacity: parsed.capacity,
  });

  if (error) return { error: error.message };

  revalidateClassrooms();
  return { ok: true };
}

export async function updateClassroom(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "معرّف الفصل مفقود." };

  const parsed = parseForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase
    .from("classrooms")
    .update({ name: parsed.name, capacity: parsed.capacity })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateClassrooms();
  return { ok: true };
}

export async function deleteClassroom(
  id: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  if (!id) return { error: "معرّف الفصل مفقود." };

  const supabase = await createClient();

  // Re-derive dependents server-side — a hidden button is not enforcement.
  const [enrolledRes, teachersRes, slotsRes] = await Promise.all([
    supabase
      .from("child_classrooms")
      .select("child_id", { count: "exact", head: true })
      .eq("classroom_id", id),
    supabase
      .from("classroom_teachers")
      .select("teacher_id", { count: "exact", head: true })
      .eq("classroom_id", id),
    supabase
      .from("schedule_slots")
      .select("id", { count: "exact", head: true })
      .eq("classroom_id", id),
  ]);

  if (enrolledRes.error) return { error: enrolledRes.error.message };
  if (teachersRes.error) return { error: teachersRes.error.message };
  if (slotsRes.error) return { error: slotsRes.error.message };

  if ((enrolledRes.count ?? 0) > 0) {
    return {
      error: "لا يمكن حذف فصل يضم أطفالاً مسجّلين. انقل الأطفال أولاً.",
    };
  }
  if ((teachersRes.count ?? 0) > 0) {
    return {
      error: "لا يمكن حذف فصل مُسند إلى أستاذ. أزل الإسناد أولاً.",
    };
  }
  if ((slotsRes.count ?? 0) > 0) {
    return {
      error:
        "لا يمكن حذف فصل مرتبط بحصص في الجدول الأسبوعي. احذف الحصص أولاً.",
    };
  }

  const { error } = await supabase.from("classrooms").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateClassrooms();
  return { ok: true };
}
