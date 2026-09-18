"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Cycle = Database["public"]["Enums"]["subscription_cycle"];
type Status = Database["public"]["Enums"]["subscription_status"];

const CYCLES: Cycle[] = ["monthly", "termly", "annual"];
const STATUSES: Status[] = ["active", "overdue", "paused", "cancelled"];

function revalidateSubscriptions() {
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");
  revalidatePath("/parent");
  revalidatePath("/parent/subscription");
}

type ParsedForm = {
  childId: string;
  planName: string;
  amount: number;
  cycle: Cycle;
  status: Status;
  startDate: string;
  endDate: string | null;
  notes: string | null;
};

function parseForm(formData: FormData): ParsedForm | { error: string } {
  const childId = String(formData.get("child_id") ?? "").trim();
  const planName = String(formData.get("plan_name") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const cycle = String(formData.get("cycle") ?? "") as Cycle;
  const status = String(formData.get("status") ?? "") as Status;
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!childId || !planName || !amountRaw || !startDate) {
    return { error: "الطفل واسم الخطة والمبلغ وتاريخ البداية حقول مطلوبة." };
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "المبلغ غير صالح." };
  }
  if (!CYCLES.includes(cycle)) {
    return { error: "الدورة غير صالحة." };
  }
  if (!STATUSES.includes(status)) {
    return { error: "الحالة غير صالحة." };
  }
  if (endDate && endDate < startDate) {
    return { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية." };
  }

  return {
    childId,
    planName,
    amount,
    cycle,
    status,
    startDate,
    endDate: endDate || null,
    notes: notes || null,
  };
}

export async function createSubscription(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let adminId: string;
  try {
    adminId = (await assertAdmin()).id;
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const parsed = parseForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").insert({
    child_id: parsed.childId,
    plan_name: parsed.planName,
    amount: parsed.amount,
    currency: "DZD",
    cycle: parsed.cycle,
    status: parsed.status,
    start_date: parsed.startDate,
    end_date: parsed.endDate,
    notes: parsed.notes,
    created_by: adminId,
  });

  if (error) return { error: error.message };

  revalidateSubscriptions();
  return { ok: true };
}

export async function updateSubscription(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "معرّف الاشتراك مفقود." };

  const parsed = parseForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      child_id: parsed.childId,
      plan_name: parsed.planName,
      amount: parsed.amount,
      currency: "DZD",
      cycle: parsed.cycle,
      status: parsed.status,
      start_date: parsed.startDate,
      end_date: parsed.endDate,
      notes: parsed.notes,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateSubscriptions();
  return { ok: true };
}

export async function deleteSubscription(
  id: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "غير مصرح لك بهذا الإجراء." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateSubscriptions();
  return { ok: true };
}
