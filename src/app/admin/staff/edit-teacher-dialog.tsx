"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/forms";

import { deleteTeacher, updateTeacher } from "./actions";

export type TeacherDefaults = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export function EditTeacherDialog({ teacher }: { teacher: TeacherDefaults }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateTeacher,
    null,
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary inline-flex min-h-[44px] items-center text-sm font-medium hover:underline"
      >
        تعديل
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="تعديل بيانات الأستاذ"
        description="حدّث الاسم أو الهاتف أو البريد الإلكتروني."
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={teacher.id} />

          <Field label="الاسم الكامل" htmlFor="full_name" required>
            <input
              id="full_name"
              name="full_name"
              required
              defaultValue={teacher.name}
              className={controlClass}
            />
          </Field>

          <Field label="البريد الإلكتروني" htmlFor="email" required>
            <input
              id="email"
              name="email"
              type="email"
              required
              dir="ltr"
              defaultValue={teacher.email}
              className={controlClass}
            />
          </Field>

          <Field label="الهاتف" htmlFor="phone">
            <input
              id="phone"
              name="phone"
              dir="ltr"
              defaultValue={teacher.phone}
              className={controlClass}
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

export function DeleteTeacherButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end text-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              `حذف حساب الأستاذ "${name}" نهائياً؟ سيُلغى دخوله وتُزال إسناداته إلى الفصول.`,
            )
          )
            return;
          setError(null);
          startTransition(async () => {
            const res = await deleteTeacher(id);
            if (res.error) setError(res.error);
          });
        }}
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "..." : "حذف"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </span>
  );
}
