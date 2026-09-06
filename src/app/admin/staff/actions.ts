"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function revalidateAll() {
  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  revalidatePath("/teacher");
  revalidatePath("/teacher/children");
  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher/schedule");
}

export async function createTeacher(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const classroomIds = formData
    .getAll("classroom_ids")
    .map((v) => String(v))
    .filter(Boolean);

  if (!fullName || !email || !password) {
    return { error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة." };
  }
  if (password.length < 8) {
    return { error: "يجب أن تكون كلمة المرور 8 أحرف على الأقل." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "teacher" },
  });

  if (error || !data.user) {
    const msg = error?.message ?? "";
    if (/already|exists|registered/i.test(msg)) {
      return { error: "هذا البريد الإلكتروني مسجّل بالفعل." };
    }
    return { error: msg || "تعذّر إنشاء الحساب." };
  }

  await admin
    .from("profiles")
    .update({ role: "teacher", full_name: fullName, phone: phone || null })
    .eq("id", data.user.id);

  if (classroomIds.length) {
    await admin.from("classroom_teachers").insert(
      classroomIds.map((classroom_id) => ({
        teacher_id: data.user.id,
        classroom_id,
      })),
    );
  }

  revalidateAll();
  return { ok: true };
}

export async function assignClassroom(input: {
  teacherId: string;
  classroomId: string;
}): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  if (!input.teacherId || !input.classroomId) {
    return { error: "اختر الفصل أولاً." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classroom_teachers")
    .upsert(
      { teacher_id: input.teacherId, classroom_id: input.classroomId },
      { onConflict: "teacher_id,classroom_id" },
    );

  if (error) return { error: error.message };

  revalidateAll();
  return { ok: true };
}

export async function unassignClassroom(input: {
  teacherId: string;
  classroomId: string;
}): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classroom_teachers")
    .delete()
    .eq("teacher_id", input.teacherId)
    .eq("classroom_id", input.classroomId);

  if (error) return { error: error.message };

  revalidateAll();
  return { ok: true };
}
