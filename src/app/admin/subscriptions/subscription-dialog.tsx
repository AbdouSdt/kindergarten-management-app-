"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";
import type { Database } from "@/types/database.types";

import {
  createSubscription,
  deleteSubscription,
  updateSubscription,
} from "./actions";

type Cycle = Database["public"]["Enums"]["subscription_cycle"];
type Status = Database["public"]["Enums"]["subscription_status"];

export type SubscriptionChildOption = {
  id: string;
  name: string;
  classroomName: string | null;
};

export type SubscriptionDefaults = {
  id: string;
  child_id: string;
  child_name: string;
  plan_name: string;
  amount: number;
  currency: string;
  cycle: Cycle;
  status: Status;
  start_date: string;
  end_date: string | null;
  notes: string | null;
};

const CYCLE_OPTIONS: { value: Cycle; label: string }[] = [
  { value: "monthly", label: "شهري" },
  { value: "termly", label: "فصلي" },
  { value: "annual", label: "سنوي" },
];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "active", label: "نشط" },
  { value: "overdue", label: "متأخر" },
  { value: "paused", label: "موقوف" },
  { value: "cancelled", label: "ملغى" },
];

function toDateValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function DeleteSubscriptionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-block text-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("حذف هذا الاشتراك؟")) return;
          setError(null);
          startTransition(async () => {
            const res = await deleteSubscription(id);
            if (res.error) setError(res.error);
          });
        }}
        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "..." : "حذف"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </span>
  );
}

export function SubscriptionDialog({
  childrenList,
  subscription,
}: {
  childrenList: SubscriptionChildOption[];
  subscription?: SubscriptionDefaults;
}) {
  const isEdit = Boolean(subscription);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    isEdit ? updateSubscription : createSubscription,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      if (!isEdit) formRef.current?.reset();
    }
  }, [state, isEdit]);

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-primary text-sm font-medium hover:underline"
        >
          تعديل
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>+ إضافة اشتراك</Button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "تعديل الاشتراك" : "إضافة اشتراك"}
        description={
          isEdit
            ? "حدّث بيانات اشتراك هذا الطفل."
            : "أنشئ اشتراكاً جديداً لأحد الأطفال."
        }
      >
        <form ref={formRef} action={formAction} className="space-y-4">
          {subscription && (
            <input type="hidden" name="id" value={subscription.id} />
          )}

          <Field label="الطفل" htmlFor="child_id" required>
            {subscription ? (
              <>
                <input type="hidden" name="child_id" value={subscription.child_id} />
                <input
                  id="child_id"
                  className={controlClass}
                  value={subscription.child_name}
                  disabled
                  readOnly
                />
              </>
            ) : (
              <select
                id="child_id"
                name="child_id"
                required
                defaultValue=""
                className={controlClass}
              >
                <option value="" disabled>
                  — اختر طفلاً —
                </option>
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.classroomName ? ` (${c.classroomName})` : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="اسم الخطة" htmlFor="plan_name" required>
            <input
              id="plan_name"
              name="plan_name"
              required
              defaultValue={subscription?.plan_name ?? ""}
              className={controlClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="المبلغ" htmlFor="amount" required>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={subscription ? String(subscription.amount) : ""}
                className={controlClass}
              />
            </Field>

            <Field label="العملة" htmlFor="currency">
              <input
                id="currency"
                name="currency"
                defaultValue={subscription?.currency ?? "MAD"}
                className={controlClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الدورة" htmlFor="cycle" required>
              <select
                id="cycle"
                name="cycle"
                defaultValue={subscription?.cycle ?? "monthly"}
                className={controlClass}
              >
                {CYCLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="الحالة" htmlFor="status" required>
              <select
                id="status"
                name="status"
                defaultValue={subscription?.status ?? "active"}
                className={controlClass}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تاريخ البداية" htmlFor="start_date" required>
              <input
                id="start_date"
                name="start_date"
                type="date"
                required
                defaultValue={toDateValue(subscription?.start_date ?? null)}
                className={controlClass}
              />
            </Field>

            <Field label="تاريخ النهاية" htmlFor="end_date" hint="اختياري">
              <input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={toDateValue(subscription?.end_date ?? null)}
                className={controlClass}
              />
            </Field>
          </div>

          <Field label="ملاحظات" htmlFor="notes" hint="اختياري">
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={subscription?.notes ?? ""}
              className={`${controlClass} resize-y`}
            />
          </Field>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
