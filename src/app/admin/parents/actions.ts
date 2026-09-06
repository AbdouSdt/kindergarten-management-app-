"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function revalidateAll() {
  revalidatePath("/admin/parents");
  revalidatePath("/admin/children");
  revalidatePath("/admin");
  revalidatePath("/parent");
  revalidatePath("/parent/children");
  revalidatePath("/parent/attendance");
}

export async function linkChildToParent(input: {
  parentId: string;
  childId: string;
  relationship: string;
}): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  if (!input.parentId || !input.childId) {
    return { error: "اختر الطفل أولاً." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("guardians").upsert(
    {
      parent_id: input.parentId,
      child_id: input.childId,
      relationship: input.relationship.trim() || null,
      is_primary: false,
    },
    { onConflict: "child_id,parent_id" },
  );

  if (error) return { error: error.message };

  revalidateAll();
  return { ok: true };
}

export async function createParent(
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
    user_metadata: { full_name: fullName, role: "parent" },
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
    .update({ role: "parent", full_name: fullName, phone: phone || null })
    .eq("id", data.user.id);

  revalidatePath("/admin/parents");
  revalidatePath("/admin");
  return { ok: true };
}

export async function unlinkChildFromParent(input: {
  parentId: string;
  childId: string;
}): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("guardians")
    .delete()
    .eq("parent_id", input.parentId)
    .eq("child_id", input.childId);

  if (error) return { error: error.message };

  revalidateAll();
  return { ok: true };
}
