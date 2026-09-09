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
  // Return the initial password so the dialog renders it from the result, not
  // from a DOM input the form may have already reset.
  return { ok: true, password };
}

export async function updateParent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "معرّف ولي الأمر مفقود." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email) {
    return { error: "الاسم والبريد الإلكتروني مطلوبان." };
  }
  if (password && password.length < 8) {
    return { error: "يجب أن تكون كلمة المرور 8 أحرف على الأقل." };
  }

  const admin = createAdminClient();

  // Re-derive the target's role server-side — never trust the client.
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();
  if (targetError || !target) return { error: "لم يتم العثور على ولي الأمر." };
  if (target.role !== "parent") {
    return { error: "هذا الحساب ليس حساب ولي أمر." };
  }

  const authUpdate: {
    email: string;
    password?: string;
    user_metadata: Record<string, unknown>;
  } = {
    email,
    user_metadata: { full_name: fullName, role: "parent" },
  };
  if (password) authUpdate.password = password;

  const { error: authError } = await admin.auth.admin.updateUserById(
    id,
    authUpdate,
  );
  if (authError) {
    const msg = authError.message ?? "";
    if (/already|exists|registered/i.test(msg)) {
      return { error: "هذا البريد الإلكتروني مسجّل بالفعل." };
    }
    return { error: msg || "تعذّر تحديث الحساب." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", id);
  if (profileError) return { error: profileError.message };

  revalidatePath("/admin/parents");
  revalidatePath("/admin");
  // Hand the freshly reset password back in the result so the dialog can show
  // it once — React 19 may reset the form before a post-submit effect runs.
  return password ? { ok: true, password } : { ok: true };
}

export async function deleteParent(
  id: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  if (!id) return { error: "معرّف ولي الأمر مفقود." };

  const admin = createAdminClient();

  // Re-derive role + dependents server-side — a hidden button is not enforcement.
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();
  if (targetError || !target) return { error: "لم يتم العثور على ولي الأمر." };
  if (target.role !== "parent") {
    return { error: "هذا الحساب ليس حساب ولي أمر." };
  }

  const { count, error: linksError } = await admin
    .from("guardians")
    .select("child_id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (linksError) return { error: linksError.message };

  if ((count ?? 0) > 0) {
    return {
      error:
        "لا يمكن حذف ولي أمر مرتبط بأطفال. أزل ارتباط الأطفال من «إدارة الأطفال» أولاً.",
    };
  }

  // profiles.id references auth.users(id) ON DELETE CASCADE, so deleting the
  // auth user drops the profile row (and revokes all RLS access) with it.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidatePath("/admin/parents");
  revalidatePath("/admin/children");
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
