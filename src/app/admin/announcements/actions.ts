"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Audience = Database["public"]["Enums"]["announcement_audience"];

export async function createAnnouncement(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let authorId: string;
  try {
    authorId = (await assertAdmin()).id;
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = (String(formData.get("audience") ?? "all") ||
    "all") as Audience;
  const classroomId = String(formData.get("classroom_id") ?? "").trim();

  if (!title || !body) {
    return { error: "العنوان والنص حقلان مطلوبان." };
  }
  if (audience === "classroom" && !classroomId) {
    return { error: "اختر الفصل عند تحديد جمهور «فصل محدد»." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    audience,
    classroom_id: audience === "classroom" ? classroomId : null,
    author_id: authorId,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/announcements");
  revalidatePath("/admin");
  revalidatePath("/parent/announcements");
  revalidatePath("/parent");
  return { ok: true };
}

export async function deleteAnnouncement(
  id: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/announcements");
  revalidatePath("/parent/announcements");
  return { ok: true };
}
