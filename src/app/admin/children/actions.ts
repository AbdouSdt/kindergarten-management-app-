"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { uploadChildPhoto } from "@/lib/storage";

function revalidateChildren() {
  revalidatePath("/admin/children");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/parent");
  revalidatePath("/parent/children");
  revalidatePath("/teacher");
  revalidatePath("/teacher/children");
}

/** Replace a child's classroom links; the first id becomes the primary. */
async function setChildClassrooms(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childId: string,
  classroomIds: string[],
) {
  await supabase.from("child_classrooms").delete().eq("child_id", childId);

  if (classroomIds.length === 0) {
    await supabase
      .from("children")
      .update({ classroom_id: null })
      .eq("id", childId);
    return;
  }

  await supabase.from("child_classrooms").insert(
    classroomIds.map((id, i) => ({
      child_id: childId,
      classroom_id: id,
      is_primary: i === 0,
    })),
  );
  // Keep children.classroom_id in sync as the "primary" classroom.
  await supabase
    .from("children")
    .update({ classroom_id: classroomIds[0] })
    .eq("id", childId);
}

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
  const classroomIds = formData
    .getAll("classroom_ids")
    .map((v) => String(v))
    .filter(Boolean);
  const allergies = String(formData.get("allergies") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "").trim();
  const photo = formData.get("photo");

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
      classroom_id: classroomIds[0] ?? null,
      allergies: allergies || null,
    })
    .select("id")
    .single();

  if (error || !child) {
    return { error: error?.message ?? "تعذّر إضافة الطفل." };
  }

  if (classroomIds.length) {
    await setChildClassrooms(supabase, child.id, classroomIds);
  }

  if (photo instanceof File && photo.size > 0) {
    const res = await uploadChildPhoto(child.id, photo);
    if (res.url) {
      await supabase
        .from("children")
        .update({ photo_url: res.url })
        .eq("id", child.id);
    } else if (res.error) {
      return { error: `تمت إضافة الطفل، لكن تعذّر رفع الصورة: ${res.error}` };
    }
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

  revalidateChildren();
  return { ok: true };
}

export async function updateChild(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const childId = String(formData.get("child_id") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const dob = String(formData.get("date_of_birth") ?? "").trim();
  const classroomIds = formData
    .getAll("classroom_ids")
    .map((v) => String(v))
    .filter(Boolean);
  const allergies = String(formData.get("allergies") ?? "").trim();
  const photo = formData.get("photo");

  if (!childId || !firstName || !lastName || !dob) {
    return { error: "بيانات ناقصة." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("children")
    .update({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob,
      allergies: allergies || null,
    })
    .eq("id", childId);

  if (error) return { error: error.message };

  await setChildClassrooms(supabase, childId, classroomIds);

  if (photo instanceof File && photo.size > 0) {
    const res = await uploadChildPhoto(childId, photo);
    if (res.url) {
      await supabase
        .from("children")
        .update({ photo_url: res.url })
        .eq("id", childId);
    } else if (res.error) {
      return { error: `حُفظت البيانات، لكن تعذّر رفع الصورة: ${res.error}` };
    }
  }

  revalidateChildren();
  return { ok: true };
}
