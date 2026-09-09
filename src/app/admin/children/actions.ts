"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { deleteChildPhoto, uploadChildPhoto } from "@/lib/storage";

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

export async function deleteChild(
  id: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  if (!id) return { error: "معرّف الطفل مفقود." };

  const supabase = await createClient();

  // Re-derive dependents server-side — a hidden button is not enforcement.
  // Guard here so a raw Postgres FK error never reaches the user.
  const [guardiansRes, enrollRes, subsRes, attendanceRes] = await Promise.all([
    supabase
      .from("guardians")
      .select("parent_id", { count: "exact", head: true })
      .eq("child_id", id),
    supabase
      .from("child_classrooms")
      .select("classroom_id", { count: "exact", head: true })
      .eq("child_id", id),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("child_id", id),
    supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("child_id", id),
  ]);

  if (guardiansRes.error) return { error: guardiansRes.error.message };
  if (enrollRes.error) return { error: enrollRes.error.message };
  if (subsRes.error) return { error: subsRes.error.message };
  if (attendanceRes.error) return { error: attendanceRes.error.message };

  const blockers: string[] = [];
  if ((guardiansRes.count ?? 0) > 0) blockers.push("أولياء أمور مرتبطون");
  if ((enrollRes.count ?? 0) > 0) blockers.push("تسجيلات في فصول");
  if ((subsRes.count ?? 0) > 0) blockers.push("اشتراكات");
  if ((attendanceRes.count ?? 0) > 0) blockers.push("سجلات حضور");

  if (blockers.length > 0) {
    return {
      error: `لا يمكن حذف الطفل لوجود ${blockers.join("، ")}. أزل هذه البيانات أولاً.`,
    };
  }

  const { data: childRow } = await supabase
    .from("children")
    .select("photo_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("children").delete().eq("id", id);
  if (error) return { error: error.message };

  // Best-effort: drop the now-orphaned photo object. Never fails the delete.
  if (childRow?.photo_url) {
    await deleteChildPhoto(childRow.photo_url);
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
  const removePhoto = formData.get("remove_photo") === "1";

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

  const willReplacePhoto = photo instanceof File && photo.size > 0;
  let previousPhotoUrl: string | null = null;
  if (willReplacePhoto || removePhoto) {
    const { data: existing } = await supabase
      .from("children")
      .select("photo_url")
      .eq("id", childId)
      .maybeSingle();
    previousPhotoUrl = existing?.photo_url ?? null;
  }

  if (willReplacePhoto) {
    // A new upload always wins over a "remove photo" request.
    const res = await uploadChildPhoto(childId, photo as File);
    if (res.url) {
      await supabase
        .from("children")
        .update({ photo_url: res.url })
        .eq("id", childId);
      // Best-effort: remove the object the new upload just superseded.
      if (previousPhotoUrl && previousPhotoUrl !== res.url) {
        await deleteChildPhoto(previousPhotoUrl);
      }
    } else if (res.error) {
      return { error: `حُفظت البيانات، لكن تعذّر رفع الصورة: ${res.error}` };
    }
  } else if (removePhoto) {
    await supabase
      .from("children")
      .update({ photo_url: null })
      .eq("id", childId);
    // Best-effort: drop the now-orphaned object.
    if (previousPhotoUrl) {
      await deleteChildPhoto(previousPhotoUrl);
    }
  }

  revalidateChildren();
  return { ok: true };
}
