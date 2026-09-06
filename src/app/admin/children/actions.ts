"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export async function createChild(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const dob = String(formData.get("date_of_birth") ?? "").trim();
  const classroomId = String(formData.get("classroom_id") ?? "").trim();
  const allergies = String(formData.get("allergies") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "").trim();

  if (!firstName || !lastName || !dob) {
    return { error: "الاسم الأول واسم العائلة وتاريخ الميلاد حقول مطلوبة." };
  }

  const supabase = await createClient();

  const { data: child, error } = await supabase
    .from("children")
    .insert({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob,
      classroom_id: classroomId || null,
      allergies: allergies || null,
    })
    .select("id")
    .single();

  if (error || !child) {
    return { error: error?.message ?? "تعذّر إضافة الطفل." };
  }

  if (parentId) {
    const { error: linkError } = await supabase.from("guardians").insert({
      child_id: child.id,
      parent_id: parentId,
      relationship: relationship || null,
      is_primary: true,
    });
    if (linkError) {
      return {
        error: `تمت إضافة الطفل، لكن تعذّر ربط ولي الأمر: ${linkError.message}`,
      };
    }
  }

  revalidatePath("/admin/children");
  revalidatePath("/admin");
  return { ok: true };
}
