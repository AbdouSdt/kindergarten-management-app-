"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
